'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiKeyState {
  openrouterKey: string;
  cloudflareToken: string;
  cloudflareAccountId: string;
  setOpenrouterKey: (key: string) => void;
  setCloudflareToken: (token: string) => void;
  setCloudflareAccountId: (id: string) => void;
  clearKeys: () => void;
  hasOpenrouterKey: () => boolean;
  hasCloudflareKey: () => boolean;
}

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      openrouterKey: '',
      cloudflareToken: '',
      cloudflareAccountId: '',
      setOpenrouterKey: (key) => set({ openrouterKey: key }),
      setCloudflareToken: (token) => set({ cloudflareToken: token }),
      setCloudflareAccountId: (id) => set({ cloudflareAccountId: id }),
      clearKeys: () => set({ openrouterKey: '', cloudflareToken: '', cloudflareAccountId: '' }),
      hasOpenrouterKey: () => !!get().openrouterKey,
      hasCloudflareKey: () => !!get().cloudflareToken && !!get().cloudflareAccountId,
    }),
    {
      name: 'njirlah-api-keys-v1',
    }
  )
);
