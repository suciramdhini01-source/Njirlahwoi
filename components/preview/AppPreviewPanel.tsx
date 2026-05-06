"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  RefreshCw, Share2, Monitor, Tablet, Smartphone,
  Lock, ChevronLeft, ChevronRight, ExternalLink, WifiOff,
} from "lucide-react";
import { useAgentStore } from "@/store/agent";
import { buildPreviewHtml } from "@/lib/build-preview";
import { PreviewErrorBoundary } from "./PreviewErrorBoundary";

// Sandpack loaded dynamically — avoids SSR issues
const SandpackPreview = dynamic(() => import("./SandpackPreview"), { ssr: false });

type Device = "desktop" | "tablet" | "mobile";

const DEVICES: { id: Device; icon: typeof Monitor; label: string; width: number | string; height: number }[] = [
  { id: "desktop", icon: Monitor, label: "Desktop", width: "100%", height: 640 },
  { id: "tablet", icon: Tablet, label: "Tablet", width: 768, height: 640 },
  { id: "mobile", icon: Smartphone, label: "Mobile", width: 390, height: 720 },
];

const DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>NJIRLAH AI Preview</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',system-ui,sans-serif;background:#05050A;color:white;min-height:100vh;display:flex;flex-direction:column}
  .navbar{display:flex;align-items:center;gap:1rem;padding:1rem 2rem;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);backdrop-filter:blur(12px)}
  .logo{font-weight:900;font-size:1.2rem;background:linear-gradient(90deg,#18C493,#06B6D4);-webkit-background-clip:text;background-clip:text;color:transparent}
  .hero{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4rem 2rem;background:radial-gradient(800px 400px at 50% 0%,rgba(24,196,147,0.12),transparent 60%)}
  h1{font-size:clamp(2rem,6vw,4rem);font-weight:900;background:linear-gradient(135deg,#fff 40%,rgba(24,196,147,0.8));-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:1rem}
  p{color:rgba(255,255,255,0.5);max-width:480px;line-height:1.7;margin-bottom:2rem}
  .btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 2rem;background:linear-gradient(135deg,#18C493,#06B6D4);border-radius:12px;font-weight:600;color:white;border:none;cursor:pointer;transition:transform .2s}
  .btn:hover{transform:translateY(-2px)}
</style>
</head>
<body>
<nav class="navbar"><span class="logo">NJIRLAH AI</span></nav>
<section class="hero">
  <h1>Generate AI App Preview</h1>
  <p>Tulis prompt di panel kiri dan klik Generate. Preview proyek kamu akan muncul di sini secara real-time.</p>
  <button class="btn">Mulai Generate &rarr;</button>
</section>
</body></html>`;

function isReactProject(files: { path: string }[]) {
  return files.some(
    (f) =>
      f.path.endsWith(".tsx") ||
      f.path.endsWith(".jsx") ||
      f.path === "app/page.tsx" ||
      f.path === "pages/index.tsx"
  );
}

type PreviewMode = "code" | "static";

export function AppPreviewPanel() {
  const files = useAgentStore((s) => s.files);
  const isGenerating = useAgentStore((s) => s.isGenerating);
  const [device, setDevice] = useState<Device>("desktop");
  const [spinning, setSpinning] = useState(false);
  const [url, setUrl] = useState("localhost:3000");
  const [urlEditing, setUrlEditing] = useState(false);
  const [urlDraft, setUrlDraft] = useState(url);
  const [key, setKey] = useState(0);

  const hasReact = files.length > 0 && isReactProject(files);
  const [mode, setMode] = useState<PreviewMode>(hasReact ? "code" : "static");
  const [showCorsHint, setShowCorsHint] = useState(false);

  // Listen for fetch errors emitted from within the preview iframe
  useState(() => {
    if (typeof window === "undefined") return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "preview-fetch-error") setShowCorsHint(true);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  });

  const effectiveMode: PreviewMode = hasReact ? mode : "static";
  const useSandpack = effectiveMode === "code" && hasReact;

  const html = useMemo(() => {
    if (useSandpack) return "";
    const built = buildPreviewHtml(files);
    return built && built.trim().length > 100 ? built : DEMO_HTML;
  }, [files, useSandpack]);

  const currentDevice = DEVICES.find((d) => d.id === device)!;

  const refresh = () => {
    setSpinning(true);
    setKey((k) => k + 1);
    setTimeout(() => setSpinning(false), 700);
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0d15]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-[17px] font-semibold text-white tracking-tight">
            App Preview
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 font-medium">
            Live
          </span>
          {useSandpack && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-medium">
              Sandpack
            </span>
          )}

          {hasReact && (
            <div className="ml-2 flex items-center gap-0.5 p-0.5 bg-white/[0.04] border border-white/[0.08] rounded-md text-[10px]">
              <button
                onClick={() => setMode("code")}
                className={`px-2 py-0.5 rounded ${mode === "code" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                Code Run
              </button>
              <button
                onClick={() => setMode("static")}
                className={`px-2 py-0.5 rounded ${mode === "static" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                Static
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Device controls */}
          <div className="flex items-center gap-0.5 p-1 bg-white/[0.04] border border-white/[0.08] rounded-lg">
            {DEVICES.map(({ id, icon: Icon, label }) => (
              <motion.button
                key={id}
                onClick={() => setDevice(id)}
                whileTap={{ scale: 0.9 }}
                title={label}
                className={`relative p-1.5 rounded-md transition ${
                  device === id ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {device === id && (
                  <motion.div
                    layoutId="device-bg-app"
                    className="absolute inset-0 rounded-md bg-blue-600"
                  />
                )}
                <Icon className="h-3.5 w-3.5 relative" />
              </motion.button>
            ))}
          </div>

          <div className="w-px h-5 bg-white/10" />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition"
            title="Refresh"
          >
            <motion.div animate={{ rotate: spinning ? 360 : 0 }} transition={{ duration: 0.6 }}>
              <RefreshCw className="h-4 w-4" />
            </motion.div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            animate={{
              boxShadow: [
                "0 0 0 rgba(34,197,94,0)",
                "0 0 18px rgba(34,197,94,0.45)",
                "0 0 0 rgba(34,197,94,0)",
              ],
            }}
            transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Deploy
          </motion.button>
        </div>
      </div>

      {/* CORS/network hint banner */}
      <AnimatePresence>
        {showCorsHint && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 text-xs text-amber-300"
          >
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>
              Beberapa request dari preview diblokir (CORS/credentialless sandbox). Ini normal — kode kamu sudah benar.
              Login dengan OAuth atau third-party cookie hanya akan bekerja saat di-deploy ke server nyata.
            </span>
            <button
              onClick={() => setShowCorsHint(false)}
              className="ml-auto shrink-0 text-amber-400 hover:text-amber-200"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Browser frame */}
      <div className="flex-1 flex items-start justify-center p-6 overflow-auto">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
          style={{
            width: device === "desktop" ? "100%" : currentDevice.width,
            maxWidth: "100%",
          }}
          className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.09] shadow-2xl"
        >
          {/* URL Bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#131320] border-b border-white/[0.07]">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button className="p-1 rounded hover:bg-white/[0.06] text-gray-500 transition">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button className="p-1 rounded hover:bg-white/[0.06] text-gray-500 transition">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 flex items-center gap-1.5 bg-[#0d0d1a] border border-white/[0.08] rounded-lg px-2.5 py-1 min-w-0">
              <Lock className="h-3 w-3 text-green-400 shrink-0" />
              {urlEditing ? (
                <input
                  autoFocus
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onBlur={() => { setUrl(urlDraft); setUrlEditing(false); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { setUrl(urlDraft); setUrlEditing(false); }
                    if (e.key === "Escape") setUrlEditing(false);
                  }}
                  className="flex-1 bg-transparent outline-none text-[12px] text-white font-mono min-w-0"
                />
              ) : (
                <span
                  onClick={() => { setUrlDraft(url); setUrlEditing(true); }}
                  className="flex-1 text-[12px] text-gray-300 font-mono truncate cursor-text select-none"
                >
                  {url}
                </span>
              )}
            </div>
            <button
              onClick={refresh}
              className="p-1 rounded hover:bg-white/[0.06] text-gray-500 hover:text-white transition shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Viewport */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${device}-${key}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ height: currentDevice.height }}
              className="w-full bg-white relative overflow-hidden"
            >
              <PreviewErrorBoundary resetKey={`${mode}-${key}-${files.length}`}>
                {useSandpack ? (
                  <SandpackPreview files={files} key={key} />
                ) : (
                  <iframe
                    key={key}
                    title="app-preview"
                    srcDoc={html}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-forms allow-same-origin"
                  />
                )}
              </PreviewErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
