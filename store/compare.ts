"use client";
import { create } from "zustand";
import { ModelProvider } from "@/types";

export interface CompareRound {
  id: string;
  prompt: string;
  responseA: string;
  responseB: string;
  latencyA: number;
  latencyB: number;
  tokensA?: number;
  tokensB?: number;
}

interface State {
  isActive: boolean;
  modelA: string;
  providerA: ModelProvider;
  modelB: string;
  providerB: ModelProvider;
  rounds: CompareRound[];
  streaming: boolean;
  setActive: (v: boolean) => void;
  setModelA: (m: string, p: ModelProvider) => void;
  setModelB: (m: string, p: ModelProvider) => void;
  addRound: (r: CompareRound) => void;
  updateRound: (id: string, patch: Partial<CompareRound>) => void;
  clear: () => void;
  setStreaming: (v: boolean) => void;
}

export const useCompareStore = create<State>((set, get) => ({
  isActive: false,
  modelA: "gpt-5.4",
  providerA: "replit",
  modelB: "@cf/meta/llama-3.1-8b-instruct",
  providerB: "cloudflare",
  rounds: [],
  streaming: false,
  setActive: (v) => set({ isActive: v }),
  setModelA: (modelA, providerA) => set({ modelA, providerA }),
  setModelB: (modelB, providerB) => set({ modelB, providerB }),
  addRound: (r) => set({ rounds: [...get().rounds, r] }),
  updateRound: (id, patch) =>
    set({ rounds: get().rounds.map((r) => (r.id === id ? { ...r, ...patch } : r)) }),
  clear: () => set({ rounds: [] }),
  setStreaming: (v) => set({ streaming: v }),
}));
