"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Square,
  Sparkles,
  Download,
  Terminal,
  Github,
} from "lucide-react";
import { GitHubPushDialog } from "./GitHubPushDialog";
import JSZip from "jszip";
import confetti from "canvas-confetti";
import { useAgentStore } from "@/store/agent";
import { useApiKeyStore } from "@/store/api-key";
import { useAgentPresetStore } from "@/store/agent-presets";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { ModelSource } from "@/types";
import { FileTree, ReviewIssue } from "./FileTree";
import { CodeEditor } from "./CodeEditor";
import { PlanSummaryPanel } from "./PlanSummaryPanel";
import { buildPreviewHtml } from "@/lib/build-preview";
import { BrowserFrame } from "@/components/preview/BrowserFrame";
import { DeviceControls, DeviceKind } from "@/components/preview/DeviceControls";
import { runPipeline, retryFile } from "@/lib/agent-pipeline";
import { getSessionId } from "@/lib/supabase";

export function AgentCodePanel() {
  const files = useAgentStore((s) => s.files);
  const fileStatuses = useAgentStore((s) => s.fileStatuses);
  const activeFile = useAgentStore((s) => s.activeFile);
  const isGenerating = useAgentStore((s) => s.isGenerating);
  const logs = useAgentStore((s) => s.logs);
  const prompt = useAgentStore((s) => s.prompt);
  const plan = useAgentStore((s) => s.plan);
  // actions: stable references — safe to pull via getState
  const setActiveFile = useAgentStore((s) => s.setActiveFile);
  const appendToFile = useAgentStore((s) => s.appendToFile);
  const replaceFile = useAgentStore((s) => s.replaceFile);
  const startFile = useAgentStore((s) => s.startFile);
  const endFile = useAgentStore((s) => s.endFile);
  const setGenerating = useAgentStore((s) => s.setGenerating);
  const log = useAgentStore((s) => s.log);
  const addStep = useAgentStore((s) => s.addStep);
  const updateStep = useAgentStore((s) => s.updateStep);
  const reset = useAgentStore((s) => s.reset);
  const setPrompt = useAgentStore((s) => s.setPrompt);
  const setPlan = useAgentStore((s) => s.setPlan);
  const persistSession = useAgentStore((s) => s.persistSession);
  const restoreSession = useAgentStore((s) => s.restoreSession);
  const { openrouterKey, cloudflareToken, cloudflareAccountId, hydrate, hydrated } =
    useApiKeyStore();
  const activePreset = useAgentPresetStore((s) => s.active());
  const hydratePresets = useAgentPresetStore((s) => s.hydrate);
  useEffect(() => { hydratePresets(); }, [hydratePresets]);

  // Restore last session on first mount (only if no files loaded yet)
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (restored || files.length > 0) return;
    setRestored(true);
    restoreSession().then((ok) => {
      if (ok) log("Sesi sebelumnya dipulihkan dari Supabase.");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selModel, setSelModel] = useState<{
    id: string;
    source: ModelSource;
    name: string;
  } | null>(null);
  const [device, setDevice] = useState<DeviceKind>("desktop");
  const [reviewIssues, setReviewIssues] = useState<ReviewIssue[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const activeFileObj = useMemo(
    () => files.find((f) => f.path === activeFile) || null,
    [files, activeFile]
  );

  const previewHtml = useMemo(() => buildPreviewHtml(files), [files]);

  const canGenerate =
    !!prompt.trim() &&
    !!selModel &&
    (selModel.source === "openrouter"
      ? !!openrouterKey
      : !!cloudflareToken && !!cloudflareAccountId) &&
    !isGenerating;

  const generate = async () => {
    if (!canGenerate || !selModel) return;
    reset();
    setGenerating(true);
    abortRef.current = new AbortController();

    try {
      await runPipeline(
        {
          prompt,
          modelSource: selModel.source,
          modelId: selModel.id,
          apiKey: openrouterKey,
          cfToken: cloudflareToken,
          cfAccountId: cloudflareAccountId,
          sessionId: getSessionId(),
          preset: activePreset || null,
          existingPlan: plan,
        },
        {
          signal: abortRef.current.signal,
          onStep: (s) => addStep(s),
          updateStep: (id, patch) => updateStep(id, patch),
          onFileStart: (p) => { startFile(p); log(`Menulis ${p}...`); },
          onFileChunk: (p, c) => appendToFile(p, c),
          onFileEnd: (p) => { endFile(p); log(`Selesai ${p}`); },
          onFileRewrite: (p, c) => replaceFile(p, c),
          onLog: (m) => log(m),
          onPlan: (pl) => setPlan(pl),
          onToolCall: (t, _a, _r) => log(`Tool: ${t}`),
        }
      );

      log("Agent selesai!");
      // Persist generated files to Supabase so they survive refresh
      persistSession().catch(() => {});
      confetti({
        particleCount: 140,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#18C493", "#06B6D4", "#3b82f6"],
      });

      // Trigger Reviewer sub-agent
      const snapFiles = useAgentStore.getState().files;
      if (snapFiles.length > 0) {
        setIsReviewing(true);
        log("Reviewer Agent sedang memeriksa kode...");
        try {
          const reviewUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/nj-review`;
          const reviewRes = await fetch(reviewUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              sessionId: typeof window !== "undefined" ? (localStorage.getItem("nj_session_id") || "") : "",
              files: snapFiles.map((f) => ({ path: f.path, content: f.content })),
              byok: openrouterKey
                ? { source: "openrouter", apiKey: openrouterKey }
                : cloudflareToken && cloudflareAccountId
                ? { source: "cloudflare", cfToken: cloudflareToken, cfAccountId: cloudflareAccountId }
                : undefined,
            }),
          });
          if (reviewRes.ok) {
            const { issues } = await reviewRes.json();
            setReviewIssues(issues || []);
            const errors = (issues || []).filter((i: ReviewIssue) => i.severity === "error").length;
            const warnings = (issues || []).filter((i: ReviewIssue) => i.severity === "warning").length;
            log(`Review selesai: ${errors} error, ${warnings} peringatan`);

            // Self-healing loop: auto-retry files with error-severity issues (once)
            const errorFiles = Array.from(
              new Set(
                (issues || [])
                  .filter((i: ReviewIssue) => i.severity === "error")
                  .map((i: ReviewIssue) => i.path)
              )
            ).slice(0, 3) as string[];
            const currentPlan = useAgentStore.getState().plan;
            if (errorFiles.length && currentPlan && selModel) {
              log(`Self-heal: regenerasi ${errorFiles.length} file bermasalah...`);
              const healCtrl = new AbortController();
              for (const fp of errorFiles) {
                try {
                  await retryFile(
                    fp,
                    {
                      prompt: useAgentStore.getState().prompt,
                      modelSource: selModel.source,
                      modelId: selModel.id,
                      apiKey: openrouterKey,
                      cfToken: cloudflareToken,
                      cfAccountId: cloudflareAccountId,
                      sessionId: getSessionId(),
                      preset: activePreset || null,
                      existingPlan: currentPlan,
                    },
                    currentPlan,
                    useAgentStore.getState().files,
                    {
                      signal: healCtrl.signal,
                      onStep: (s) => addStep(s),
                      updateStep: (id, patch) => updateStep(id, patch),
                      onFileStart: (p) => { startFile(p); },
                      onFileChunk: (p, c) => appendToFile(p, c),
                      onFileEnd: (p) => { endFile(p); },
                      onFileRewrite: (p, c) => replaceFile(p, c),
                      onLog: (m) => log(m),
                      onPlan: () => {},
                      onToolCall: () => {},
                    }
                  );
                } catch (he) {
                  log(`Self-heal gagal ${fp}: ${(he as Error).message}`);
                }
              }
              log("Self-heal selesai");
            }
          }
        } catch {
          log("Review gagal (non-fatal)");
        } finally {
          setIsReviewing(false);
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") log(`Fatal: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setGenerating(false);
  };

  const downloadZip = async () => {
    if (files.length === 0) return;
    const zip = new JSZip();
    files.forEach((f) => zip.file(f.path, f.content));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "njirlah-ai-project.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/10 glass-strong">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-gray-400 leading-none mb-0.5">
              Agent Code Generator
            </p>
            <p className="text-sm font-semibold">
              Bangun proyek web dari prompt
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ModelSelector value={selModel} onChange={setSelModel} />
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={files.length === 0}
            onClick={() => setGithubOpen(true)}
            className="h-10 px-3 rounded-xl glass hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-xs font-medium transition"
            title="Push to GitHub"
          >
            <Github className="h-4 w-4" />
            Push
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={files.length === 0}
            onClick={downloadZip}
            className="h-10 w-10 rounded-xl glass hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
            title="Download ZIP"
          >
            <Download className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex flex-col w-[52%] border-r border-white/10 min-h-0">
          <div className="p-3 border-b border-white/10 bg-black/30 space-y-2">
            {plan && <PlanSummaryPanel plan={plan} />}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Deskripsikan aplikasi web yang ingin dibangun. Contoh: landing page portfolio untuk fotografer dengan galeri dan form kontak."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-neon-purple min-h-[72px]"
              disabled={isGenerating}
            />
            <div className="mt-2 flex items-center gap-2">
              {isGenerating ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={stop}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition text-sm font-medium"
                >
                  <Square className="h-4 w-4 fill-current" />
                  Stop
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: canGenerate ? 1.02 : 1 }}
                  disabled={!canGenerate}
                  onClick={generate}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    canGenerate
                      ? "bg-gradient-to-r from-neon-purple to-neon-pink text-white neon-glow-purple"
                      : "bg-white/5 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Generate
                </motion.button>
              )}
            </div>
          </div>
          <div className="flex-1 flex min-h-0">
            <div className="w-[220px] border-r border-white/10 overflow-y-auto scrollbar-neon">
              <FileTree
                files={files}
                active={activeFile}
                onSelect={setActiveFile}
                fileStatuses={fileStatuses}
                reviewIssues={reviewIssues}
              />
            </div>
            <div className="flex-1 min-w-0 bg-black/40">
              <CodeEditor file={activeFileObj} streaming={isGenerating} />
            </div>
          </div>
          <div className="h-32 border-t border-white/10 bg-black/50 p-3 overflow-y-auto scrollbar-neon font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <Terminal className="h-3 w-3" />
              Agent Logs
            </div>
            <AnimatePresence initial={false}>
              {logs.map((l, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-gray-300"
                >
                  <span className="text-neon-cyan">›</span> {l}
                </motion.div>
              ))}
            </AnimatePresence>
            {isGenerating && (
              <div className="text-blue-400 flex items-center gap-1 mt-1">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                Coder Agent sedang bekerja...
              </div>
            )}
            {isReviewing && (
              <div className="text-amber-400 flex items-center gap-1 mt-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Reviewer Agent memeriksa kode...
              </div>
            )}
            {!isGenerating && !isReviewing && reviewIssues.length > 0 && (
              <div className="text-amber-400 text-[10px] mt-1">
                {reviewIssues.filter((i) => i.severity === "error").length} error,{" "}
                {reviewIssues.filter((i) => i.severity === "warning").length} peringatan —
                lihat badge di file tree
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-black/30">
          <div className="p-3 border-b border-white/10 flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-300">Live Preview</span>
            <div className="ml-auto">
              <DeviceControls value={device} onChange={setDevice} />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <BrowserFrame device={device}>
              <iframe
                title="preview"
                srcDoc={previewHtml}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-forms allow-same-origin"
              />
            </BrowserFrame>
          </div>
        </div>
      </div>

      <GitHubPushDialog
        open={githubOpen}
        onClose={() => setGithubOpen(false)}
        files={files}
      />
    </div>
  );
}
