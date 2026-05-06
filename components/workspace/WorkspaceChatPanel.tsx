"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Send, Terminal, ChevronDown, ChevronUp, Loader2, User, Sparkles,
  Paperclip, Mic, Square, HelpCircle, KeyRound,
} from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Link from "next/link";
import { useWorkspaceStore, WsMessage } from "@/store/workspace";
import { useApiKeyStore } from "@/store/api-key";
import { useAgentStore } from "@/store/agent";
import { useAgentPresetStore } from "@/store/agent-presets";
import { useModelStore } from "@/store/model";
import { runPipeline } from "@/lib/agent-pipeline";
import { getSessionId } from "@/lib/supabase";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { ModelSource } from "@/types";

interface Props {
  projectId: string;
}

function MessageBubble({ msg }: { msg: WsMessage }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl px-3.5 py-2 bg-[#0d1714] border border-[#18C493]/25 text-[13px] text-white leading-relaxed whitespace-pre-wrap break-words">
          {msg.content}
        </div>
      </motion.div>
    );
  }

  // Assistant card — cyan-accented border, question marker if it ends with "?"
  const isQuestion = /\?\s*$/.test(msg.content.trim());
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5 items-start"
    >
      <div className="shrink-0 h-7 w-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
        <Sparkles className="h-3.5 w-3.5 text-[#18C493]" />
      </div>
      <div className="flex-1 min-w-0 rounded-2xl border border-[#18C493]/35 bg-[#060c0a] overflow-hidden">
        {isQuestion && (
          <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[#18C493]/25 bg-[#0a1613]">
            <HelpCircle className="h-3.5 w-3.5 text-[#18C493]" />
            <span className="text-[11px] font-semibold text-[#18C493]">
              Agent is asking a question
            </span>
          </div>
        )}
        <div className="px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-100 whitespace-pre-wrap break-words">
          {msg.content}
        </div>
      </div>
    </motion.div>
  );
}

export function WorkspaceChatPanel({ projectId }: Props) {
  const project = useWorkspaceStore((s) => s.project);
  const messages = useWorkspaceStore((s) => s.messages);
  const addMessage = useWorkspaceStore((s) => s.addMessage);
  const setBuilding = useWorkspaceStore((s) => s.setBuilding);
  const setBuildError = useWorkspaceStore((s) => s.setBuildError);
  const setStatus = useWorkspaceStore((s) => s.setStatus);
  const setPlan = useWorkspaceStore((s) => s.setPlan);
  const isBuilding = useWorkspaceStore((s) => s.isBuilding);

  const { openrouterKey, cloudflareToken, cloudflareAccountId, hydrate, hydrated } = useApiKeyStore();
  const openrouterModels = useModelStore((s) => s.openrouterModels);
  const cloudflareModels = useModelStore((s) => s.cloudflareModels);
  const presetHydrate = useAgentPresetStore((s) => s.hydrate);
  const presetHydrated = useAgentPresetStore((s) => s.hydrated);
  const activePreset = useAgentPresetStore((s) => s.active);
  const agentLogs = useAgentStore((s) => s.logs);
  const agentSteps = useAgentStore((s) => s.steps);
  const addStep = useAgentStore((s) => s.addStep);
  const updateStep = useAgentStore((s) => s.updateStep);
  const startFile = useAgentStore((s) => s.startFile);
  const appendToFile = useAgentStore((s) => s.appendToFile);
  const endFile = useAgentStore((s) => s.endFile);
  const replaceFile = useAgentStore((s) => s.replaceFile);
  const agentLog = useAgentStore((s) => s.log);
  const agentSetGenerating = useAgentStore((s) => s.setGenerating);
  const agentReset = useAgentStore((s) => s.reset);

  const [input, setInput] = useState("");
  const [selModel, setSelModel] = useState<{ id: string; source: ModelSource; name: string } | null>(null);
  const [termOpen, setTermOpen] = useState(false);
  const [builtInStatus, setBuiltInStatus] = useState<{ anthropic: boolean; gemini: boolean; replit: boolean }>({
    anthropic: false, gemini: false, replit: false,
  });
  const abortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const termEndRef = useRef<HTMLDivElement>(null);

  // Poll /api/status once to learn which built-in (server-side env) providers are configured
  useEffect(() => {
    let cancel = false;
    fetch("/api/status").then((r) => r.json()).then((j) => {
      if (cancel) return;
      setBuiltInStatus({
        anthropic: !!j?.anthropic?.configured,
        gemini: !!j?.gemini?.configured,
        replit: !!j?.replit?.configured,
      });
    }).catch(() => {});
    return () => { cancel = true; };
  }, []);

  useEffect(() => { if (!hydrated) hydrate(); }, [hydrate, hydrated]);
  useEffect(() => { if (!presetHydrated) presetHydrate(); }, [presetHydrate, presetHydrated]);

  useEffect(() => {
    if (selModel) return;
    // Prefer built-in providers when server env is configured (Bolt-supplied keys)
    if (builtInStatus.anthropic) {
      setSelModel({ id: "claude-sonnet-4-6", source: "anthropic", name: "Claude Sonnet 4.6" });
      return;
    }
    if (builtInStatus.gemini) {
      setSelModel({ id: "gemini-2.5-flash", source: "gemini", name: "Gemini 2.5 Flash" });
      return;
    }
    if (builtInStatus.replit) {
      setSelModel({ id: "gpt-5-mini", source: "replit", name: "GPT-5 Mini" });
      return;
    }
    // Fall back to BYOK
    if (openrouterKey && openrouterModels.length) {
      const free = openrouterModels.find((m) => m.free) || openrouterModels[0];
      setSelModel({ id: free.id, source: "openrouter", name: free.name });
      return;
    }
    if (cloudflareToken && cloudflareAccountId && cloudflareModels.length) {
      const m = cloudflareModels[0];
      setSelModel({ id: m.id, source: "cloudflare", name: m.name });
    }
  }, [selModel, builtInStatus, openrouterKey, openrouterModels, cloudflareToken, cloudflareAccountId, cloudflareModels]);

  const hasBuiltIn = builtInStatus.anthropic || builtInStatus.gemini || builtInStatus.replit;
  const hasAnyKey = hasBuiltIn || !!openrouterKey || (!!cloudflareToken && !!cloudflareAccountId);

  useEffect(() => {
    if (project && messages.length === 0 && project.prompt) {
      addMessage({ role: "user", content: project.prompt });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBuilding]);

  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLogs]);

  const canBuild = !!selModel && !isBuilding && (() => {
    switch (selModel.source) {
      case "openrouter": return !!openrouterKey;
      case "cloudflare": return !!cloudflareToken && !!cloudflareAccountId;
      case "anthropic":  return builtInStatus.anthropic;
      case "gemini":     return builtInStatus.gemini;
      case "replit":     return builtInStatus.replit;
      case "njiriah":    return true;
      default:           return false;
    }
  })();

  const triggerBuild = async (userPrompt: string) => {
    if (!selModel || isBuilding) return;
    agentReset();
    setBuilding(true);
    setBuildError(null);
    setStatus("building");
    setTermOpen(true);
    agentSetGenerating(true);
    abortRef.current = new AbortController();

    try {
      await runPipeline(
        {
          prompt: userPrompt,
          modelSource: selModel.source,
          modelId: selModel.id,
          apiKey: openrouterKey,
          cfToken: cloudflareToken,
          cfAccountId: cloudflareAccountId,
          sessionId: getSessionId(),
          projectId,
          preset: presetHydrated ? activePreset() : null,
          existingPlan: (project?.plan as any) || null,
        },
        {
          signal: abortRef.current.signal,
          onStep: (s) => addStep(s),
          updateStep: (id, patch) => updateStep(id, patch),
          onFileStart: (p) => { startFile(p); agentLog(`Writing ${p}...`); },
          onFileChunk: (p, c) => appendToFile(p, c),
          onFileEnd: (p) => { endFile(p); agentLog(`Done: ${p}`); },
          onFileRewrite: (p, c) => replaceFile(p, c),
          onLog: (m) => agentLog(m),
          onPlan: (pl) => setPlan(pl),
          onToolCall: (t) => agentLog(`Tool: ${t}`),
        }
      );
      setStatus("ready");
      await addMessage({ role: "assistant", content: "Build selesai. File proyek tersedia di editor." });
    } catch (e: any) {
      if (e.name !== "AbortError") {
        const msg = e.message || "Build failed";
        setBuildError(msg);
        setStatus("error");
        await addMessage({ role: "assistant", content: `Build gagal: ${msg}` });
      }
    } finally {
      setBuilding(false);
      agentSetGenerating(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isBuilding) return;
    setInput("");
    await addMessage({ role: "user", content: text });

    if (agentSteps.length === 0 && canBuild) {
      triggerBuild(text);
    } else if (!canBuild) {
      await addMessage({
        role: "assistant",
        content: hasAnyKey
          ? "Pilih model dulu lewat dropdown di bawah untuk memulai build."
          : "API key belum dikonfigurasi. Tambahkan OpenRouter atau Cloudflare lewat menu di atas.",
      });
    } else {
      await addMessage({ role: "assistant", content: "Catatan diterima. Klik Build untuk rebuild dengan perubahan." });
    }
  };

  const stopBuild = () => {
    abortRef.current?.abort();
    setBuilding(false);
    agentSetGenerating(false);
    setStatus("error");
  };

  const sendDisabled = !input.trim() || isBuilding;

  return (
    <div className="h-full flex flex-col bg-[#05080a] border-r border-white/[0.07] min-w-0">
      <PanelGroup direction="vertical" autoSaveId={`ws-chat-${projectId}`} className="flex-1 min-h-0">
        <Panel defaultSize={termOpen ? 65 : 100} minSize={40}>
          <div className="h-full flex flex-col min-w-0">
            {/* Chat scroll */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
              <AnimatePresence initial={false}>
                {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
              </AnimatePresence>
              {isBuilding && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs text-blue-400 pl-10"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Agent sedang membangun proyek...
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Composer — single responsive action row, no stacked buttons */}
            <div className="shrink-0 border-t border-white/[0.07] p-3">
              {hydrated && !hasAnyKey && (
                <Link
                  href="/api-njir"
                  className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 hover:bg-amber-500/20 transition"
                >
                  <KeyRound className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 min-w-0 truncate">API key belum dikonfigurasi</span>
                  <span className="font-semibold underline underline-offset-2 shrink-0">Konfigurasi</span>
                </Link>
              )}

              <div className="rounded-2xl bg-[#0a0f0d] border border-white/[0.08] focus-within:border-[#18C493]/40 transition">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder={isBuilding ? "Menunggu build selesai..." : "Message Agent"}
                  disabled={isBuilding}
                  rows={2}
                  className="w-full bg-transparent px-3.5 pt-3 pb-1 text-[13px] resize-none focus:outline-none placeholder:text-gray-600 disabled:opacity-40 leading-relaxed"
                />

                {/* Single flex action row — wraps on narrow screens via overflow-x-auto */}
                <div className="flex items-center gap-1 px-2 pb-2 overflow-x-auto scrollbar-none">
                  <IconAction icon={Paperclip} title="Attach" />
                  <div className="shrink-0">
                    <ModelSelector value={selModel} onChange={setSelModel} />
                  </div>
                  {canBuild && agentSteps.length === 0 && (project?.prompt || messages.length > 0) && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => triggerBuild(project?.prompt || messages[0]?.content || "")}
                      className="shrink-0 h-7 flex items-center gap-1.5 px-2.5 rounded-full bg-[#18C493]/15 border border-[#18C493]/40 text-[11px] font-medium text-[#BFF5E0] hover:bg-[#18C493]/25 transition"
                    >
                      <Sparkles className="h-3 w-3 text-[#18C493]" />
                      Build
                    </motion.button>
                  )}
                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    <IconAction icon={Mic} title="Voice" />
                    {isBuilding ? (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={stopBuild}
                        className="h-8 w-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition"
                        aria-label="Stop"
                      >
                        <Square className="h-3 w-3 fill-current" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        disabled={sendDisabled}
                        onClick={sendMessage}
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition ${
                          sendDisabled
                            ? "bg-white/[0.04] border border-white/[0.07] text-gray-600 cursor-not-allowed"
                            : "bg-[#18C493] text-[#052018] shadow-[0_0_16px_rgba(24,196,147,0.45)]"
                        }`}
                        aria-label="Send"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle
          className="shrink-0 border-t border-white/[0.07] bg-[#040706] hover:bg-white/[0.03] transition"
          onClick={() => setTermOpen((o) => !o)}
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-gray-500 select-none">
            <Terminal className="h-3 w-3" />
            Agent Logs
            <span className="ml-auto">{termOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}</span>
          </div>
        </PanelResizeHandle>

        <Panel defaultSize={35} minSize={15} collapsible>
          <div className="h-full bg-[#030505] overflow-y-auto px-3 py-2 font-mono text-[10px] scrollbar-thin scrollbar-thumb-white/10">
            {agentLogs.length === 0 ? (
              <p className="text-gray-700">Belum ada log.</p>
            ) : (
              agentLogs.map((l, i) => (
                <div key={i} className="text-gray-400 leading-relaxed">
                  <span className="text-[#18C493]/60">›</span> {l}
                </div>
              ))
            )}
            <div ref={termEndRef} />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

function IconAction({ icon: Icon, title }: { icon: typeof Paperclip; title?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      title={title}
      className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/[0.06] transition"
    >
      <Icon className="h-3.5 w-3.5" />
    </motion.button>
  );
}
