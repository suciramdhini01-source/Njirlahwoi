"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Square, Sparkles, Star } from "lucide-react";
import { useApiKeyStore } from "@/store/api-key";
import { useChatStore } from "@/store/chat";
import { ModelSelector } from "./ModelSelector";
import { ChatBubble } from "./ChatBubble";
import { ModelSource } from "@/types";
import { NJIR_LAH_MODEL } from "@/store/model";
import { readSSEStream } from "@/lib/read-stream";

export function ChatPanel() {
  const {
    chats,
    activeId,
    hydrate,
    hydrated,
    newChat,
    addMessage,
    updateAssistant,
    setModel,
    streaming,
    setStreaming,
  } = useChatStore();
  const {
    openrouterKey,
    cloudflareToken,
    cloudflareAccountId,
    hydrate: hydrateKeys,
    hydrated: keysHydrated,
  } = useApiKeyStore();

  const [input, setInput] = useState("");
  const [selModel, setSelModel] = useState<{
    id: string;
    source: ModelSource;
    name: string;
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Stable session ID for NJIR LAH usage logging
  const sessionId = useRef(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "anon"
  );

  useEffect(() => {
    if (!hydrated) hydrate();
    if (!keysHydrated) hydrateKeys();
  }, [hydrate, hydrated, hydrateKeys, keysHydrated]);

  // Auto-select NJIR LAH on first load
  useEffect(() => {
    if (!selModel) {
      setSelModel({
        id: NJIR_LAH_MODEL.id,
        source: NJIR_LAH_MODEL.source,
        name: NJIR_LAH_MODEL.name,
      });
    }
  }, []); // eslint-disable-line

  const chat = useMemo(
    () => chats.find((c) => c.id === activeId) || null,
    [chats, activeId]
  );

  useEffect(() => {
    if (chat?.modelId) {
      setSelModel({
        id: chat.modelId,
        source: chat.source,
        name: chat.modelId.split("/").pop() || chat.modelId,
      });
    }
  }, [chat?.id]); // eslint-disable-line

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat?.messages.length, chat?.messages[chat?.messages.length - 1]?.content]); // eslint-disable-line

  const readSSE = async (
    res: Response,
    chatId: string,
    assistantId: string,
    acc: { v: string },
    deltaKey: (json: any) => string | undefined
  ) => {
    if (!res.body) throw new Error("No response body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const delta = deltaKey(json);
          if (delta) {
            acc.v += delta;
            updateAssistant(chatId, assistantId, acc.v);
          }
        } catch {}
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selModel || streaming) return;
    if (selModel.source === "openrouter" && !openrouterKey) return;
    if (selModel.source === "cloudflare" && (!cloudflareToken || !cloudflareAccountId)) return;
    // replit, anthropic, gemini, njiriah: no user key needed

    let chatId: string = activeId || newChat(selModel.id, selModel.source);
    if (activeId && chat && (chat.modelId !== selModel.id || chat.source !== selModel.source)) {
      setModel(chatId, selModel.id, selModel.source);
    }

    const userMsgId = crypto.randomUUID();
    const userContent = input.trim();
    addMessage(chatId, { id: userMsgId, role: "user", content: userContent, createdAt: Date.now() });
    setInput("");

    const assistantId = crypto.randomUUID();
    addMessage(chatId, { id: assistantId, role: "assistant", content: "", createdAt: Date.now() });

    setStreaming(true);
    abortRef.current = new AbortController();

    const prevMessages = [
      ...(chats.find((c) => c.id === chatId)?.messages || []),
      { id: userMsgId, role: "user" as const, content: userContent, createdAt: Date.now() },
    ];
    const apiMessages = prevMessages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const acc = { v: "" };
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      let url = "";
      const body: Record<string, unknown> = {
        model: selModel.id,
        stream: true,
        messages: apiMessages,
      };
      switch (selModel.source) {
        case "njiriah":
          url = "/api/njiriah/chat";
          body.session_id = sessionId.current;
          break;
        case "replit":
          url = "/api/replit/chat";
          break;
        case "anthropic":
          url = "/api/anthropic/chat";
          break;
        case "gemini":
          url = "/api/gemini/chat";
          break;
        case "openrouter":
          url = "/api/openrouter/chat";
          headers["x-api-key"] = openrouterKey;
          break;
        case "cloudflare":
          url = "/api/cloudflare/chat";
          headers["x-cf-token"] = cloudflareToken;
          headers["x-cf-account-id"] = cloudflareAccountId;
          break;
      }
      const res = await fetch(url, {
        method: "POST",
        signal: abortRef.current.signal,
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.text()) || `${selModel.source} error`);
      await readSSEStream(res, (delta) => {
        acc.v += delta;
        updateAssistant(chatId, assistantId, acc.v);
      });
    } catch (e: any) {
      if (e.name !== "AbortError") {
        updateAssistant(chatId, assistantId, acc.v + `\n\n_[Error: ${e.message || "Unknown"}]_`);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  };

  const canSend =
    selModel &&
    (selModel.source === "njiriah" ||
    selModel.source === "replit" ||
    selModel.source === "anthropic" ||
    selModel.source === "gemini"
      ? true
      : selModel.source === "openrouter"
      ? !!openrouterKey
      : !!cloudflareToken && !!cloudflareAccountId);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 p-4 border-b border-white/10 glass-strong">
        <ModelSelector value={selModel} onChange={(m) => setSelModel(m)} />
        <div className="ml-auto flex items-center gap-2">
          <motion.span
            animate={{ scale: streaming ? [1, 1.3, 1] : 1 }}
            transition={{ repeat: streaming ? Infinity : 0, duration: 1 }}
            className={`h-2 w-2 rounded-full ${
              streaming
                ? "bg-neon-cyan shadow-[0_0_8px_#06B6D4]"
                : "bg-green-400 shadow-[0_0_8px_#4ade80]"
            }`}
          />
          <span className="text-xs text-gray-300">{streaming ? "Mengetik..." : "Siap"}</span>
        </div>
      </div>

      <AnimatePresence>
        {streaming && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            className="h-0.5 origin-left bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-pink shimmer"
          />
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-neon px-4 md:px-8 py-6">
        {(!chat || chat.messages.length === 0) && (
          <EmptyState
            canSend={!!canSend}
            onSelectNjir={() =>
              setSelModel({ id: NJIR_LAH_MODEL.id, source: NJIR_LAH_MODEL.source, name: NJIR_LAH_MODEL.name })
            }
          />
        )}
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {chat?.messages.map((m) => <ChatBubble key={m.id} msg={m} />)}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 glass-strong">
        <div className="max-w-3xl mx-auto">
          {!canSend && selModel && (
            <p className="mb-2 text-xs text-gray-400 text-center">
              {selModel.source === "openrouter"
                ? "Masukkan OpenRouter API key di sidebar untuk model ini."
                : "Masukkan Cloudflare Token + Account ID di sidebar untuk model ini."}
            </p>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-end gap-2 glass rounded-2xl p-2 focus-within:border-neon-purple transition"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder={
                selModel?.source === "njiriah"
                  ? "Tanya NJIR LAH apapun, gratis & tanpa API key..."
                  : canSend
                  ? "Tanya apa saja ke NJIRLAH AI..."
                  : "Tambah API key di sidebar dulu ya..."
              }
              className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-sm max-h-48 min-h-[40px]"
              rows={1}
              disabled={!canSend}
            />
            {streaming ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={stop}
                className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 flex items-center justify-center transition"
              >
                <Square className="h-4 w-4 fill-current" />
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                disabled={!canSend || !input.trim()}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: canSend && input.trim() ? 1.05 : 1 }}
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition ${
                  canSend && input.trim()
                    ? selModel?.source === "njiriah"
                      ? "bg-gradient-to-br from-neon-pink to-neon-purple text-white neon-glow-pink"
                      : "bg-gradient-to-br from-neon-purple to-neon-pink text-white neon-glow-purple"
                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Send className="h-4 w-4" />
              </motion.button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  canSend,
  onSelectNjir,
}: {
  canSend: boolean;
  onSelectNjir: () => void;
}) {
  const title = "NJIRLAH AI";
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-16">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="h-20 w-20 rounded-3xl bg-gradient-to-br from-neon-purple via-neon-cyan to-neon-pink flex items-center justify-center mb-6 neon-glow-purple"
      >
        <Sparkles className="h-10 w-10" />
      </motion.div>
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
        {title.split("").map((ch, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, type: "spring" }}
            className="inline-block text-gradient-neon"
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        ))}
      </h2>
      <p className="text-gray-400 max-w-lg mb-6">
        Platform chat multi-model AI dengan BYOK penuh — OpenRouter & Cloudflare.
        Plus model built-in{" "}
        <span className="font-semibold text-neon-pink">NJIR LAH</span> yang gratis
        dan tersedia untuk{" "}
        <span className="text-white font-medium">semua user setelah deploy</span>,
        tanpa API key apapun.
      </p>

      {/* NJIR LAH CTA card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-strong rounded-2xl p-4 max-w-sm w-full border border-neon-pink/30 mb-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan flex items-center justify-center font-black text-sm shrink-0">
            NJ
          </div>
          <div className="text-left">
            <p className="font-bold text-neon-pink flex items-center gap-1.5">
              NJIR LAH
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neon-pink/20 border border-neon-pink/40 animate-pulse">
                BUILT-IN
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/40 text-green-400">
                GRATIS
              </span>
            </p>
            <p className="text-xs text-gray-400">Supabase Edge · Global · No API Key</p>
          </div>
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 ml-auto shrink-0" />
        </div>
        <p className="text-xs text-gray-300 text-left mb-3">
          Langsung bisa dipakai — berjalan di Supabase Edge Function dan tersedia
          untuk semua pengguna setelah deploy. Dibuat oleh Andikaa Saputraa.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSelectNjir}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan text-sm font-semibold text-white"
        >
          Mulai Chat dengan NJIR LAH
        </motion.button>
      </motion.div>

      {!canSend && (
        <p className="text-xs text-gray-500">
          Atau tambahkan API key OpenRouter / Cloudflare di sidebar untuk akses ratusan model lain.
        </p>
      )}
    </div>
  );
}
