"use client";
import { create } from "zustand";

export type AgentTier = "free" | "pro" | "beta";

export interface AgentPreset {
  id: string;
  label: string;
  tagline: string;
  tier: AgentTier;
  builtin: boolean;
  icon: string;
  accent: string;
  systemPrompt: string;
  mcpTools: string[];
  subAgents: string[];
}

export const BUILTIN_PRESETS: AgentPreset[] = [
  {
    id: "e-1",
    label: "E-1",
    tagline: "Stable & thorough",
    tier: "free",
    builtin: true,
    icon: "Gauge",
    accent: "#18C493",
    systemPrompt:
      "You are E-1, a stable and thorough full-stack engineer agent. Produce reliable, well-tested code. Favor clarity over cleverness.",
    mcpTools: ["Default tools"],
    subAgents: ["Fullstack Testing"],
  },
  {
    id: "e-2",
    label: "E-2",
    tagline: "Thorough & Relentless",
    tier: "pro",
    builtin: true,
    icon: "Flame",
    accent: "#FF7A45",
    systemPrompt:
      "You are E-2, a relentless senior engineer. Iterate until the task is complete, cover edge cases, and verify with tests.",
    mcpTools: ["Default tools", "Specialized tools"],
    subAgents: ["Fullstack Testing", "Integration", "Troubleshoot"],
  },
  {
    id: "e-3",
    label: "E-3",
    tagline: "Autonomous & Powerful",
    tier: "beta",
    builtin: true,
    icon: "Zap",
    accent: "#22D3EE",
    systemPrompt:
      "You are E-3 (Beta), an autonomous architect. Break down ambiguous goals, plan, execute and deploy end-to-end with minimal guidance.",
    mcpTools: ["Default tools", "Specialized tools", "Supabase MCP"],
    subAgents: ["Vision", "Fullstack Testing", "Integration", "Deployment", "Troubleshoot"],
  },
  {
    id: "proto-frontend",
    label: "Prototype",
    tagline: "Frontend Only Apps",
    tier: "free",
    builtin: true,
    icon: "Layers",
    accent: "#60A5FA",
    systemPrompt:
      "You are Prototype, a rapid frontend-only agent. Build beautiful, static UI prototypes with React + Tailwind. Do not wire backends.",
    mcpTools: ["Default tools"],
    subAgents: ["Frontend Testing"],
  },
  {
    id: "mobile",
    label: "Mobile",
    tagline: "Agent for mobile apps",
    tier: "pro",
    builtin: true,
    icon: "Smartphone",
    accent: "#F472B6",
    systemPrompt:
      "You are Mobile, a specialist for iOS & Android-style responsive applications. Use React Native conventions when asked.",
    mcpTools: ["Default tools", "Specialized tools"],
    subAgents: ["Frontend Testing", "Integration"],
  },
  {
    id: "nextjs",
    label: "NextJS",
    tagline: "Agent for NextJS apps",
    tier: "pro",
    builtin: true,
    icon: "Rocket",
    accent: "#F59E0B",
    systemPrompt:
      "You are NextJS Agent, an expert in Next.js App Router, Server Components, Edge runtime and Vercel deployment.",
    mcpTools: ["Default tools", "Supabase MCP"],
    subAgents: ["Fullstack Testing", "Deployment"],
  },
  {
    id: "realtime",
    label: "Realtime",
    tagline: "Live collab + Supabase channels",
    tier: "pro",
    builtin: true,
    icon: "Radio",
    accent: "#10B981",
    systemPrompt:
      "You are Realtime Agent. Build apps that subscribe to Supabase Realtime channels (broadcast, presence, postgres_changes). Always create a supabase client singleton, use useEffect to subscribe/unsubscribe cleanly, and show connection status in the UI. Prefer optimistic updates and debounce writes.",
    mcpTools: ["Default tools", "Supabase MCP"],
    subAgents: ["Fullstack Testing", "Integration"],
  },
];

const LS_AGENTS = "nj_agents_v1";
const LS_ACTIVE = "nj_agent_active_v1";

function load(): AgentPreset[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_AGENTS) || "[]");
  } catch {
    return [];
  }
}

function save(list: AgentPreset[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_AGENTS, JSON.stringify(list));
}

function genId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {}
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface AgentPresetState {
  custom: AgentPreset[];
  activeId: string;
  hydrated: boolean;
  hydrate: () => void;
  all: () => AgentPreset[];
  active: () => AgentPreset;
  setActive: (id: string) => void;
  createCustom: (input: Omit<AgentPreset, "id" | "builtin">) => string;
  removeCustom: (id: string) => void;
}

export const useAgentPresetStore = create<AgentPresetState>((set, get) => ({
  custom: [],
  activeId: "e-1",
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const custom = load();
    const activeId =
      (typeof window !== "undefined" && localStorage.getItem(LS_ACTIVE)) || "e-1";
    set({ custom, activeId, hydrated: true });
  },

  all: () => [...BUILTIN_PRESETS, ...get().custom],

  active: () => {
    const list = [...BUILTIN_PRESETS, ...get().custom];
    return list.find((p) => p.id === get().activeId) || BUILTIN_PRESETS[0];
  },

  setActive: (id) => {
    if (typeof window !== "undefined") localStorage.setItem(LS_ACTIVE, id);
    set({ activeId: id });
  },

  createCustom: (input) => {
    const id = genId();
    const preset: AgentPreset = { ...input, id, builtin: false };
    const custom = [preset, ...get().custom];
    save(custom);
    set({ custom });
    return id;
  },

  removeCustom: (id) => {
    const custom = get().custom.filter((p) => p.id !== id);
    save(custom);
    const activeId = get().activeId === id ? "e-1" : get().activeId;
    if (typeof window !== "undefined") localStorage.setItem(LS_ACTIVE, activeId);
    set({ custom, activeId });
  },
}));
