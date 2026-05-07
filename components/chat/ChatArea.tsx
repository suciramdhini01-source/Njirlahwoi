'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Key, ArrowDown } from 'lucide-react';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import SkeletonBubble from '@/components/ui/SkeletonBubble';
import { Message, useChatStore } from '@/store/chat-store';
import { useApiKeyStore } from '@/store/api-key-store';

const PROMPTS = [
  'Jelaskan machine learning dengan sederhana',
  'Tulis kode Python bubble sort',
  'Bedanya AI, ML, dan Deep Learning?',
  'Bantu buat resume profesional',
  'Cara deploy app ke Vercel?',
  'Tulis puisi teknologi masa depan',
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
  visible: { transition: { staggerChildren: 0.05 } },
};

const promptVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 22, stiffness: 300 } },
};

export default function ChatArea({
  messages, isStreaming, streamingContent, onSend, onRegenerate, onOpenApiKey,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const { setLike, activeChatId, selectedProvider } = useChatStore();
  const { hasKey } = useApiKeyStore();

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    setUserScrolledUp(false);
    setShowScrollBtn(false);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const scrolledUp = distFromBottom > 100;
      setUserScrolledUp(scrolledUp);
      setShowScrollBtn(scrolledUp && messages.length > 0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [messages.length]);

  useEffect(() => {
    if (!userScrolledUp) scrollToBottom('smooth');
  }, [streamingContent, userScrolledUp, scrollToBottom]);

  useEffect(() => {
    if (!userScrolledUp) scrollToBottom('smooth');
  }, [messages.length, userScrolledUp, scrollToBottom]);

  /* ── Empty state ── */
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center overflow-y-auto">
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl sm:text-7xl mb-4 select-none"
        >
          🦄
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl font-black font-heading gradient-text mb-1"
        >
          NJIRLAH AI
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-gray-500 text-xs sm:text-sm mb-1"
        >
          Chat AI Tersesat, Bebas Pake Kunci Sendiri
        </motion.p>

        {selectedProvider === 'cloudflare' || hasKey() ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-[10px] sm:text-[11px] text-gray-700 mt-1"
          >
            {selectedProvider === 'cloudflare'
              ? '☁️ Cloudflare siap · Langsung mulai!'
              : '✓ OpenRouter tersambung · Pilih model dan mulai!'}
          </motion.p>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            onClick={onOpenApiKey}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-sm hover:bg-neon-purple/20 transition-colors"
          >
            <Key size={14} />
            Masukkan OpenRouter API Key
          </motion.button>
        )}

        {/* Prompt suggestions — 1 col mobile, 2 col tablet+ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full"
        >
          {PROMPTS.map((prompt, i) => (
            <motion.button
              key={i}
              variants={promptVariants}
              whileHover={{ scale: 1.02, borderColor: 'rgba(168,85,247,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSend(prompt)}
              className="glass rounded-xl p-3 text-xs text-gray-400 hover:text-white transition-all text-left border border-white/5 hover:bg-white/5"
            >
              <Sparkles size={10} className="text-neon-purple mb-1.5" />
              {prompt}
            </motion.button>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 sm:py-4">
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
        {isStreaming && !streamingContent && <SkeletonBubble />}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', damping: 22, stiffness: 360 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/15 text-xs text-gray-300 hover:text-white hover:border-neon-purple/30 shadow-xl transition-colors z-10"
          >
            <ArrowDown size={11} className="text-neon-purple" />
            <span className="hidden sm:inline">Scroll ke bawah</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
