"use client";
import { create } from "zustand";

export type PreviewStatus = "idle" | "booting" | "installing" | "starting" | "running" | "error";

interface PreviewState {
  status: PreviewStatus;
  previewUrl: string | null;
  logs: string[];
  errorMessage: string | null;

  setStatus: (s: PreviewStatus) => void;
  setPreviewUrl: (url: string | null) => void;
  pushLog: (line: string) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

export const usePreviewStore = create<PreviewState>((set, get) => ({
  status: "idle",
  previewUrl: null,
  logs: [],
  errorMessage: null,

  setStatus: (status) => set({ status }),
  setPreviewUrl: (previewUrl) => set({ previewUrl }),
  pushLog: (line) => {
    const logs = [...get().logs, line];
    if (logs.length > 500) logs.splice(0, logs.length - 500);
    set({ logs });
  },
  setError: (errorMessage) => set({ status: "error", errorMessage }),
  reset: () =>
    set({ status: "idle", previewUrl: null, logs: [], errorMessage: null }),
}));
