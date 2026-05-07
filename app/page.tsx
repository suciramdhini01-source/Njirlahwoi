'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatArea from '@/components/chat/ChatArea';
import ChatInput from '@/components/chat/ChatInput';
import ApiKeyModal from '@/components/ui/ApiKeyModal';
import CommandPalette from '@/components/ui/CommandPalette';
import ProgressBar from '@/components/ui/ProgressBar';
import ToastStack from '@/components/ui/ToastStack';
import { useChatStore } from '@/store/chat-store';
import { useApiKeyStore } from '@/store/api-key-store';

const UnicornBackground = dynamic(() => import('@/components/layout/UnicornBackground'), { ssr: false });
const CustomCursor = dynamic(() => import('@/components/ui/CustomCursor'), { ssr: false });

export default function HomePage() {
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const {
    chats, activeChatId, createChat, addMessage,
    isStreaming, streamingContent, setIsStreaming, setStreamingContent,
    selectedModel, selectedProvider, getActiveChat, _hasHydrated,
    temperature, setTemperature, setChatTitle,
  } = useChatStore();

  const { openrouterKey, loadKey } = useApiKeyStore();

  useEffect(() => { loadKey(); }, []);

  useEffect(() => {
    if (_hasHydrated && chats.length === 0) createChat();
  }, [_hasHydrated]);

  // Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandOpen((v) => !v); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // GSAP parallax
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);
        const bg = document.querySelector<HTMLElement>('[data-parallax-bg]');
        if (!bg) return;
        gsap.to(bg, {
          y: -60, ease: 'none',
          scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom top', scrub: true },
        });
        cleanup = () => ScrollTrigger.getAll().forEach((t) => t.kill());
      } catch {}
    })();
    return () => cleanup?.();
  }, []);

  const activeChat = getActiveChat();
  const messages = activeChat?.messages ?? [];

  /* ── Auto-generate title after first user message ── */
  const generateTitle = useCallback(async (chatId: string, userMessage: string) => {
    try {
      const res = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      if (res.ok) {
        const { title } = (await res.json()) as { title: string };
        if (title && title !== 'New Chat') {
          setChatTitle(chatId, title);
        }
      }
    } catch {}
  }, [setChatTitle]);

  const sendMessage = async (content: string) => {
    let chatId = activeChatId;
    if (!chatId) chatId = createChat();

    const isFirstMessage = (chats.find((c) => c.id === chatId)?.messages.length ?? 0) === 0;

    addMessage(chatId!, { role: 'user', content });
    setIsStreaming(true);
    setStreamingContent('');

    // Auto-generate title for first message
    if (isFirstMessage) {
      generateTitle(chatId!, content);
    }

    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content },
    ];

    abortRef.current = new AbortController();

    try {
      let res: Response;

      if (selectedProvider === 'cloudflare') {
        res = await fetch('/api/cloudflare/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, model: selectedModel, stream: true }),
          signal: abortRef.current.signal,
        });
      } else {
        if (!openrouterKey) {
          addMessage(chatId!, {
            role: 'assistant',
            content: '⚠️ **OpenRouter API key diperlukan.**\n\nKlik **API Keys** di sidebar atau tekan **Ctrl+K** → "Manage API Keys" untuk memasukkan key kamu.',
            model: selectedModel,
            isError: true,
          });
          setIsStreaming(false);
          return;
        }
        res = await fetch('/api/openrouter/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': openrouterKey },
          body: JSON.stringify({ messages: history, model: selectedModel, stream: true, temperature }),
          signal: abortRef.current.signal,
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta =
              parsed.choices?.[0]?.delta?.content ||
              parsed.result?.response ||
              '';
            if (delta) { full += delta; setStreamingContent(full); }
          } catch {}
        }
      }

      addMessage(chatId!, { role: 'assistant', content: full || '(Respons kosong)', model: selectedModel });
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (error.name !== 'AbortError') {
        addMessage(chatId!, {
          role: 'assistant',
          content: `❌ **Error:** ${error.message ?? 'Terjadi kesalahan'}\n\nCoba lagi atau cek API key kamu.`,
          model: selectedModel,
          isError: true,
        });
      } else if (streamingContent) {
        addMessage(chatId!, {
          role: 'assistant',
          content: streamingContent + '\n\n*(dihentikan)*',
          model: selectedModel,
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleRegenerate = async (msgId: string) => {
    if (!activeChatId || !activeChat) return;
    const idx = activeChat.messages.findIndex((m) => m.id === msgId);
    const prevUser = activeChat.messages.slice(0, idx).reverse().find((m) => m.role === 'user');
    if (prevUser) await sendMessage(prevUser.content);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#05050A] relative">
      <CustomCursor />

      {/* Background parallax */}
      <div data-parallax-bg className="fixed inset-0 z-0 pointer-events-none will-change-transform">
        <UnicornBackground />
      </div>
      <div className="absolute inset-0 bg-[#05050A]/40 z-0 pointer-events-none" />

      {/* Progress bar */}
      <ProgressBar active={isStreaming} />

      <div className="relative z-10 flex w-full h-full">
        {/* Sidebar (desktop + mobile overlay) */}
        <Sidebar
          onOpenApiKey={() => setApiKeyOpen(true)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <Header
            onOpenCommand={() => setCommandOpen(true)}
            onToggleSidebar={() => setMobileSidebarOpen(true)}
          />

          <ChatArea
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            onSend={sendMessage}
            onRegenerate={handleRegenerate}
            onOpenApiKey={() => setApiKeyOpen(true)}
          />

          <ChatInput
            onSend={sendMessage}
            isStreaming={isStreaming}
            onStop={() => abortRef.current?.abort()}
            temperature={temperature}
            onTemperatureChange={setTemperature}
          />

          <Footer />
        </div>
      </div>

      <ApiKeyModal open={apiKeyOpen} onClose={() => setApiKeyOpen(false)} />
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onOpenApiKey={() => { setCommandOpen(false); setApiKeyOpen(true); }}
      />
      <ToastStack />
    </div>
  );
}
