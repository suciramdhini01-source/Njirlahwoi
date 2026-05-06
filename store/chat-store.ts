'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  tokens?: number;
  liked?: boolean | null;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  provider: 'openrouter' | 'cloudflare';
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  isStreaming: boolean;
  streamingContent: string;
  selectedModel: string;
  selectedProvider: 'openrouter' | 'cloudflare';
  temperature: number;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  createChat: () => string;
  deleteChat: (id: string) => void;
  setActiveChat: (id: string) => void;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  setLike: (chatId: string, messageId: string, liked: boolean | null) => void;
  setIsStreaming: (v: boolean) => void;
  setStreamingContent: (v: string) => void;
  setSelectedModel: (model: string) => void;
  setSelectedProvider: (provider: 'openrouter' | 'cloudflare') => void;
  setTemperature: (v: number) => void;
  getActiveChat: () => Chat | null;
  clearMessages: (chatId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      isStreaming: false,
      streamingContent: '',
      selectedModel: '@cf/meta/llama-3.1-8b-instruct',
      selectedProvider: 'cloudflare',
      temperature: 0.7,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      createChat: () => {
        const id = nanoid();
        const chat: Chat = {
          id,
          title: 'New Chat',
          messages: [],
          model: get().selectedModel,
          provider: get().selectedProvider,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ chats: [chat, ...s.chats], activeChatId: id }));
        return id;
      },

      deleteChat: (id) =>
        set((s) => {
          const chats = s.chats.filter((c) => c.id !== id);
          const activeChatId = s.activeChatId === id ? (chats[0]?.id ?? null) : s.activeChatId;
          return { chats, activeChatId };
        }),

      setActiveChat: (id) => set({ activeChatId: id }),

      addMessage: (chatId, message) => {
        const id = nanoid();
        const msg: Message = { ...message, id, timestamp: Date.now() };
        set((s) => ({
          chats: s.chats.map((c) => {
            if (c.id !== chatId) return c;
            const messages = [...c.messages, msg];
            const title =
              c.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 42) + (message.content.length > 42 ? '…' : '')
                : c.title;
            return { ...c, messages, title, updatedAt: Date.now() };
          }),
        }));
        return id;
      },

      updateMessage: (chatId, messageId, content) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id !== chatId ? c : {
              ...c,
              messages: c.messages.map((m) => m.id === messageId ? { ...m, content } : m),
            }
          ),
        })),

      setLike: (chatId, messageId, liked) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id !== chatId ? c : {
              ...c,
              messages: c.messages.map((m) => m.id === messageId ? { ...m, liked } : m),
            }
          ),
        })),

      setIsStreaming: (v) => set({ isStreaming: v }),
      setStreamingContent: (v) => set({ streamingContent: v }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setSelectedProvider: (provider) => set({ selectedProvider: provider }),
      setTemperature: (v) => set({ temperature: v }),
      getActiveChat: () => {
        const { chats, activeChatId } = get();
        return chats.find((c) => c.id === activeChatId) ?? null;
      },
      clearMessages: (chatId) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId ? { ...c, messages: [], title: 'New Chat', updatedAt: Date.now() } : c
          ),
        })),
    }),
    {
      name: 'njirlah-chats-v2',
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
    }
  )
);
