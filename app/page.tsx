'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatArea from '@/components/chat/ChatArea';
import ChatInput from '@/components/chat/ChatInput';
import ApiKeyModal from '@/components/ui/ApiKeyModal';
import { useChatStore } from '@/store/chat-store';
import { useApiKeyStore } from '@/store/api-key-store';

const UnicornBackground = dynamic(() => import('@/components/layout/UnicornBackground'), {
  ssr: false,
});

export default function HomePage() {
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const {
    chats,
    activeChatId,
    createChat,
    addMessage,
    updateMessage,
    isStreaming,
    streamingContent,
    setIsStreaming,
    setStreamingContent,
    selectedModel,
    selectedProvider,
    getActiveChat,
    _hasHydrated,
  } = useChatStore();

  const { openrouterKey, cloudflareToken, cloudflareAccountId } = useApiKeyStore();

  useEffect(() => {
    if (_hasHydrated && chats.length === 0) {
      createChat();
    }
  }, [_hasHydrated]);

  const activeChat = getActiveChat();
  const messages = activeChat?.messages ?? [];

  const sendMessage = async (content: string) => {
    let chatId = activeChatId;
    if (!chatId) {
      chatId = createChat();
    }

    addMessage(chatId!, { role: 'user', content });
    setIsStreaming(true);
    setStreamingContent('');

    const historyMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content },
    ];

    abortRef.current = new AbortController();

    try {
      let res: Response;

      if (selectedProvider === 'cloudflare') {
        if (!cloudflareToken || !cloudflareAccountId) {
          addMessage(chatId!, {
            role: 'assistant',
            content: '⚠️ Masukkan Cloudflare API token dan Account ID terlebih dahulu.',
            model: selectedModel,
          });
          setIsStreaming(false);
          return;
        }
        res = await fetch('/api/cloudflare/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cf-token': cloudflareToken,
            'x-cf-account-id': cloudflareAccountId,
          },
          body: JSON.stringify({ messages: historyMessages, model: selectedModel, stream: true }),
          signal: abortRef.current.signal,
        });
      } else {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (openrouterKey) headers['x-api-key'] = openrouterKey;
        res = await fetch('/api/openrouter/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages: historyMessages, model: selectedModel, stream: true }),
          signal: abortRef.current.signal,
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
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
              fullContent += delta;
              setStreamingContent(fullContent);
            }
          } catch {}
        }
      }

      const msgId = addMessage(chatId!, {
        role: 'assistant',
        content: fullContent || '(Respons kosong)',
        model: selectedModel,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (streamingContent) {
          addMessage(chatId!, {
            role: 'assistant',
            content: streamingContent + '\n\n*(dihentikan)*',
            model: selectedModel,
          });
        }
      } else {
        addMessage(chatId!, {
          role: 'assistant',
          content: `❌ Error: ${err.message}\n\nCoba lagi atau cek API key kamu.`,
          model: selectedModel,
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleRegenerate = async (msgId: string) => {
    if (!activeChatId || !activeChat) return;
    const idx = activeChat.messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;
    const prevUserMsg = activeChat.messages.slice(0, idx).reverse().find((m) => m.role === 'user');
    if (prevUserMsg) {
      await sendMessage(prevUserMsg.content);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#05050A] relative">
      <UnicornBackground />

      <div className="absolute inset-0 bg-[#05050A]/40 z-0 pointer-events-none" />

      <div className="relative z-10 flex w-full h-full">
        <Sidebar onOpenApiKey={() => setApiKeyOpen(true)} />

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <Header />

          <ChatArea
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            onRegenerate={handleRegenerate}
          />

          <ChatInput
            onSend={sendMessage}
            isStreaming={isStreaming}
            onStop={handleStop}
            disabled={false}
          />

          <Footer />
        </div>
      </div>

      <ApiKeyModal open={apiKeyOpen} onClose={() => setApiKeyOpen(false)} />
    </div>
  );
}
