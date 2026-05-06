"use client";
import { create } from "zustand";
import { AIModel } from "@/types";

// ─── NJIR LAH — Built-in model, always available, no API key needed ───────────
export const NJIR_LAH_MODEL: AIModel = {
  id: "njir-lah-v2-turbo",
  name: "NJIR LAH",
  provider: "NJIRLAH AI",
  source: "njiriah",
  context: 8192,
  free: true,
  description:
    "Built-in LLM buatan NJIRLAH AI. Gratis, tanpa API key, tersedia untuk semua user. Berjalan di Supabase Edge global. Dibuat oleh Andikaa Saputraa.",
};

// ─── Built-in provider models (server-side keys via env) ──────────────────────
export const REPLIT_MODELS: AIModel[] = [
  { id: "gpt-5.4", name: "GPT-5.4", provider: "OpenAI", source: "replit", free: true, description: "OpenAI flagship via Replit AI integration" },
  { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI", source: "replit", free: true, description: "OpenAI GPT-5.2 via Replit" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI", source: "replit", free: true, description: "Fast compact GPT-5" },
  { id: "gpt-5-nano", name: "GPT-5 Nano", provider: "OpenAI", source: "replit", free: true, description: "Ultra-fast tiny GPT-5" },
  { id: "o4-mini", name: "o4-mini", provider: "OpenAI", source: "replit", free: true, description: "Reasoning-tuned o-series mini" },
  { id: "o3", name: "o3", provider: "OpenAI", source: "replit", free: true, description: "OpenAI o3 reasoning" },
];

export const ANTHROPIC_MODELS: AIModel[] = [
  { id: "claude-opus-4-7", name: "Claude Opus 4.7", provider: "Anthropic", source: "anthropic", free: true, description: "Most capable Claude" },
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "Anthropic", source: "anthropic", free: true },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "Anthropic", source: "anthropic", free: true, description: "Balanced Claude" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "Anthropic", source: "anthropic", free: true, description: "Fast Claude" },
];

export const GEMINI_MODELS: AIModel[] = [
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", provider: "Google", source: "gemini", free: true, description: "Latest Gemini flagship" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview", provider: "Google", source: "gemini", free: true },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", source: "gemini", free: true },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", source: "gemini", free: true },
];

const CF_FALLBACK: AIModel[] = [
  "@cf/meta/llama-3.1-8b-instruct",
  "@cf/meta/llama-3.2-3b-instruct",
  "@cf/meta/llama-3.2-1b-instruct",
  "@cf/mistral/mistral-7b-instruct-v0.1",
  "@cf/google/gemma-2b-it-lora",
  "@cf/google/gemma-7b-it-lora",
  "@cf/qwen/qwen1.5-7b-chat-awq",
  "@cf/qwen/qwen1.5-14b-chat-awq",
  "@cf/microsoft/phi-2",
  "@cf/tiiuae/falcon-7b-instruct",
].map((id) => ({
  id,
  name: id.split("/").pop() || id,
  provider: "Cloudflare",
  source: "cloudflare" as const,
}));

interface ModelState {
  openrouterModels: AIModel[];
  cloudflareModels: AIModel[];
  loadingOR: boolean;
  loadingCF: boolean;
  fetchOpenrouter: (key: string) => Promise<void>;
  fetchCloudflare: (token: string, accountId: string) => Promise<void>;
}

export const useModelStore = create<ModelState>((set) => ({
  openrouterModels: [],
  cloudflareModels: [],
  loadingOR: false,
  loadingCF: false,

  fetchOpenrouter: async (key) => {
    if (!key) {
      set({ openrouterModels: [] });
      return;
    }
    set({ loadingOR: true });
    try {
      // Use our server-side proxy to avoid leaking key in browser network tab
      // and to avoid any CORS edge cases in deployed environments.
      const res = await fetch("/api/openrouter/models", {
        method: "POST",
        headers: { "x-api-key": key },
      });
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const json = await res.json();
      const models: AIModel[] = (json.data || []).map((m: {
        id: string;
        name?: string;
        pricing?: { prompt?: string; completion?: string };
        context_length?: number;
        description?: string;
      }) => {
        const provider = (m.id || "").split("/")[0] || "Unknown";
        const isFree =
          (m.pricing?.prompt === "0" && m.pricing?.completion === "0") ||
          /:free/i.test(m.id || "");
        return {
          id: m.id,
          name: m.name || m.id,
          provider,
          source: "openrouter" as const,
          context: m.context_length,
          free: isFree,
          description: m.description,
        };
      });
      set({ openrouterModels: models, loadingOR: false });
    } catch {
      set({ openrouterModels: [], loadingOR: false });
    }
  },

  fetchCloudflare: async (token, accountId) => {
    if (!token || !accountId) {
      set({ cloudflareModels: [] });
      return;
    }
    set({ loadingCF: true });
    try {
      const res = await fetch("/api/cloudflare/models", {
        method: "POST",
        headers: {
          "x-cf-token": token,
          "x-cf-account-id": accountId,
        },
      });
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const json = await res.json();
      const result: { name?: string; description?: string }[] = json.result || [];
      const models: AIModel[] = result.map((m) => ({
        id: m.name || "",
        name: (m.name || "").split("/").pop() || m.name || "",
        provider: "Cloudflare",
        source: "cloudflare" as const,
        description: m.description,
      }));
      set({
        cloudflareModels: models.length ? models : CF_FALLBACK,
        loadingCF: false,
      });
    } catch {
      set({ cloudflareModels: CF_FALLBACK, loadingCF: false });
    }
  },
}));
