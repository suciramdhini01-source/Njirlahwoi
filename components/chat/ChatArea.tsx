'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Key } from 'lucide-react';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import { Message, useChatStore } from '@/store/chat-store';
import { useApiKeyStore } from '@/store/api-key-store';

const PROMPTS = [
  'Jelaskan konsep machine learning dengan mudah',
  'Tulis kode Python untuk bubble sort',
  'Apa perbedaan AI, ML, dan Deep Learning?',
  'Bantu saya buat resume profesional',
  'Bagaimana cara deploy app ke Vercel?',
  'Tulis puisi tentang teknologi masa depan',
];

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  onSend: (text: string) => void;
  onRegenerate?: (msgId: string) => void;
  onOpenApiKey?: () => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const promptVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 22, stiffness: 300 } },
};

export default function ChatArea({ messages, isStreaming, streamingContent, onSend, onRegenerate, onOpenApiKey }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { setLike, activeChatId, selectedProvider } = useChatStore();
  const { hasKey } = useApiKeyStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl mb-6 select-none"
        >
          🦄
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold font-heading gradient-text mb-2"
        >
          NJIRLAH AI
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 text-sm mb-1"
        >
          Chat AI Tersesat, Bebas Pake Kunci Sendiri
        </motion.p>

        {/* Key status */}
        {selectedProvider === 'openrouter' && !hasKey() && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onOpenApiKey}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-sm hover:bg-neon-purple/20 transition-colors"
          >
            <Key size={14} />
            Masukkan OpenRouter API Key untuk mulai
          </motion.button>
        )}

        {(selectedProvider === 'cloudflare' || hasKey()) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-700 text-xs mt-3"
          >
            {selectedProvider === 'cloudflare' ? '☁️ Cloudflare siap · Langsung mulai!' : '✓ OpenRouter tersambung · Pilih model dan chat!'}
          </motion.p>
        )}

        {/* Prompt suggestions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-8 grid grid-cols-2 gap-2 max-w-lg w-full"
        >
          {PROMPTS.map((prompt, i) => (
            <motion.button
              key={i}
              variants={promptVariants}
              whileHover={{ scale: 1.03, borderColor: 'rgba(168,85,247,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSend(prompt)}
              className="glass rounded-xl p-3 text-xs text-gray-400 hover:text-white transition-all text-left border border-white/5"
            >
              <Sparkles size={10} className="text-neon-purple mb-1" />
              {prompt}
            </motion.button>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            onRegenerate={msg.role === 'assistant' && onRegenerate ? () => onRegenerate(msg.id) : undefined}
            onLike={
              msg.role === 'assistant' && activeChatId
                ? (liked) => setLike(activeChatId, msg.id, liked)
                : undefined
            }
          />
        ))}
      </AnimatePresence>

      {isStreaming && streamingContent && (
        <ChatBubble
          message={{ id: 'streaming', role: 'assistant', content: streamingContent, timestamp: Date.now() }}
          streaming
        />
      )}
      {isStreaming && !streamingContent && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
