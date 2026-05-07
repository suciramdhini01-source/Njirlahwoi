"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAgentStore } from "@/store/agent";
import { usePreviewStore } from "@/store/preview-store";
import { runPipeline } from "@/lib/agent-pipeline";
import { BUILTIN_PRESETS, AgentPreset } from "@/store/agent-presets";
import { AgentStep } from "@/types";
import {
  Zap,
  Send,
  StopCircle,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Cpu,
  Layers,
  Eye,
  Terminal,
  X,
  RotateCcw,
  Download,
} from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";

const WebContainerPreview = dynamic(
  () => import("@/components/preview/WebContainerPreview"),
  { ssr: false }
);

const EXAMPLE_PROMPTS = [
  "Buat landing page startup SaaS dengan hero section, fitur, dan CTA",
  "Buat dashboard analitik dengan chart dan sidebar navigasi",
  "Buat aplikasi todo list dengan filter dan animasi smooth",
  "Buat portfolio developer dengan dark mode dan animasi scroll",
];

export default function AgentPage() {
  const {
    files,
    fileStatuses,
    activeFile,
    isGenerating,
    logs,
    steps,
    plan,
    prompt,
    setPrompt,
    setGenerating,
    addStep,
    updateStep,
    log,
    setPlan,
    startFile,
    appendToFile,
    endFile,
    replaceFile,
    setActiveFile,
    reset,
  } = useAgentStore();

  const { reset: resetPreview } = usePreviewStore();

  const [selectedPreset, setSelectedPreset] = useState<AgentPreset | null>(
    BUILTIN_PRESETS[0]
  );
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [activePanel, setActivePanel] = useState<"steps" | "files" | "logs">("steps");

  const abortRef = useRef<AbortController | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    reset();
    resetPreview();
    setGenerating(true);

    abortRef.current = new AbortController();

    try {
      await runPipeline(
        {
          prompt: prompt.trim(),
          modelSource: "cloudflare",
          modelId: "@cf/meta/llama-3.1-8b-instruct",
          apiKey: "",
          cfToken: "",
          cfAccountId: "",
          sessionId: crypto.randomUUID(),
          preset: selectedPreset,
          existingPlan: null,
        },
        {
          onStep: (step: AgentStep) => addStep(step),
          updateStep: (id, patch) => updateStep(id, patch),
          onFileStart: (path) => {
            startFile(path);
            setActiveFile(path);
            setActiveTab("code");
          },
          onFileChunk: (path, chunk) => appendToFile(path, chunk),
          onFileEnd: (path) => endFile(path),
          onFileRewrite: (path, content) => replaceFile(path, content),
          onLog: (msg) => log(msg),
          onPlan: (p) => setPlan(p),
          onToolCall: (tool, args, result) =>
            log(`[tool] ${tool} → ${JSON.stringify(result).slice(0, 80)}`),
          signal: abortRef.current.signal,
        }
      );
    } catch (err) {
      const e = err as Error;
      if (e.name !== "AbortError") {
        log(`[error] ${e.message}`);
      }
    } finally {
      setGenerating(false);
    }
  }, [prompt, isGenerating, selectedPreset, reset, resetPreview, setGenerating, addStep, updateStep, startFile, setActiveFile, appendToFile, endFile, replaceFile, log, setPlan]);

  const handleStop = () => {
    abortRef.current?.abort();
    setGenerating(false);
    log("[agent] Dihentikan oleh pengguna.");
  };

  const handleReset = () => {
    abortRef.current?.abort();
    reset();
    resetPreview();
    setGenerating(false);
  };

  const handleDownload = async () => {
    if (!files.length) return;
    const zip = new JSZip();
    for (const f of files) {
      zip.file(f.path, f.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "njirlah-project.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFileObj = files.find((f) => f.path === activeFile);
  const doneFiles = files.filter((f) => fileStatuses[f.path] === "done");

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#05050A] text-white">
      {/* Top nav */}
      <nav className="flex items-center gap-3 px-4 h-12 border-b border-[#1a1a2e] bg-[#07070F] flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[#9ca3af] hover:text-white transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
        </Link>
        <div className="w-px h-5 bg-[#1a1a2e]" />
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#18C493]" />
          <span className="font-semibold text-sm text-white">NJIRLAH Agent</span>
        </div>

        {/* Preset selector */}
        <div className="flex items-center gap-1 ml-2">
          {BUILTIN_PRESETS.slice(0, 3).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPreset(p)}
              className={`px-2 py-0.5 rounded text-xs transition-all ${
                selectedPreset?.id === p.id
                  ? "bg-[#18C493]/20 text-[#18C493] border border-[#18C493]/30"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {files.length > 0 && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#9ca3af] hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download ZIP</span>
            </button>
          )}
          {(isGenerating || files.length > 0) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#9ca3af] hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </nav>

      <div className="flex flex-1 min-h-0">
        {/* Left panel — prompt + steps */}
        <div
          className={`flex flex-col border-r border-[#1a1a2e] bg-[#07070F] transition-all duration-300 flex-shrink-0 ${
            leftCollapsed ? "w-0 overflow-hidden" : "w-72 xl:w-80"
          }`}
        >
          {/* Prompt input */}
          <div className="p-3 border-b border-[#1a1a2e]">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                }}
                placeholder="Deskripsikan aplikasi yang ingin kamu buat..."
                rows={4}
                disabled={isGenerating}
                className="w-full bg-[#0B0B12] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm text-white placeholder-[#3a3a4a] resize-none focus:outline-none focus:border-[#18C493]/50 disabled:opacity-50 transition-colors"
              />
              <div className="flex items-center gap-2 mt-2">
                {!isGenerating ? (
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#18C493] text-[#05050A] font-semibold text-sm hover:bg-[#18C493]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Generate
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/20 transition-colors"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* Example prompts */}
            {!isGenerating && !files.length && (
              <div className="mt-3 space-y-1">
                <p className="text-[#3a3a4a] text-xs mb-2">Contoh:</p>
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(ex)}
                    className="w-full text-left text-xs text-[#9ca3af] hover:text-[#18C493] px-2 py-1 rounded hover:bg-[#18C493]/5 transition-colors truncate"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Panel tabs */}
          <div className="flex items-center border-b border-[#1a1a2e] px-1 py-1 gap-1 flex-shrink-0">
            {(["steps", "files", "logs"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePanel(tab)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs flex-1 justify-center transition-colors ${
                  activePanel === tab
                    ? "bg-[#18C493]/10 text-[#18C493]"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                {tab === "steps" && <Layers className="w-3 h-3" />}
                {tab === "files" && <FileCode2 className="w-3 h-3" />}
                {tab === "logs" && <Terminal className="w-3 h-3" />}
                <span className="capitalize">{tab}</span>
                {tab === "files" && files.length > 0 && (
                  <span className="text-[#18C493]/70">{files.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {activePanel === "steps" && (
              <div className="p-3 space-y-2">
                {plan && (
                  <div className="mb-3 p-2 rounded-lg bg-[#0B0B12] border border-[#1a1a2e]">
                    <p className="text-[#18C493] text-xs font-medium mb-1">Plan</p>
                    <p className="text-[#9ca3af] text-xs leading-relaxed line-clamp-3">{plan.summary}</p>
                    {plan.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {plan.techStack.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-[#18C493]/10 text-[#18C493] text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {steps.length === 0 && !isGenerating && (
                  <div className="text-center text-[#3a3a4a] text-xs py-8">
                    Pipeline steps akan muncul di sini
                  </div>
                )}
                {steps.map((step) => (
                  <StepCard key={step.id} step={step} />
                ))}
              </div>
            )}

            {activePanel === "files" && (
              <div className="p-2 space-y-0.5">
                {files.length === 0 && (
                  <div className="text-center text-[#3a3a4a] text-xs py-8">
                    File akan muncul saat agen menulis kode
                  </div>
                )}
                {files.map((f) => {
                  const status = fileStatuses[f.path] || "pending";
                  return (
                    <button
                      key={f.path}
                      onClick={() => { setActiveFile(f.path); setActiveTab("code"); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                        activeFile === f.path
                          ? "bg-[#18C493]/10 text-[#18C493]"
                          : "text-[#9ca3af] hover:bg-[#0B0B12]"
                      }`}
                    >
                      {status === "done" ? (
                        <CheckCircle2 className="w-3 h-3 text-[#18C493] flex-shrink-0" />
                      ) : status === "streaming" ? (
                        <Loader2 className="w-3 h-3 text-yellow-400 animate-spin flex-shrink-0" />
                      ) : (
                        <Circle className="w-3 h-3 text-[#3a3a4a] flex-shrink-0" />
                      )}
                      <span className="truncate font-mono">{f.path}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {activePanel === "logs" && (
              <div className="p-2 font-mono text-xs space-y-0.5">
                {logs.length === 0 && (
                  <div className="text-center text-[#3a3a4a] py-8">
                    Log akan muncul saat generation berjalan
                  </div>
                )}
                {logs.map((line, i) => (
                  <div key={i} className={`leading-relaxed ${
                    line.includes("[error]") ? "text-red-400" :
                    line.includes("[tool]") ? "text-purple-400" :
                    "text-[#9ca3af]"
                  }`}>
                    {line}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setLeftCollapsed((v) => !v)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-10 bg-[#0B0B12] border border-[#1a1a2e] rounded-r flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors"
          style={{ left: leftCollapsed ? 0 : "calc(18rem - 0px)" }}
        >
          {leftCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Right panel — code editor + preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#1a1a2e] bg-[#07070F] flex-shrink-0">
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm transition-colors ${
                activeTab === "code"
                  ? "bg-[#0B0B12] text-white border border-[#1a1a2e]"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Kode
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm transition-colors ${
                activeTab === "preview"
                  ? "bg-[#0B0B12] text-white border border-[#1a1a2e]"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
              {doneFiles.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#18C493] ml-1" />
              )}
            </button>

            {/* Breadcrumb for active file */}
            {activeTab === "code" && activeFile && (
              <div className="ml-2 flex items-center gap-1 text-xs text-[#9ca3af] font-mono truncate">
                <span className="text-[#3a3a4a]">/</span>
                <span className="text-[#9ca3af]">{activeFile}</span>
                {fileStatuses[activeFile] === "streaming" && (
                  <Loader2 className="w-3 h-3 text-yellow-400 animate-spin ml-1" />
                )}
              </div>
            )}
          </div>

          {/* Code view */}
          {activeTab === "code" && (
            <div className="flex-1 overflow-hidden bg-[#020207]">
              {!activeFileObj ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#0B0B12] border border-[#1a1a2e] flex items-center justify-center">
                    <Cpu className="w-8 h-8 text-[#18C493]/30" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Belum ada kode</p>
                    <p className="text-[#9ca3af] text-sm">
                      Masukkan deskripsi aplikasi dan klik Generate untuk memulai
                    </p>
                  </div>
                  {!isGenerating && !prompt && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                      {EXAMPLE_PROMPTS.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(ex)}
                          className="text-left px-3 py-2 rounded-lg bg-[#0B0B12] border border-[#1a1a2e] text-[#9ca3af] hover:border-[#18C493]/30 hover:text-[#18C493] text-xs transition-colors"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <CodeViewer
                  content={activeFileObj.content}
                  language={activeFileObj.language || "text"}
                  isStreaming={fileStatuses[activeFile!] === "streaming"}
                />
              )}
            </div>
          )}

          {/* Preview view */}
          {activeTab === "preview" && (
            <div className="flex-1 overflow-hidden">
              <WebContainerPreview files={files} isGenerating={isGenerating} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepCard({ step }: { step: AgentStep }) {
  const elapsed = step.startedAt
    ? step.endedAt
      ? ((step.endedAt - step.startedAt) / 1000).toFixed(1)
      : null
    : null;

  return (
    <div
      className={`p-2.5 rounded-lg border transition-all ${
        step.status === "running"
          ? "bg-[#18C493]/5 border-[#18C493]/20"
          : step.status === "done"
          ? "bg-[#0B0B12] border-[#1a1a2e]"
          : step.status === "error"
          ? "bg-red-500/5 border-red-500/20"
          : "bg-[#0B0B12] border-[#1a1a2e]"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">
          {step.status === "running" ? (
            <Loader2 className="w-3.5 h-3.5 text-[#18C493] animate-spin" />
          ) : step.status === "done" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#18C493]" />
          ) : step.status === "error" ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-[#3a3a4a]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-white">{step.title}</span>
            {elapsed && (
              <span className="text-[10px] text-[#3a3a4a] ml-auto">{elapsed}s</span>
            )}
          </div>
          <p className="text-[10px] text-[#9ca3af] mt-0.5 leading-relaxed">{step.description}</p>
          {step.files && step.files.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {step.files.map((f) => (
                <span key={f} className="px-1 py-0.5 rounded bg-[#0B0B12] text-[#9ca3af] text-[10px] font-mono">
                  {f.split("/").pop()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CodeViewer({
  content,
  language,
  isStreaming,
}: {
  content: string;
  language: string;
  isStreaming: boolean;
}) {
  const lines = content.split("\n");

  return (
    <div className="h-full overflow-auto">
      <div className="p-4">
        <pre className="text-xs font-mono text-[#e2e8f0] leading-relaxed whitespace-pre-wrap break-all">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3 hover:bg-white/[0.02] -mx-4 px-4 rounded group">
              <span className="text-[#3a3a4a] select-none w-8 text-right flex-shrink-0 group-hover:text-[#9ca3af] transition-colors">
                {i + 1}
              </span>
              <span>{line || " "}</span>
            </div>
          ))}
          {isStreaming && (
            <div className="flex gap-3 -mx-4 px-4">
              <span className="text-[#3a3a4a] select-none w-8 text-right flex-shrink-0">{lines.length + 1}</span>
              <span className="inline-block w-2 h-3.5 bg-[#18C493] animate-pulse" />
            </div>
          )}
        </pre>
      </div>
    </div>
  );
}
