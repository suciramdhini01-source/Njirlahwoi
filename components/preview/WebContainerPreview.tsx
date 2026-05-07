"use client";

import { useEffect, useRef, useCallback } from "react";
import { AgentFile } from "@/types";
import { usePreviewStore } from "@/store/preview-store";
import {
  buildFilesystemTree,
  agentFilesToRecord,
  detectProjectType,
  injectViteTemplate,
} from "@/lib/build-filesystem-tree";
import { buildPreviewHtml } from "@/lib/build-preview";
import {
  Terminal,
  Globe,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Package,
  Play,
  Server,
} from "lucide-react";

interface WebContainerPreviewProps {
  files: AgentFile[];
  isGenerating: boolean;
}

const STATUS_STEPS = [
  { key: "booting", label: "Memulai sandbox...", icon: Server },
  { key: "installing", label: "npm install...", icon: Package },
  { key: "starting", label: "Menjalankan dev server...", icon: Play },
  { key: "running", label: "Preview aktif", icon: Globe },
] as const;

export default function WebContainerPreview({
  files,
  isGenerating,
}: WebContainerPreviewProps) {
  const { status, previewUrl, logs, errorMessage, setStatus, setPreviewUrl, pushLog, setError, reset } =
    usePreviewStore();

  const wcRef = useRef<import("@webcontainer/api").WebContainer | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const scrollLogs = useCallback(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollLogs();
  }, [logs, scrollLogs]);

  const doneFiles = files.filter((f) => f.content && f.content.length > 0);
  const allDone = !isGenerating && doneFiles.length > 0;

  const bootWebContainer = useCallback(async (fileList: AgentFile[]) => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    abortRef.current = new AbortController();

    reset();
    setStatus("booting");
    pushLog("[sandbox] Menginisialisasi WebContainer...");

    let wc: import("@webcontainer/api").WebContainer;
    try {
      const { WebContainer } = await import("@webcontainer/api");
      wc = await WebContainer.boot();
      wcRef.current = wc;
      pushLog("[sandbox] WebContainer berhasil di-boot.");
    } catch (err) {
      const msg = (err as Error).message || "Gagal boot WebContainer";
      pushLog(`[error] ${msg}`);
      setError(
        "WebContainer gagal diinisialisasi. Pastikan browser mendukung SharedArrayBuffer (Chrome/Edge terbaru)."
      );
      bootedRef.current = false;
      return;
    }

    const fileMap = agentFilesToRecord(fileList);
    const projectType = detectProjectType(fileMap);
    pushLog(`[sandbox] Tipe proyek terdeteksi: ${projectType}`);

    if (projectType === "html" || projectType === "unknown") {
      pushLog("[sandbox] Proyek HTML statis — rendering langsung...");
      const html = buildPreviewHtml(fileList);
      setStatus("running");
      if (iframeRef.current) {
        iframeRef.current.srcdoc = html;
        iframeRef.current.src = "";
      }
      pushLog("[sandbox] Preview HTML aktif.");
      return;
    }

    const enriched = projectType === "vite-react" ? injectViteTemplate(fileMap) : fileMap;

    try {
      const tree = buildFilesystemTree(enriched);
      await wc.mount(tree);
      pushLog("[sandbox] File berhasil di-mount.");
    } catch (err) {
      pushLog(`[error] Mount gagal: ${(err as Error).message}`);
      setError("Gagal mount file ke WebContainer.");
      bootedRef.current = false;
      return;
    }

    setStatus("installing");
    pushLog("[npm] Menjalankan npm install...");

    try {
      const install = await wc.spawn("npm", ["install"]);
      install.output.pipeTo(
        new WritableStream({
          write(data) {
            pushLog(`[npm] ${data}`);
          },
        })
      );
      const exitCode = await install.exit;
      if (exitCode !== 0) {
        pushLog(`[error] npm install keluar dengan kode ${exitCode}`);
        setError("npm install gagal. Lihat log di bawah untuk detail.");
        bootedRef.current = false;
        return;
      }
      pushLog("[npm] Instalasi dependensi selesai.");
    } catch (err) {
      pushLog(`[error] npm install: ${(err as Error).message}`);
      setError("Gagal menjalankan npm install.");
      bootedRef.current = false;
      return;
    }

    setStatus("starting");
    pushLog("[dev] Menjalankan npm run dev...");

    try {
      const dev = await wc.spawn("npm", ["run", "dev"]);
      dev.output.pipeTo(
        new WritableStream({
          write(data) {
            pushLog(`[dev] ${data}`);
          },
        })
      );

      wc.on("server-ready", (port, url) => {
        pushLog(`[server] Server siap di port ${port} → ${url}`);
        setPreviewUrl(url);
        setStatus("running");
      });

      dev.exit.then((code) => {
        if (code !== 0 && status !== "running") {
          pushLog(`[error] Dev server keluar dengan kode ${code}`);
          setError("Dev server berhenti secara tidak terduga.");
          bootedRef.current = false;
        }
      });
    } catch (err) {
      pushLog(`[error] npm run dev: ${(err as Error).message}`);
      setError("Gagal menjalankan dev server.");
      bootedRef.current = false;
    }
  }, [reset, setStatus, pushLog, setError, setPreviewUrl, status]);

  useEffect(() => {
    if (!allDone || bootedRef.current) return;
    bootWebContainer(doneFiles);
  }, [allDone]);

  const handleRetry = () => {
    if (wcRef.current) {
      try {
        wcRef.current.teardown?.();
      } catch {}
      wcRef.current = null;
    }
    bootedRef.current = false;
    bootWebContainer(doneFiles);
  };

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === status);

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-[#0B0B12] border border-[#18C493]/20 flex items-center justify-center">
          <Globe className="w-8 h-8 text-[#18C493]/40" />
        </div>
        <div>
          <p className="text-[#9ca3af] text-sm">
            {isGenerating
              ? "Menunggu agen selesai menulis kode..."
              : "Hasilkan kode untuk melihat live preview di sini."}
          </p>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-2 text-[#18C493] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Agen sedang bekerja...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#05050A]">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1a1a2e] bg-[#07070F]">
        <div className="flex items-center gap-1.5">
          {STATUS_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStepIdx;
            const isDone = i < currentStepIdx || status === "running";
            return (
              <div key={step.key} className="flex items-center gap-1">
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ${
                    isActive
                      ? "bg-[#18C493]/20 text-[#18C493]"
                      : isDone
                      ? "text-[#9ca3af]"
                      : "text-[#3a3a4a]"
                  }`}
                >
                  {isActive && status !== "running" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <span className="text-[#2a2a3a] text-xs">›</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {status === "error" && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
          {status === "running" && previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-[#18C493]/10 text-[#18C493] hover:bg-[#18C493]/20 transition-colors"
            >
              <Globe className="w-3 h-3" />
              Buka
            </a>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Preview iframe */}
        {status === "running" && (
          <div className="flex-1 bg-white relative">
            <iframe
              ref={iframeRef}
              src={previewUrl ?? undefined}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-medium mb-1">Preview gagal</p>
              <p className="text-[#9ca3af] text-sm max-w-xs">{errorMessage}</p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
          </div>
        )}

        {/* Terminal log — shown during boot, and as overlay/resizable panel when running */}
        {(status === "booting" || status === "installing" || status === "starting") && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#020207]">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#0f0f1a]">
              <Terminal className="w-3.5 h-3.5 text-[#18C493]" />
              <span className="text-[#9ca3af] text-xs font-mono">Terminal</span>
              <span className="ml-auto text-[#3a3a4a] text-xs font-mono">
                {logs.length} baris
              </span>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-xs p-3 space-y-0.5">
              {logs.map((line, i) => (
                <div key={i} className={`leading-relaxed ${
                  line.startsWith("[error]") ? "text-red-400" :
                  line.startsWith("[npm]") ? "text-yellow-400/80" :
                  line.startsWith("[dev]") ? "text-blue-400/80" :
                  line.startsWith("[server]") ? "text-[#18C493]" :
                  "text-[#9ca3af]"
                }`}>
                  {line}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Running: collapsible terminal at bottom */}
        {status === "running" && logs.length > 0 && (
          <details className="border-t border-[#1a1a2e] bg-[#020207] group">
            <summary className="flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none text-xs text-[#9ca3af] hover:text-[#18C493] transition-colors">
              <Terminal className="w-3.5 h-3.5" />
              <span className="font-mono">Log terminal</span>
              <span className="ml-auto font-mono text-[#3a3a4a]">{logs.length} baris</span>
            </summary>
            <div className="h-32 overflow-y-auto font-mono text-xs p-3 space-y-0.5">
              {logs.slice(-100).map((line, i) => (
                <div key={i} className={`leading-relaxed ${
                  line.startsWith("[error]") ? "text-red-400" :
                  line.startsWith("[npm]") ? "text-yellow-400/80" :
                  line.startsWith("[dev]") ? "text-blue-400/80" :
                  line.startsWith("[server]") ? "text-[#18C493]" :
                  "text-[#9ca3af]"
                }`}>
                  {line}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
