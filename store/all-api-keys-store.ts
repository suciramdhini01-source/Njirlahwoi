'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encrypt, decrypt } from '@/lib/encryption';

export interface CustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  createdAt: number;
}

interface EncryptedStorage {
  openrouterKey: string;
  byokKeys: Record<string, string>;
  cfAccountId: string;
  cfApiToken: string;
  bailianApiKey: string;
  customProviders: string;
}

interface AllApiKeysState {
  // Plain in-memory (never persisted raw)
  openrouterKey: string | null;
  byokKeys: Record<string, string | null>;
  cfAccountId: string | null;
  cfApiToken: string | null;
  bailianApiKey: string | null;
  customProviders: CustomProvider[];

  // Status
  openrouterStatus: 'idle' | 'valid' | 'invalid' | 'testing';
  cfStatus: 'idle' | 'valid' | 'invalid' | 'testing';
  bailianStatus: 'idle' | 'valid' | 'invalid' | 'testing';
  byokStatus: Record<string, 'idle' | 'valid' | 'invalid' | 'testing'>;
  customStatus: Record<string, 'idle' | 'valid' | 'invalid' | 'testing'>;

  // Encrypted payload (what is actually persisted)
  _enc: Partial<EncryptedStorage>;

  // Actions
  setOpenrouterKey: (key: string) => Promise<void>;
  setBYOKKey: (provider: string, key: string) => Promise<void>;
  setCloudflareCreds: (accountId: string, apiToken: string) => Promise<void>;
  setBailianKey: (key: string) => Promise<void>;
  addCustomProvider: (p: Omit<CustomProvider, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomProvider: (id: string, p: Partial<Omit<CustomProvider, 'id' | 'createdAt'>>) => Promise<void>;
  removeCustomProvider: (id: string) => Promise<void>;
  loadAllKeys: () => Promise<void>;

  testOpenrouterKey: (key: string) => Promise<boolean>;
  testCloudflareCreds: (accountId: string, apiToken: string) => Promise<boolean>;
  testBailianKey: (key: string) => Promise<boolean>;
  testCustomProvider: (id: string, baseUrl: string, apiKey: string, modelId: string) => Promise<boolean>;
}

async function encryptField(value: string): Promise<string> {
  return encrypt(value);
}

async function decryptField(cipher: string): Promise<string> {
  return decrypt(cipher);
}

export const useAllApiKeysStore = create<AllApiKeysState>()(
  persist(
    (set, get) => ({
      openrouterKey: null,
      byokKeys: {},
      cfAccountId: null,
      cfApiToken: null,
      bailianApiKey: null,
      customProviders: [],

      openrouterStatus: 'idle',
      cfStatus: 'idle',
      bailianStatus: 'idle',
      byokStatus: {},
      customStatus: {},

      _enc: {},

      setOpenrouterKey: async (key: string) => {
        const enc = await encryptField(key);
        set((s) => ({ openrouterKey: key, _enc: { ...s._enc, openrouterKey: enc } }));
      },

      setBYOKKey: async (provider: string, key: string) => {
        const enc = await encryptField(key);
        set((s) => ({
          byokKeys: { ...s.byokKeys, [provider]: key },
          _enc: { ...s._enc, byokKeys: { ...(s._enc.byokKeys ?? {}), [provider]: enc } },
        }));
      },

      setCloudflareCreds: async (accountId: string, apiToken: string) => {
        const [encId, encToken] = await Promise.all([
          encryptField(accountId),
          encryptField(apiToken),
        ]);
        set((s) => ({
          cfAccountId: accountId,
          cfApiToken: apiToken,
          _enc: { ...s._enc, cfAccountId: encId, cfApiToken: encToken },
        }));
      },

      setBailianKey: async (key: string) => {
        const enc = await encryptField(key);
        set((s) => ({ bailianApiKey: key, _enc: { ...s._enc, bailianApiKey: enc } }));
      },

      addCustomProvider: async (p) => {
        const provider: CustomProvider = { ...p, id: crypto.randomUUID(), createdAt: Date.now() };
        const updated = [...get().customProviders, provider];
        const enc = await encryptField(JSON.stringify(updated));
        set((s) => ({ customProviders: updated, _enc: { ...s._enc, customProviders: enc } }));
      },

      updateCustomProvider: async (id, p) => {
        const updated = get().customProviders.map((cp) =>
          cp.id === id ? { ...cp, ...p } : cp
        );
        const enc = await encryptField(JSON.stringify(updated));
        set((s) => ({ customProviders: updated, _enc: { ...s._enc, customProviders: enc } }));
      },

      removeCustomProvider: async (id: string) => {
        const updated = get().customProviders.filter((cp) => cp.id !== id);
        const enc = await encryptField(JSON.stringify(updated));
        set((s) => ({ customProviders: updated, _enc: { ...s._enc, customProviders: enc } }));
      },

      loadAllKeys: async () => {
        const { _enc } = get();
        const updates: Partial<AllApiKeysState> = {};

        if (_enc.openrouterKey) {
          const v = await decryptField(_enc.openrouterKey).catch(() => '');
          if (v) updates.openrouterKey = v;
        }
        if (_enc.cfAccountId) {
          const v = await decryptField(_enc.cfAccountId).catch(() => '');
          if (v) updates.cfAccountId = v;
        }
        if (_enc.cfApiToken) {
          const v = await decryptField(_enc.cfApiToken).catch(() => '');
          if (v) updates.cfApiToken = v;
        }
        if (_enc.bailianApiKey) {
          const v = await decryptField(_enc.bailianApiKey).catch(() => '');
          if (v) updates.bailianApiKey = v;
        }
        if (_enc.byokKeys) {
          const byokKeys: Record<string, string | null> = {};
          await Promise.all(
            Object.entries(_enc.byokKeys).map(async ([provider, enc]) => {
              const v = await decryptField(enc).catch(() => '');
              if (v) byokKeys[provider] = v;
            })
          );
          updates.byokKeys = byokKeys;
        }
        if (_enc.customProviders) {
          const json = await decryptField(_enc.customProviders).catch(() => '[]');
          try {
            updates.customProviders = JSON.parse(json) as CustomProvider[];
          } catch {
            updates.customProviders = [];
          }
        }

        set(updates);
      },

      testOpenrouterKey: async (key: string): Promise<boolean> => {
        set({ openrouterStatus: 'testing' });
        try {
          const res = await fetch('https://openrouter.ai/api/v1/models', {
            headers: { Authorization: `Bearer ${key}` },
          });
          const ok = res.ok;
          set({ openrouterStatus: ok ? 'valid' : 'invalid' });
          return ok;
        } catch {
          set({ openrouterStatus: 'invalid' });
          return false;
        }
      },

      testCloudflareCreds: async (accountId: string, apiToken: string): Promise<boolean> => {
        set({ cfStatus: 'testing' });
        try {
          const res = await fetch(`/api/cloudflare/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId, apiToken }),
          });
          const ok = res.ok;
          set({ cfStatus: ok ? 'valid' : 'invalid' });
          return ok;
        } catch {
          set({ cfStatus: 'invalid' });
          return false;
        }
      },

      testBailianKey: async (key: string): Promise<boolean> => {
        set({ bailianStatus: 'testing' });
        try {
          const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'qwen-turbo', input: { messages: [{ role: 'user', content: 'Hi' }] } }),
          });
          const ok = res.ok || res.status === 400;
          set({ bailianStatus: ok ? 'valid' : 'invalid' });
          return ok;
        } catch {
          set({ bailianStatus: 'invalid' });
          return false;
        }
      },

      testCustomProvider: async (id: string, baseUrl: string, apiKey: string, modelId: string): Promise<boolean> => {
        set((s) => ({ customStatus: { ...s.customStatus, [id]: 'testing' } }));
        try {
          const res = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          const ok = res.ok;
          set((s) => ({ customStatus: { ...s.customStatus, [id]: ok ? 'valid' : 'invalid' } }));
          return ok;
        } catch {
          set((s) => ({ customStatus: { ...s.customStatus, [id]: 'invalid' } }));
          return false;
        }
      },
    }),
    {
      name: 'njirlah-all-keys-v1',
      partialize: (s) => ({ _enc: s._enc }),
    }
  )
);
