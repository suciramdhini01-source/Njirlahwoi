"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion } from "framer-motion";
import { MessageSquare, Code2 } from "lucide-react";
import { MatrixRain } from "@/components/layout/MatrixRain";
import { MouseGlow } from "@/components/layout/MouseGlow";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { useWorkspaceStore } from "@/store/workspace";
import { WorkspaceTopBar } from "./WorkspaceTopBar";
import { WorkspaceChatPanel } from "./WorkspaceChatPanel";
import { WorkspaceEditorPanel } from "./WorkspaceEditorPanel";

interface Props {
  projectId: string;
}

type MobileTab = "chat" | "editor";

export function WorkspaceShell({ projectId }: Props) {
  const loadProject = useWorkspaceStore((s) => s.loadProject);
  const project = useWorkspaceStore((s) => s.project);
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    loadProject(projectId);
    return () => useWorkspaceStore.getState().teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div className="relative h-[100dvh] w-full bg-[#040706] text-white overflow-hidden flex flex-col">
      <MatrixRain opacity={0.12} />
      <MouseGlow />
      <CommandPalette />

      <div className="relative z-20 flex flex-col h-full">
        <WorkspaceTopBar projectId={projectId} onBack={() => router.push("/")} />

        {!project ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="text-sm text-gray-500"
            >
              Memuat workspace...
            </motion.div>
          </div>
        ) : isDesktop ? (
          <PanelGroup
            direction="horizontal"
            className="flex-1 min-h-0"
            autoSaveId={`ws-${projectId}`}
          >
            <Panel defaultSize={34} minSize={24} maxSize={52}>
              <ErrorBoundary scope="WorkspaceChat" fallbackTitle="Chat panel error">
                <WorkspaceChatPanel projectId={projectId} />
              </ErrorBoundary>
            </Panel>

            <PanelResizeHandle className="group relative w-[5px] flex items-center justify-center cursor-col-resize">
              <div className="absolute inset-y-0 w-px bg-white/[0.07] group-hover:bg-[#18C493]/50 transition-colors" />
              <div className="relative z-10 h-8 w-[3px] rounded-full bg-white/[0.12] group-hover:bg-[#18C493]/70 group-active:bg-[#18C493] transition-colors" />
            </PanelResizeHandle>

            <Panel defaultSize={66} minSize={40}>
              <ErrorBoundary scope="WorkspaceEditor" fallbackTitle="Editor panel error">
                <WorkspaceEditorPanel projectId={projectId} />
              </ErrorBoundary>
            </Panel>
          </PanelGroup>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="relative flex-1 min-h-0">
              <div className={`absolute inset-0 ${mobileTab === "chat" ? "visible" : "invisible pointer-events-none"}`}>
                <ErrorBoundary scope="WorkspaceChat" fallbackTitle="Chat panel error">
                  <WorkspaceChatPanel projectId={projectId} />
                </ErrorBoundary>
              </div>
              <div className={`absolute inset-0 ${mobileTab === "editor" ? "visible" : "invisible pointer-events-none"}`}>
                <ErrorBoundary scope="WorkspaceEditor" fallbackTitle="Editor panel error">
                  <WorkspaceEditorPanel projectId={projectId} />
                </ErrorBoundary>
              </div>
            </div>

            <div className="shrink-0 grid grid-cols-2 border-t border-white/[0.07] bg-[#030505]">
              {(
                [
                  { id: "chat" as MobileTab, label: "Chat", icon: MessageSquare },
                  { id: "editor" as MobileTab, label: "Editor", icon: Code2 },
                ]
              ).map((t) => {
                const Icon = t.icon;
                const active = mobileTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setMobileTab(t.id)}
                    className={`relative flex items-center justify-center gap-2 py-3 text-[12px] font-medium transition ${
                      active ? "text-[#18C493]" : "text-gray-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                    {active && (
                      <motion.span
                        layoutId="ws-mobile-tab"
                        className="absolute top-0 left-3 right-3 h-[2px] bg-[#18C493] rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
