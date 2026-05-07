'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Sparkles, Key, Zap, Code2, Globe, Cpu } from 'lucide-react';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import SkeletonBubble from '@/components/ui/SkeletonBubble';
import { Message, useChatStore } from '@/store/chat-store';
import { useApiKeyStore } from '@/store/api-key-store';

const PROMPTS = [
  { icon: <Code2 size={13} />, text: 'Tulis fungsi Python sorting', color: 'brand-amber' },
  { icon: <Cpu size={13} />, text: 'Jelaskan neural network', color: 'brand-blue' },
  { icon: <Globe size={13} />, text: 'Cara deploy app ke Vercel?', color: 'brand-green' },
  { icon: <Sparkles size={13} />, text: 'Tulis puisi teknologi masa depan', color: 'brand-pistachio' },
  { icon: <Code2 size={13} />, text: 'Debug kode TypeScript ini', color: 'brand-amber' },
  { icon: <Cpu size={13} />, text: 'Bedanya AI, ML, dan Deep Learning?', color: 'brand-blue' },
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
  hidden: { opacity: 0, y: 12, scale: 0.94 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 22, stiffness: 300 } },
};

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'brand-amber':     { bg: 'hover:bg-brand-amber/8',    border: 'hover:border-brand-amber/25', text: 'hover:text-white', icon: 'text-brand-amber' },
  'brand-blue':      { bg: 'hover:bg-brand-blue/8',     border: 'hover:border-brand-blue/25',  text: 'hover:text-white', icon: 'text-brand-blue' },
  'brand-green':     { bg: 'hover:bg-brand-green/8',    border: 'hover:border-brand-green/25', text: 'hover:text-white', icon: 'text-brand-green' },
  'brand-pistachio': { bg: 'hover:bg-brand-pistachio/8',border: 'hover:border-brand-pistachio/25', text: 'hover:text-white', icon: 'text-brand-pistachio' },
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

  useEffect(() => { if (!userScrolledUp) scrollToBottom('smooth'); }, [streamingContent, userScrolledUp, scrollToBottom]);
  useEffect(() => { if (!userScrolledUp) scrollToBottom('smooth'); }, [messages.length, userScrolledUp, scrollToBottom]);

  /* ── Empty state ── */
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center overflow-y-auto">

        {/* Logo animation */}
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [0, 6, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl sm:text-7xl mb-5 select-none"
        >
          🦄
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-2xl sm:text-3xl font-black font-heading gradient-text mb-1"
        >
          NJIRLAH AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.16 }}
          className="text-white/40 text-sm sm:text-base mb-2"
        >
          Multi-model AI · BYOK · Open-source vibe
        </motion.p>

        {/* Status pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.24 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs mb-6 ${
            selectedProvider === 'cloudflare' || hasKey()
              ? 'bg-brand-green/8 border-brand-green/20 text-brand-green'
              : 'bg-brand-amber/8 border-brand-amber/20 text-brand-amber'
          }`}
        >
          <motion.div
            className={`w-1.5 h-1.5 rounded-full ${selectedProvider === 'cloudflare' || hasKey() ? 'bg-brand-green' : 'bg-brand-amber'}`}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          {selectedProvider === 'cloudflare'
            ? '☁️ Cloudflare aktif · Langsung mulai!'
            : hasKey()
            ? '✓ OpenRouter tersambung · Siap!'
            : 'Butuh API Key OpenRouter'}
        </motion.div>

        {!hasKey() && selectedProvider === 'openrouter' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onOpenApiKey}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mb-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue/10 border border-brand-blue/25 text-brand-blue text-sm hover:bg-brand-blue/18 transition-all"
          >
            <Key size={14} />
            Masukkan OpenRouter API Key
          </motion.button>
        )}

        {/* Prompt suggestions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-2xl w-full"
        >
          {PROMPTS.map((prompt, i) => {
            const c = colorMap[prompt.color] ?? colorMap['brand-blue'];
            return (
              <motion.button
                key={i}
                variants={promptVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSend(prompt.text)}
                className={`group flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#111118] border border-white/[0.06] text-xs text-white/50 ${c.text} ${c.bg} ${c.border} transition-all text-left`}
              >
                <span className={`flex-shrink-0 ${c.icon} transition-colors`}>{prompt.icon}</span>
                <span className="leading-snug">{prompt.text}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Stats bar — OpenRouter style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex items-center gap-6 text-white/20 text-xs"
        >
          {[
            { label: 'Model', value: '400+' },
            { label: 'Provider', value: '60+' },
            { label: 'Gratis CF', value: '10+' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="font-bold text-white/50 text-base font-heading">{stat.value}</p>
              <p>{stat.label}</p>
            </div>
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

      {/* Scroll-to-bottom pill — amber border */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', damping: 22, stiffness: 360 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-amber/25 text-xs text-brand-amber hover:text-white hover:border-brand-amber/50 shadow-xl transition-all z-10"
          >
            <ArrowDown size={11} />
            <span className="hidden sm:inline">Scroll ke bawah</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
