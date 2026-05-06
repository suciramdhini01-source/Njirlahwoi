'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encrypt, decrypt } from '@/lib/encryption';

interface ApiKeyState {
  _encryptedOrKey: string;
  openrouterKey: string | null;
  isKeyValid: boolean;
  setKey: (key: string) => Promise<void>;
  loadKey: () => Promise<void>;
  clearKey: () => void;
  hasKey: () => boolean;
  testConnection: () => Promise<boolean>;
  // Legacy alias kept for UI compatibility
  setOpenrouterKey: (key: string) => Promise<void>;
  isValidated: boolean;
}

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      _encryptedOrKey: '',
      openrouterKey: null,
      isKeyValid: false,
      isValidated: false,

      setKey: async (key: string) => {
        const encrypted = await encrypt(key);
        if (!encrypted) throw new Error('Enkripsi gagal');
        set({ _encryptedOrKey: encrypted, openrouterKey: key, isKeyValid: true, isValidated: true });
      },

      setOpenrouterKey: async (key: string) => {
        return get().setKey(key);
      },

      clearKey: () =>
        set({ _encryptedOrKey: '', openrouterKey: null, isKeyValid: false, isValidated: false }),

      loadKey: async () => {
        const { _encryptedOrKey } = get();
        if (!_encryptedOrKey) return;
        try {
          const decrypted = await decrypt(_encryptedOrKey);
          if (decrypted) set({ openrouterKey: decrypted, isKeyValid: true, isValidated: true });
        } catch {
          // Silently ignore decrypt errors (e.g. key mismatch after browser fingerprint change)
        }
      },

      hasKey: () => !!get().openrouterKey,

      testConnection: async (): Promise<boolean> => {
        const { openrouterKey } = get();
        if (!openrouterKey) return false;
        try {
          const res = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
              Authorization: `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
            },
          });
          const ok = res.status === 200;
          set({ isKeyValid: ok });
          return ok;
        } catch {
          set({ isKeyValid: false });
          return false;
        }
      },
    }),
    {
      name: 'njirlah-apikey-v2',
      partialize: (s) => ({ _encryptedOrKey: s._encryptedOrKey }),
    }
  )
);
