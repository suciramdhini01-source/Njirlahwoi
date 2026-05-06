"use client";
import { create } from "zustand";
import { decrypt, encrypt } from "@/lib/encryption";
import { PROVIDERS } from "@/lib/provider-configs";

export type ProviderStatus = "unconfigured" | "untested" | "ok" | "error";

export interface ProviderEntry {
  slug: string;
  values: Record<string, string>;
  status: ProviderStatus;
  message?: string;
  modelCount?: number;
  models?: { id: string; name?: string; context?: number }[];
  testedAt?: number;
}

const LS_KEY = "nj_providers_v1";

interface StoredShape {
  [slug: string]: { cipher: string };
}

interface ProviderState {
  entries: Record<string, ProviderEntry>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  saveProvider: (slug: string, values: Record<string, string>) => Promise<void>;
  removeProvider: (slug: string) => void;
  setStatus: (slug: string, status: ProviderStatus, message?: string, modelCount?: number) => void;
  setModels: (slug: string, models: { id: string; name?: string; context?: number }[]) => void;
  testConnection: (slug: string) => Promise<boolean>;
  fetchModels: (slug: string) => Promise<void>;
}

async function persist(entries: Record<string, ProviderEntry>) {
  const store: StoredShape = {};
  for (const [slug, e] of Object.entries(entries)) {
    if (Object.keys(e.values).length === 0) continue;
    const cipher = await encrypt(JSON.stringify(e.values));
    store[slug] = { cipher };
  }
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  entries: {},
  hydrated: false,

  hydrate: async () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(LS_KEY);
    const entries: Record<string, ProviderEntry> = {};
    for (const p of PROVIDERS) {
      entries[p.slug] = { slug: p.slug, values: {}, status: "unconfigured" };
    }
    if (raw) {
      try {
        const parsed: StoredShape = JSON.parse(raw);
        for (const [slug, { cipher }] of Object.entries(parsed)) {
          const plain = await decrypt(cipher);
          if (plain) {
            try {
              const values = JSON.parse(plain);
              if (entries[slug]) {
                entries[slug] = { slug, values, status: "untested" };
              }
            } catch {}
          }
        }
      } catch {}
    }
    set({ entries, hydrated: true });
  },

  saveProvider: async (slug, values) => {
    const entries = { ...get().entries };
    entries[slug] = {
      ...(entries[slug] || { slug, status: "unconfigured" }),
      slug,
      values,
      status: "untested",
    };
    set({ entries });
    await persist(entries);
  },

  removeProvider: (slug) => {
    const entries = { ...get().entries };
    entries[slug] = { slug, values: {}, status: "unconfigured" };
    set({ entries });
    persist(entries);
  },

  setStatus: (slug, status, message, modelCount) => {
    const entries = { ...get().entries };
    if (!entries[slug]) return;
    entries[slug] = { ...entries[slug], status, message, modelCount, testedAt: Date.now() };
    set({ entries });
  },

  setModels: (slug, models) => {
    const entries = { ...get().entries };
    if (!entries[slug]) return;
    entries[slug] = { ...entries[slug], models, modelCount: models.length };
    set({ entries });
  },

  testConnection: async (slug) => {
    const entry = get().entries[slug];
    if (!entry || Object.keys(entry.values).length === 0) {
      get().setStatus(slug, "error", "Belum dikonfigurasi");
      return false;
    }
    try {
      const res = await fetch("/api/njir/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, values: entry.values }),
      });
      const json = await res.json();
      if (json.success) {
        get().setStatus(slug, "ok", json.message, json.modelCount);
        if (Array.isArray(json.models)) get().setModels(slug, json.models);
        return true;
      }
      get().setStatus(slug, "error", json.message || "Test gagal");
      return false;
    } catch (e) {
      get().setStatus(slug, "error", (e as Error).message);
      return false;
    }
  },

  fetchModels: async (slug) => {
    const entry = get().entries[slug];
    if (!entry || Object.keys(entry.values).length === 0) return;
    try {
      const res = await fetch("/api/njir/fetch-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, values: entry.values }),
      });
      const json = await res.json();
      if (Array.isArray(json.models)) get().setModels(slug, json.models);
    } catch {}
  },
}));
