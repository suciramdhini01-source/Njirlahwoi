'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encrypt, decrypt } from '@/lib/encryption';

interface ApiKeyState {
  _encryptedOrKey: string;
  openrouterKey: string;
  isValidated: boolean;
  setOpenrouterKey: (key: string) => Promise<void>;
  clearKey: () => void;
  loadKey: () => Promise<void>;
  hasKey: () => boolean;
}

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      _encryptedOrKey: '',
      openrouterKey: '',
      isValidated: false,

      setOpenrouterKey: async (key: string) => {
        const encrypted = await encrypt(key);
        if (!encrypted) throw new Error('Enkripsi gagal');
        set({ _encryptedOrKey: encrypted, openrouterKey: key, isValidated: true });
      },

      clearKey: () => set({ _encryptedOrKey: '', openrouterKey: '', isValidated: false }),

      loadKey: async () => {
        const { _encryptedOrKey } = get();
        if (!_encryptedOrKey) return;
        try {
          const decrypted = await decrypt(_encryptedOrKey);
          if (decrypted) set({ openrouterKey: decrypted });
        } catch {}
      },

      hasKey: () => !!get().openrouterKey,
    }),
    {
      name: 'njirlah-apikey-v2',
      partialize: (s) => ({ _encryptedOrKey: s._encryptedOrKey }),
    }
  )
);
