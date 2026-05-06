'use client';

import { create } from 'zustand';
import type { ModelInfo } from '@/types/model-types';

interface ModelState {
  openrouterModels: ModelInfo[];
  cloudflareModels: ModelInfo[];
  isLoadingModels: boolean;
  fetchOpenRouterModels: (apiKey: string) => Promise<void>;
  fetchCloudflareModels: () => Promise<void>;
}

const CF_FALLBACK: ModelInfo[] = [
  { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct', provider: 'Cloudflare', free: true, source: 'cloudflare' },
  { id: '@cf/meta/llama-3.2-3b-instruct', name: 'Llama 3.2 3B Instruct', provider: 'Cloudflare', free: true, source: 'cloudflare' },
  { id: '@cf/meta/llama-3.2-1b-instruct', name: 'Llama 3.2 1B Instruct', provider: 'Cloudflare', free: true, source: 'cloudflare' },
  { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B Instruct', provider: 'Cloudflare', free: true, source: 'cloudflare' },
  { id: '@cf/mistral/mistral-7b-instruct-v0.1', name: 'Mistral 7B Instruct', provider: 'Cloudflare', free: true, source: 'cloudflare' },
  { id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill 32B', provider: 'Cloudflare', free: true, source: 'cloudflare' },
  { id: '@cf/qwen/qwen2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', provider: 'Cloudflare', free: true, source: 'cloudflare' },
  { id: '@cf/google/gemma-7b-it-lora', name: 'Gemma 7B IT LoRA', provider: 'Cloudflare', free: true, source: 'cloudflare' },
  { id: '@cf/microsoft/phi-2', name: 'Phi-2', provider: 'Cloudflare', free: true, source: 'cloudflare' },
  { id: '@cf/tiiuae/falcon-7b-instruct', name: 'Falcon 7B Instruct', provider: 'Cloudflare', free: true, source: 'cloudflare' },
];

interface OpenRouterRawModel {
  id: string;
  name?: string;
  owned_by?: string;
  pricing?: { prompt?: string; completion?: string };
  context_length?: number;
}

interface CloudflareRawModel {
  name?: string;
  description?: string;
}

export const useModelStore = create<ModelState>((set) => ({
  openrouterModels: [],
  cloudflareModels: [],
  isLoadingModels: false,

  fetchOpenRouterModels: async (apiKey: string) => {
    if (!apiKey) {
      set({ openrouterModels: [] });
      return;
    }
    set({ isLoadingModels: true });
    try {
      const res = await fetch('/api/openrouter/models', {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
      });
      if (!res.ok) throw new Error(`OpenRouter models fetch gagal: ${res.status}`);
      const json = (await res.json()) as { data?: OpenRouterRawModel[] };
      const models: ModelInfo[] = (json.data ?? []).map((m) => {
        const isFree =
          (m.pricing?.prompt === '0' && m.pricing?.completion === '0') ||
          /:free$/i.test(m.id);
        const providerPart = m.id.split('/')[0] ?? 'Unknown';
        return {
          id: m.id,
          name: m.name ?? m.id,
          provider: m.owned_by ?? providerPart,
          free: isFree,
          pricing: m.pricing
            ? { prompt: m.pricing.prompt ?? '0', completion: m.pricing.completion ?? '0' }
            : undefined,
          source: 'openrouter' as const,
        };
      });
      set({ openrouterModels: models, isLoadingModels: false });
    } catch {
      set({ openrouterModels: [], isLoadingModels: false });
    }
  },

  fetchCloudflareModels: async () => {
    set({ isLoadingModels: true });
    try {
      const res = await fetch('/api/cloudflare/models');
      if (!res.ok) throw new Error(`Cloudflare models fetch gagal: ${res.status}`);
      const json = (await res.json()) as { models?: CloudflareRawModel[] };
      const raw = json.models ?? [];
      const models: ModelInfo[] = raw.map((m) => ({
        id: m.name ?? '',
        name: (m.name ?? '').replace('@cf/', '').split('/').pop()?.replace(/-/g, ' ') ?? m.name ?? '',
        provider: 'Cloudflare',
        free: true,
        source: 'cloudflare' as const,
      }));
      set({ cloudflareModels: models.length ? models : CF_FALLBACK, isLoadingModels: false });
    } catch {
      set({ cloudflareModels: CF_FALLBACK, isLoadingModels: false });
    }
  },
}));
