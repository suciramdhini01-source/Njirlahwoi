"use client";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Send, Trash2, Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useCompareStore } from "@/store/compare";
import { useApiKeyStore } from "@/store/api-key";
import { CompareModelPicker } from "./CompareModelPicker";
import { readSSEStream } from "@/lib/read-stream";
import { ModelProvider } from "@/types";

export function CompareView() {
  const {
    modelA,
    providerA,
    modelB,
    providerB,
    rounds,
    streaming,
    setModelA,
    setModelB,
    addRound,
    updateRound,
    clear,
    setStreaming,
  } = useCompareStore();
  const { openrouterKey, cloudflareToken, cloudflareAccountId } = useApiKeyStore();
  const [prompt, setPrompt] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const buildRequest = (provider: ModelProvider, model: string, text: string) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    let url = "";
    const body: Record<string, unknown> = {
      model,
      messages: [{ role: "user", content: text }],
    };
    switch (provider) {
      case "replit":
        url = "/api/replit/chat";
        break;
      case "anthropic":
        url = "/api/anthropic/chat";
        break;
      case "gemini":
        url = "/api/gemini/chat";
        break;
      case "cloudflare":
        url = "/api/cloudflare/chat";
        headers["x-cf-token"] = cloudflareToken;
        headers["x-cf-account-id"] = cloudflareAccountId;
        break;
      case "openrouter":
        url = "/api/openrouter/chat";
        headers["x-api-key"] = openrouterKey;
        break;
      case "njiriah":
        url = "/api/njiriah/chat";
        break;
    }
    return { url, headers, body };
  };

  const send = async () => {
    if (!prompt.trim() || streaming) return;
    const roundId = nanoid();
    addRound({
      id: roundId,
      prompt,
      responseA: "",
      responseB: "",
      latencyA: 0,
      latencyB: 0,
    });
    const currentPrompt = prompt;
    setPrompt("");
    setStreaming(true);
    abortRef.current = new AbortController();

    const runOne = async (col: "A" | "B") => {
      const provider = col === "A" ? providerA : providerB;
      const model = col === "A" ? modelA : modelB;
      const t0 = Date.now();
      const { url, headers, body } = buildRequest(provider, model, currentPrompt);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers,
          signal: abortRef.current!.signal,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const txt = await res.text();
          updateRound(roundId, {
            [col === "A" ? "responseA" : "responseB"]: `[error] ${txt}`,
          } as any);
          return;
        }
        let acc = "";
        await readSSEStream(res, (d) => {
          acc += d;
          updateRound(roundId, {
            [col === "A" ? "responseA" : "responseB"]: acc,
          } as any);
        });
        updateRound(roundId, {
          [col === "A" ? "latencyA" : "latencyB"]: Date.now() - t0,
        } as any);
      } catch (e: any) {
        updateRound(roundId, {
          [col === "A" ? "responseA" : "responseB"]: `[aborted] ${e.message}`,
        } as any);
      }
    };

    await Promise.all([runOne("A"), runOne("B")]);
    setStreaming(false);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-white/10 glass-strong flex items-center gap-4">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold">
          Compare Model
        </h1>
        <p className="text-xs text-white/50">
          Jalankan 2 model paralel atas 1 prompt yang sama.
        </p>
        <button
          onClick={clear}
          className="ml-auto glass px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 flex items-center gap-1.5"
        >
          <Trash2 className="h-3 w-3" /> Clear
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px bg-white/5 flex-1 min-h-0 overflow-hidden">
        {(["A", "B"] as const).map((col) => (
          <div key={col} className="flex flex-col min-h-0 bg-[#05050A]">
            <div className="p-3 border-b border-white/10 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-white/40">
                Model {col}
              </span>
              <div className="flex-1">
                <CompareModelPicker
                  value={{
                    provider: col === "A" ? providerA : providerB,
                    model: col === "A" ? modelA : modelB,
                  }}
                  onChange={(v) =>
                    col === "A"
                      ? setModelA(v.model, v.provider)
                      : setModelB(v.model, v.provider)
                  }
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-neon p-4 space-y-4">
              {rounds.length === 0 && (
                <p className="text-xs text-white/40">
                  Belum ada prompt. Mulai dari bawah.
                </p>
              )}
              {rounds.map((r) => (
                <motion.div
                  key={r.id + col}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl p-3 space-y-2"
                >
                  <p className="text-[10px] uppercase tracking-wide text-white/40">
                    Prompt
                  </p>
                  <p className="text-sm text-white/80">{r.prompt}</p>
                  <div className="h-px bg-white/10 my-2" />
                  <p className="text-[10px] uppercase tracking-wide text-white/40">
                    Response {col === "A" ? `(${r.latencyA || "..."}ms)` : `(${r.latencyB || "..."}ms)`}
                  </p>
                  <pre className="text-xs whitespace-pre-wrap font-[family-name:var(--font-jetbrains)] text-white/85">
                    {(col === "A" ? r.responseA : r.responseB) || (
                      <span className="text-white/30">menunggu stream...</span>
                    )}
                  </pre>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 glass-strong flex items-center gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Prompt yang akan dijalankan ke kedua model..."
          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-a"
          disabled={streaming}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={send}
          disabled={streaming || !prompt.trim()}
          className="px-4 py-2 rounded-lg accent-gradient text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
        >
          {streaming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Streaming
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Kirim
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
