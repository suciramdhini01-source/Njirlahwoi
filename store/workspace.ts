"use client";
import { create } from "zustand";
import { supabase, getSessionId } from "@/lib/supabase";

export type WsProjectStatus = "draft" | "building" | "ready" | "error";
export type WsProjectKind = "fullstack" | "mobile" | "landing";

export interface WsMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
}

export interface WsFile {
  path: string;
  content: string;
  language: string;
}

export interface WsProject {
  id: string;
  sessionId: string;
  name: string;
  kind: WsProjectKind;
  prompt: string;
  plan: unknown;
  status: WsProjectStatus;
  createdAt: number;
  updatedAt: number;
}

interface WorkspaceState {
  // Currently loaded project
  project: WsProject | null;
  messages: WsMessage[];
  files: WsFile[];
  activeFile: string | null;
  isBuilding: boolean;
  buildError: string | null;

  // Recent projects list (for dashboard)
  recent: WsProject[];
  recentLoaded: boolean;

  // Actions
  createProject: (opts: { prompt: string; kind: WsProjectKind; name?: string }) => Promise<string>;
  loadProject: (id: string) => Promise<void>;
  teardown: () => void;

  addMessage: (msg: Omit<WsMessage, "id" | "createdAt">) => Promise<void>;
  setFiles: (files: WsFile[]) => void;
  upsertFile: (file: WsFile) => Promise<void>;
  setActiveFile: (path: string | null) => void;
  setBuilding: (v: boolean) => void;
  setBuildError: (msg: string | null) => void;
  setStatus: (status: WsProjectStatus) => void;
  setPlan: (plan: unknown) => void;
  renameProject: (name: string) => Promise<void>;

  loadRecent: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

function slugName(prompt: string, kind: WsProjectKind): string {
  const words = prompt.trim().split(/\s+/).slice(0, 5).join(" ");
  return words.slice(0, 36) || (kind === "fullstack" ? "Full Stack App" : kind === "mobile" ? "Mobile App" : "Landing Page");
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  project: null,
  messages: [],
  files: [],
  activeFile: null,
  isBuilding: false,
  buildError: null,
  recent: [],
  recentLoaded: false,

  createProject: async ({ prompt, kind, name }) => {
    const sessionId = getSessionId();
    const projectName = name || slugName(prompt, kind);
    const { data, error } = await supabase
      .from("workspace_projects")
      .insert({ session_id: sessionId, name: projectName, kind, prompt, status: "draft" })
      .select("*")
      .maybeSingle();
    if (error || !data) throw new Error(error?.message || "Failed to create project");

    const project: WsProject = {
      id: data.id,
      sessionId: data.session_id,
      name: data.name,
      kind: data.kind,
      prompt: data.prompt,
      plan: data.plan,
      status: data.status,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    };
    set({ project, messages: [], files: [], activeFile: null, isBuilding: false, buildError: null });
    return data.id;
  },

  loadProject: async (id: string) => {
    // Teardown existing WebContainer / state before loading a new project
    get().teardown();

    const [projRes, msgRes, filesRes] = await Promise.all([
      supabase.from("workspace_projects").select("*").eq("id", id).maybeSingle(),
      supabase.from("workspace_messages").select("*").eq("project_id", id).order("created_at", { ascending: true }),
      supabase.from("workspace_files").select("*").eq("project_id", id),
    ]);

    if (!projRes.data) {
      set({ project: null, messages: [], files: [], activeFile: null });
      return;
    }

    const d = projRes.data;
    const project: WsProject = {
      id: d.id,
      sessionId: d.session_id,
      name: d.name,
      kind: d.kind,
      prompt: d.prompt,
      plan: d.plan,
      status: d.status,
      createdAt: new Date(d.created_at).getTime(),
      updatedAt: new Date(d.updated_at).getTime(),
    };

    const messages: WsMessage[] = (msgRes.data || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: new Date(m.created_at).getTime(),
    }));

    const files: WsFile[] = (filesRes.data || []).map((f) => ({
      path: f.path,
      content: f.content,
      language: f.language,
    }));

    set({
      project,
      messages,
      files,
      activeFile: files[0]?.path ?? null,
      isBuilding: false,
      buildError: null,
    });
  },

  teardown: () => {
    // Clear active project state — WebContainer teardown would go here
    set({
      project: null,
      messages: [],
      files: [],
      activeFile: null,
      isBuilding: false,
      buildError: null,
    });
  },

  addMessage: async (msg) => {
    const { project } = get();
    const id = crypto.randomUUID();
    const now = Date.now();
    const full: WsMessage = { id, createdAt: now, ...msg };
    set({ messages: [...get().messages, full] });
    if (project) {
      await supabase.from("workspace_messages").insert({
        id,
        project_id: project.id,
        role: msg.role,
        content: msg.content,
      });
    }
  },

  setFiles: (files) => set({ files, activeFile: files[0]?.path ?? get().activeFile }),

  upsertFile: async (file) => {
    const { project, files } = get();
    const existing = files.find((f) => f.path === file.path);
    const next = existing
      ? files.map((f) => (f.path === file.path ? file : f))
      : [...files, file];
    set({ files: next });
    if (project) {
      await supabase.from("workspace_files").upsert(
        { project_id: project.id, path: file.path, content: file.content, language: file.language, updated_at: new Date().toISOString() },
        { onConflict: "project_id,path" }
      );
    }
  },

  setActiveFile: (path) => set({ activeFile: path }),
  setBuilding: (v) => set({ isBuilding: v }),
  setBuildError: (msg) => set({ buildError: msg }),

  setStatus: async (status) => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, status } });
    await supabase.from("workspace_projects").update({ status, updated_at: new Date().toISOString() }).eq("id", project.id);
  },

  setPlan: async (plan) => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, plan } });
    await supabase.from("workspace_projects").update({ plan, updated_at: new Date().toISOString() }).eq("id", project.id);
  },

  renameProject: async (name) => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, name } });
    await supabase.from("workspace_projects").update({ name, updated_at: new Date().toISOString() }).eq("id", project.id);
  },

  loadRecent: async () => {
    const sessionId = getSessionId();
    const { data } = await supabase
      .from("workspace_projects")
      .select("*")
      .eq("session_id", sessionId)
      .order("updated_at", { ascending: false })
      .limit(20);
    const recent: WsProject[] = (data || []).map((d) => ({
      id: d.id,
      sessionId: d.session_id,
      name: d.name,
      kind: d.kind,
      prompt: d.prompt,
      plan: d.plan,
      status: d.status,
      createdAt: new Date(d.created_at).getTime(),
      updatedAt: new Date(d.updated_at).getTime(),
    }));
    set({ recent, recentLoaded: true });
  },

  deleteProject: async (id) => {
    await supabase.from("workspace_projects").delete().eq("id", id);
    set({ recent: get().recent.filter((p) => p.id !== id) });
    if (get().project?.id === id) get().teardown();
  },
}));
