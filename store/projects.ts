"use client";
import { create } from "zustand";

export type ProjectKind = "fullstack" | "mobile" | "landing";
export type ProjectStatus = "draft" | "building" | "ready" | "error";

export interface Project {
  id: string;
  name: string;
  kind: ProjectKind;
  prompt: string;
  status: ProjectStatus;
  createdAt: number;
  updatedAt: number;
}

const LS_PROJECTS = "nj_projects_v1";
const LS_ACTIVE = "nj_active_project_v1";

function load(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_PROJECTS) || "[]");
  } catch {
    return [];
  }
}

function save(list: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_PROJECTS, JSON.stringify(list));
}

function genId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugName(prompt: string, kind: ProjectKind): string {
  const p = prompt.trim().split(/\s+/).slice(0, 4).join(" ");
  if (p) return p.slice(0, 32);
  return kind === "fullstack" ? "Full Stack App" : kind === "mobile" ? "Mobile App" : "Landing Page";
}

interface ProjectState {
  projects: Project[];
  activeId: string | null;
  hydrated: boolean;
  hydrate: () => void;
  create: (input: { prompt: string; kind: ProjectKind; name?: string }) => string;
  select: (id: string | null) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  setStatus: (id: string, status: ProjectStatus) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeId: null,
  hydrated: false,

  hydrate: () => {
    const projects = load();
    const activeId =
      typeof window !== "undefined" ? localStorage.getItem(LS_ACTIVE) : null;
    const valid = projects.find((p) => p.id === activeId);
    set({ projects, activeId: valid ? valid.id : null, hydrated: true });
  },

  create: ({ prompt, kind, name }) => {
    const id = genId();
    const project: Project = {
      id,
      name: name || slugName(prompt, kind),
      kind,
      prompt,
      status: "building",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const projects = [project, ...get().projects];
    save(projects);
    localStorage.setItem(LS_ACTIVE, id);
    set({ projects, activeId: id });
    return id;
  },

  select: (id) => {
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(LS_ACTIVE, id);
      else localStorage.removeItem(LS_ACTIVE);
    }
    set({ activeId: id });
  },

  rename: (id, name) => {
    const projects = get().projects.map((p) =>
      p.id === id ? { ...p, name, updatedAt: Date.now() } : p
    );
    save(projects);
    set({ projects });
  },

  remove: (id) => {
    const projects = get().projects.filter((p) => p.id !== id);
    save(projects);
    const { activeId } = get();
    const nextActive = activeId === id ? null : activeId;
    if (typeof window !== "undefined") {
      if (nextActive) localStorage.setItem(LS_ACTIVE, nextActive);
      else localStorage.removeItem(LS_ACTIVE);
    }
    set({ projects, activeId: nextActive });
  },

  setStatus: (id, status) => {
    const projects = get().projects.map((p) =>
      p.id === id ? { ...p, status, updatedAt: Date.now() } : p
    );
    save(projects);
    set({ projects });
  },
}));
