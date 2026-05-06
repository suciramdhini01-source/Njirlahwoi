"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Code2, Monitor, FileCode2, RefreshCw, Loader2, Rocket,
  PanelLeftClose, PanelLeftOpen, Info,
} from "lucide-react";
import { useAgentStore } from "@/store/agent";
import { useWorkspaceStore } from "@/store/workspace";
import { buildPreviewHtml } from "@/lib/build-preview";
import { PreviewErrorBoundary } from "@/components/preview/PreviewErrorBoundary";
import { FileTree } from "@/components/agent/FileTree";
import { CodeEditor } from "@/components/agent/CodeEditor";

const SandpackPreview = dynamic(() => import("@/components/preview/SandpackPreview"), { ssr: false });

type Tab = "code" | "preview";

interface Props {
  projectId: string;
}

function isReactProject(files: { path: string }[]) {
  return files.some(
    (f) => f.path.endsWith(".tsx") || f.path.endsWith(".jsx") || f.path === "app/page.tsx"
  );
}

export function WorkspaceEditorPanel({ projectId: _id }: Props) {
  const agentFiles = useAgentStore((s) => s.files);
  const fileStatuses = useAgentStore((s) => s.fileStatuses);
  const isGenerating = useAgentStore((s) => s.isGenerating);
  const activeFile = useAgentStore((s) => s.activeFile);
  const setActiveFile = useAgentStore((s) => s.setActiveFile);
  const isBuilding = useWorkspaceStore((s) => s.isBuilding);
  const project = useWorkspaceStore((s) => s.project);

  const [tab, setTab] = useState<Tab>("code");
  const [previewKey, setPreviewKey] = useState(0);
  const [treeOpen, setTreeOpen] = useState(true);

  const activeFileObj = useMemo(
    () => agentFiles.find((f) => f.path === activeFile) || null,
    [agentFiles, activeFile]
  );

  const hasReact = isReactProject(agentFiles);
  const previewHtml = useMemo(() => buildPreviewHtml(agentFiles), [agentFiles]);
  const hasFiles = agentFiles.length > 0;

  return (
    <div className="h-full flex flex-col bg-[#03060a] min-w-0">
      {/* Top toolbar — single row, horizontally scrollable on narrow */}
      <div className="shrink-0 flex items-center gap-1 border-b border-white/[0.07] bg-[#040706] px-2 overflow-x-auto scrollbar-none">
        {/* Tree toggle (code tab only) */}
        {tab === "code" && (
          <button
            onClick={() => setTreeOpen((o) => !o)}
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/[0.05] transition"
            title={treeOpen ? "Hide file tree" : "Show file tree"}
          >
            {treeOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        )}

        {/* Code / Preview tabs */}
        <div className="shrink-0 flex items-center gap-0">
          {(["code", "preview"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition ${
                tab === t ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === t && (
                <motion.div
                  layoutId="ws-editor-tab"
                  className="absolute inset-0 bg-white/[0.05] rounded-md"
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {t === "code" ? <Code2 className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                <span className="hidden xs:inline">{t === "code" ? "Code" : "Preview"}</span>
                <span className="xs:hidden">{t === "code" ? "Code" : "Live"}</span>
              </span>
            </button>
          ))}
        </div>

        {hasFiles && (
          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-500">
            {agentFiles.length} file{agentFiles.length !== 1 ? "s" : ""}
          </span>
        )}

        {isBuilding && (
          <div className="shrink-0 flex items-center gap-1.5 text-[10px] text-blue-400 pl-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="hidden sm:inline">Generating…</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1 shrink-0">
          {tab === "preview" && hasFiles && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setPreviewKey((k) => k + 1)}
              className="h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06] transition"
              title="Refresh preview"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </motion.button>
          )}
          <button
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-[11px] font-medium text-gray-300 hover:bg-white/[0.06] transition"
            title="Project info"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            disabled={!hasFiles}
            className={`h-8 px-3 flex items-center gap-1.5 rounded-md text-[11px] font-semibold transition ${
              hasFiles
                ? "bg-[#18C493] text-[#052018] shadow-[0_0_14px_rgba(24,196,147,0.4)] hover:shadow-[0_0_20px_rgba(24,196,147,0.6)]"
                : "bg-white/[0.04] border border-white/[0.08] text-gray-600 cursor-not-allowed"
            }`}
            title="Deploy project"
          >
            <Rocket className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Deploy</span>
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === "code" ? (
          <motion.div
            key="code"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex min-h-0 min-w-0"
          >
            {treeOpen && (
              <div className="w-[180px] sm:w-[200px] shrink-0 border-r border-white/[0.07] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {hasFiles ? (
                  <FileTree
                    files={agentFiles}
                    active={activeFile}
                    onSelect={setActiveFile}
                    fileStatuses={fileStatuses}
                  />
                ) : (
                  <EmptyFileTree isBuilding={isBuilding} />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              {activeFileObj ? (
                <CodeEditor file={activeFileObj} streaming={isGenerating} />
              ) : (
                <EmptyEditor isBuilding={isBuilding} plan={project?.plan as any} />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-h-0 overflow-hidden"
          >
            <PreviewErrorBoundary resetKey={`preview-${previewKey}-${agentFiles.length}`}>
              {hasReact ? (
                <SandpackPreview files={agentFiles} key={previewKey} />
              ) : hasFiles ? (
                <iframe
                  key={previewKey}
                  title="workspace-preview"
                  srcDoc={previewHtml}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                />
              ) : (
                <EmptyPreview isBuilding={isBuilding} />
              )}
            </PreviewErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyFileTree({ isBuilding }: { isBuilding: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
      <FileCode2 className="h-6 w-6 text-gray-700" />
      <p className="text-[10px] text-gray-500 text-center leading-relaxed">
        {isBuilding ? "Generating files…" : "Belum ada file"}
      </p>
    </div>
  );
}

function EmptyEditor({ isBuilding, plan }: { isBuilding: boolean; plan?: { summary?: string; techStack?: string[] } | null }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <Code2 className="h-10 w-10 text-gray-700" />
      <p className="text-sm text-gray-400">
        {isBuilding ? "Agent sedang menulis kode…" : "Pilih file dari file tree"}
      </p>
      {plan?.summary && (
        <div className="max-w-md w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left">
          <p className="text-[10px] font-semibold text-[#18C493] uppercase tracking-wider mb-1">Plan</p>
          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">{plan.summary}</p>
          {plan.techStack?.length ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {plan.techStack.slice(0, 5).map((t) => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#18C493]/10 border border-[#18C493]/25 text-[#BFF5E0]">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function EmptyPreview({ isBuilding }: { isBuilding: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#03060a]">
      <Monitor className="h-10 w-10 text-gray-700" />
      <p className="text-sm text-gray-500">
        {isBuilding ? "Menunggu build selesai…" : "Preview akan muncul setelah build"}
      </p>
    </div>
  );
}
