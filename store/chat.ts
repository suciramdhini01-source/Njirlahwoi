"use client";
import { create } from "zustand";
import { Chat, ChatMessage, ModelSource } from "@/types";
import { supabase, getSessionId } from "@/lib/supabase";

const LS_KEY = "nj_chats_v1";

function load(): Chat[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(chats: Chat[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(chats));
}

// ---- Supabase sync (best-effort, non-blocking) ----
function sbUpsertChat(chat: Chat) {
  if (typeof window === "undefined") return;
  const sessionId = getSessionId();
  supabase
    .from("nj_chats")
    .upsert({
      id: chat.id,
      session_id: sessionId,
      title: chat.title,
      model_provider: chat.source,
      model_id: chat.modelId,
      updated_at: new Date(chat.updatedAt).toISOString(),
    })
    .then(() => {});
}

function sbInsertMessage(chatId: string, msg: ChatMessage) {
  if (typeof window === "undefined") return;
  const sessionId = getSessionId();
  supabase
    .from("nj_messages")
    .insert({
      id: msg.id,
      chat_id: chatId,
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
      tokens_in: 0,
      tokens_out: msg.tokens || 0,
      latency_ms: msg.latencyMs || 0,
    })
    .then(() => {});
}

function sbUpdateMessageContent(msgId: string, content: string) {
  if (typeof window === "undefined") return;
  supabase
    .from("nj_messages")
    .update({ content })
    .eq("id", msgId)
    .then(() => {});
}

function sbDeleteChat(id: string) {
  if (typeof window === "undefined") return;
  supabase.from("nj_messages").delete().eq("chat_id", id).then(() => {});
  supabase.from("nj_chats").delete().eq("id", id).then(() => {});
}

function updateAssistantFlush() { /* debounce anchor */ }

async function sbLoadRemote(): Promise<Chat[] | null> {
  if (typeof window === "undefined") return null;
  const sessionId = getSessionId();
  try {
    const { data: chats } = await supabase
      .from("nj_chats")
      .select("id, title, model_provider, model_id, updated_at")
      .eq("session_id", sessionId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (!chats || chats.length === 0) return null;

    const { data: messages } = await supabase
      .from("nj_messages")
      .select("id, chat_id, role, content, created_at, tokens_out, latency_ms")
      .in("chat_id", chats.map((c: any) => c.id))
      .order("created_at", { ascending: true });

    return chats.map((c: any) => ({
      id: c.id,
      title: c.title || "Obrolan",
      modelId: c.model_id,
      source: (c.model_provider as ModelSource) || "njiriah",
      updatedAt: c.updated_at ? new Date(c.updated_at).getTime() : Date.now(),
      messages: (messages || [])
        .filter((m: any) => m.chat_id === c.id)
        .map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content || "",
          createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
          tokens: m.tokens_out || undefined,
          latencyMs: m.latency_ms || undefined,
        })),
    }));
  } catch {
    return null;
  }
}

interface ChatState {
  chats: Chat[];
  activeId: string | null;
  streaming: boolean;
  hydrated: boolean;
  hydrate: () => void;
  newChat: (modelId: string, source: ModelSource) => string;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  addMessage: (chatId: string, msg: ChatMessage) => void;
  updateAssistant: (chatId: string, msgId: string, content: string) => void;
  setModel: (chatId: string, modelId: string, source: ModelSource) => void;
  setStreaming: (v: boolean) => void;
  renameChat: (id: string, title: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeId: null,
  streaming: false,
  hydrated: false,

  hydrate: () => {
    // local first (instant)
    const local = load();
    set({ chats: local, hydrated: true, activeId: local[0]?.id || null });
    // remote merge (async) — remote wins on conflict
    sbLoadRemote().then((remote) => {
      if (remote && remote.length > 0) {
        save(remote);
        set({ chats: remote, activeId: get().activeId || remote[0]?.id || null });
      }
    });
  },

  newChat: (modelId, source) => {
    const id = crypto.randomUUID();
    const chat: Chat = {
      id,
      title: "Obrolan Baru",
      messages: [],
      modelId,
      source,
      updatedAt: Date.now(),
    };
    const chats = [chat, ...get().chats];
    save(chats);
    sbUpsertChat(chat);
    set({ chats, activeId: id });
    return id;
  },

  selectChat: (id) => set({ activeId: id }),

  deleteChat: (id) => {
    const chats = get().chats.filter((c) => c.id !== id);
    save(chats);
    sbDeleteChat(id);
    set({
      chats,
      activeId: get().activeId === id ? chats[0]?.id || null : get().activeId,
    });
  },

  renameChat: (id, title) => {
    const chats = get().chats.map((c) => (c.id === id ? { ...c, title } : c));
    save(chats);
    const updated = chats.find((c) => c.id === id);
    if (updated) sbUpsertChat(updated);
    set({ chats });
  },

  addMessage: (chatId, msg) => {
    const chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      const title =
        c.messages.length === 0 && msg.role === "user"
          ? msg.content.slice(0, 40)
          : c.title;
      return {
        ...c,
        title,
        messages: [...c.messages, msg],
        updatedAt: Date.now(),
      };
    });
    save(chats);
    const updated = chats.find((c) => c.id === chatId);
    if (updated) sbUpsertChat(updated);
    sbInsertMessage(chatId, msg);
    set({ chats });
  },

  updateAssistant: (chatId, msgId, content) => {
    const chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      return {
        ...c,
        messages: c.messages.map((m) =>
          m.id === msgId ? { ...m, content } : m
        ),
      };
    });
    set({ chats });
    // Debounced write — only persist final content, not every token
    if (typeof window !== "undefined") {
      clearTimeout((updateAssistantFlush as any)._t);
      (updateAssistantFlush as any)._t = setTimeout(() => {
        save(get().chats);
        sbUpdateMessageContent(msgId, content);
      }, 500);
    }
  },

  setModel: (chatId, modelId, source) => {
    const chats = get().chats.map((c) =>
      c.id === chatId ? { ...c, modelId, source } : c
    );
    save(chats);
    const updated = chats.find((c) => c.id === chatId);
    if (updated) sbUpsertChat(updated);
    set({ chats });
  },

  setStreaming: (v) => set({ streaming: v }),
}));
