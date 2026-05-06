'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import { Message, useChatStore } from '@/store/chat-store';

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  onRegenerate?: (msgId: string) => void;
}

export default function ChatArea({ messages, isStreaming, streamingContent, onRegenerate }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { setLike, activeChatId } = useChatStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-6xl mb-6"
        >
          🦄
        </motion.div>
        <h2 className="text-2xl font-bold font-heading gradient-text mb-2">NJIRLAH AI</h2>
        <p className="text-gray-500 text-sm mb-1">Chat AI Tersesat, Bebas Pake Kunci Sendiri</p>
        <p className="text-gray-700 text-xs mt-4 max-w-sm">
          Mode tamu aktif — model gratis tersedia langsung tanpa API key.
          <br />
          Masukkan API key untuk akses semua model.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-2 max-w-sm w-full">
          {[
            'Jelaskan konsep machine learning',
            'Tulis kode Python untuk sorting',
            'Apa itu Large Language Model?',
            'Bantu saya buat resume keren',
          ].map((prompt) => (
            <motion.button
              key={prompt}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass rounded-xl p-3 text-xs text-gray-400 hover:text-white hover:border-neon-purple/30 transition-all text-left border border-white/5 hover:bg-white/5"
            >
              <Sparkles size={10} className="text-neon-purple mb-1" />
              {prompt}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-0">
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          onRegenerate={
            msg.role === 'assistant' && onRegenerate ? () => onRegenerate(msg.id) : undefined
          }
          onLike={
            msg.role === 'assistant' && activeChatId
              ? (liked) => setLike(activeChatId, msg.id, liked)
              : undefined
          }
        />
      ))}
      {isStreaming && streamingContent && (
        <ChatBubble
          message={{
            id: 'streaming',
            role: 'assistant',
            content: streamingContent,
            timestamp: Date.now(),
          }}
        />
      )}
      {isStreaming && !streamingContent && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
