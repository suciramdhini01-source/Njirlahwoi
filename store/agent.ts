"use client";
import { create } from "zustand";
import { AgentFile, AgentStep } from "@/types";
import { supabase, getSessionId } from "@/lib/supabase";

export type FileStatus = "pending" | "streaming" | "done";

export interface AgentPlan {
  summary: string;
  techStack: string[];
  files: { path: string; purpose: string }[];
  pages: { route: string; purpose: string }[];
  designTokens: {
    palette: Record<string, string>;
    typography: { heading: string; body: string };
    radius: string;
    vibe: string;
  };
}

interface AgentState {
  files: AgentFile[];
  fileStatuses: Record<string, FileStatus>;
  activeFile: string | null;
  isGenerating: boolean;
  logs: string[];
  steps: AgentStep[];
  prompt: string;
  plan: AgentPlan | null;
  setPlan: (p: AgentPlan | null) => void;
  setPrompt: (p: string) => void;
  setFiles: (f: AgentFile[]) => void;
  setActiveFile: (p: string | null) => void;
  appendToFile: (path: string, chunk: string) => void;
  replaceFile: (path: string, content: string) => void;
  startFile: (path: string) => void;
  endFile: (path: string) => void;
  setFileStatus: (path: string, status: FileStatus) => void;
  log: (m: string) => void;
  setGenerating: (v: boolean) => void;
  addStep: (step: AgentStep) => void;
  updateStep: (id: string, patch: Partial<AgentStep>) => void;
  reset: () => void;
  persistSession: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  files: [],
  fileStatuses: {},
  activeFile: null,
  isGenerating: false,
  logs: [],
  steps: [],
  prompt: "",
  plan: null,
  setPlan: (p) => set({ plan: p }),
  setPrompt: (p) => set({ prompt: p }),
  setFiles: (files) => set({ files }),
  setActiveFile: (p) => set({ activeFile: p }),
  setFileStatus: (path, status) =>
    set({ fileStatuses: { ...get().fileStatuses, [path]: status } }),
  startFile: (path) => {
    const files = get().files;
    const statuses = get().fileStatuses;
    if (!files.find((f) => f.path === path)) {
      set({
        files: [...files, { path, content: "", language: detectLang(path) }],
        activeFile: path,
        fileStatuses: { ...statuses, [path]: "streaming" },
      });
    } else {
      set({
        activeFile: path,
        fileStatuses: { ...statuses, [path]: "streaming" },
      });
    }
  },
  appendToFile: (path, chunk) => {
    set({
      files: get().files.map((f) =>
        f.path === path ? { ...f, content: f.content + chunk } : f
      ),
    });
  },
  replaceFile: (path, content) => {
    set({
      files: get().files.map((f) =>
        f.path === path ? { ...f, content } : f
      ),
    });
  },
  endFile: (path) => {
    set({
      fileStatuses: { ...get().fileStatuses, [path]: "done" },
    });
  },
  log: (m) => {
    const next = get().logs.concat(m);
    // cap logs to avoid unbounded growth + re-render storm
    if (next.length > 200) next.splice(0, next.length - 200);
    set({ logs: next });
  },
  setGenerating: (v) => set({ isGenerating: v }),
  addStep: (step) => set({ steps: [...get().steps, step] }),
  updateStep: (id, patch) =>
    set({
      steps: get().steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }),
  reset: () =>
    set({ files: [], fileStatuses: {}, activeFile: null, logs: [], steps: [], plan: null }),

  persistSession: async () => {
    const { files, prompt, plan } = get();
    if (!files.length) return;
    const sessionId = getSessionId();
    try {
      const { data: sess } = await supabase
        .from("nj_agent_sessions")
        .upsert(
          { session_id: sessionId, prompt, plan, updated_at: new Date().toISOString() },
          { onConflict: "session_id" }
        )
        .select("id")
        .maybeSingle();
      if (!sess) return;
      const rows = files.map((f) => ({
        agent_session_id: sess.id,
        path: f.path,
        content: f.content,
        language: f.language,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from("nj_agent_files").upsert(rows, { onConflict: "agent_session_id,path" });
    } catch { /* non-fatal */ }
  },

  restoreSession: async () => {
    const sessionId = getSessionId();
    try {
      const { data: sess } = await supabase
        .from("nj_agent_sessions")
        .select("id, prompt, plan")
        .eq("session_id", sessionId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!sess) return false;
      const { data: fileRows } = await supabase
        .from("nj_agent_files")
        .select("path, content, language")
        .eq("agent_session_id", sess.id);
      if (!fileRows?.length) return false;
      const files: AgentFile[] = fileRows.map((r) => ({
        path: r.path,
        content: r.content,
        language: r.language || "text",
      }));
      const fileStatuses: Record<string, "done"> = {};
      for (const f of files) fileStatuses[f.path] = "done";
      set({
        files,
        fileStatuses,
        activeFile: files[0]?.path ?? null,
        prompt: sess.prompt || "",
        plan: sess.plan ?? null,
      });
      return true;
    } catch {
      return false;
    }
  },
}));

function detectLang(p: string): string {
  const ext = p.split(".").pop() || "";
  const map: Record<string, string> = {
    tsx: "tsx",
    ts: "typescript",
    jsx: "jsx",
    js: "javascript",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
  };
  return map[ext] || "text";
}
