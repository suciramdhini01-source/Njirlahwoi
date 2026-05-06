'use client';

import { useEffect, useRef, useState } from 'react';
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
  const abortRef = useRef<AbortController | null>(null);

  const {
    chats, activeChatId, createChat, addMessage,
    isStreaming, streamingContent, setIsStreaming, setStreamingContent,
    selectedModel, selectedProvider, getActiveChat, _hasHydrated,
  } = useChatStore();

  const { openrouterKey, loadKey } = useApiKeyStore();

  // Load decrypted key after hydration
  useEffect(() => {
    loadKey();
  }, []);

  // Auto-create first chat
  useEffect(() => {
    if (_hasHydrated && chats.length === 0) createChat();
  }, [_hasHydrated]);

  // Ctrl+K command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const activeChat = getActiveChat();
  const messages = activeChat?.messages ?? [];

  const sendMessage = async (content: string) => {
    let chatId = activeChatId;
    if (!chatId) chatId = createChat();

    addMessage(chatId!, { role: 'user', content });
    setIsStreaming(true);
    setStreamingContent('');

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
            content: '⚠️ **OpenRouter API key diperlukan.**\n\nKlik tombol **API Keys** di sidebar atau tekan **Ctrl+K** → "Manage API Keys" untuk memasukkan key kamu.',
            model: selectedModel,
          });
          setIsStreaming(false);
          return;
        }
        res = await fetch('/api/openrouter/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': openrouterKey },
          body: JSON.stringify({ messages: history, model: selectedModel, stream: true }),
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
            if (delta) {
              full += delta;
              setStreamingContent(full);
            }
          } catch {}
        }
      }

      addMessage(chatId!, {
        role: 'assistant',
        content: full || '(Respons kosong)',
        model: selectedModel,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addMessage(chatId!, {
          role: 'assistant',
          content: `❌ **Error:** ${err.message}\n\nCoba lagi atau cek API key kamu.`,
          model: selectedModel,
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
      <UnicornBackground />
      <div className="absolute inset-0 bg-[#05050A]/35 z-0 pointer-events-none" />
      <ProgressBar active={isStreaming} />

      <div className="relative z-10 flex w-full h-full">
        <Sidebar onOpenApiKey={() => setApiKeyOpen(true)} />

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <Header onOpenCommand={() => setCommandOpen(true)} />

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
