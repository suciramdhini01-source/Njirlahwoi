'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check, AlertTriangle, RotateCcw, Code } from 'lucide-react';
import { Message } from '@/store/chat-store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  onLike?: (liked: boolean | null) => void;
  streaming?: boolean;
}

function StreamRipple() {
  return (
    <div className="absolute -inset-1 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-brand-blue/30"
          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
          transition={{ duration: 1.8, delay: i * 0.55, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function StaggerWords({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <span>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.01, 0.8), duration: 0.15 }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

function ErrorBubble({ content, onRetry }: { content: string; onRetry?: () => void }) {
  const cleaned = content
    .replace(/^[❌⚠️]+\s*/, '')
    .replace(/^\*\*Error:\*\*\s*/i, '')
    .trim();

  return (
    <div className="rounded-2xl px-4 py-3 bg-brand-red/8 border border-brand-red/20">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={13} className="text-brand-red flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-brand-red/90 mb-0.5">Ada masalah</p>
          <p className="text-xs text-brand-red/65 leading-relaxed break-words">{cleaned || content}</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-amber/10 border border-brand-amber/25 text-xs text-brand-amber hover:bg-brand-amber/18 transition-colors"
          >
            <RotateCcw size={11} />
            Coba Lagi
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue/10 border border-brand-blue/25 text-xs text-brand-blue hover:bg-brand-blue/18 transition-colors"
        >
          Periksa Kunci API
        </motion.button>
      </div>
    </div>
  );
}

export default function ChatBubble({ message, onRegenerate, onLike, streaming }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const wordCount = message.content.split(' ').length;
  const isLong = wordCount > 25;
  const isError = message.isError ||
    (message.role === 'assistant' &&
      (message.content.startsWith('❌') || message.content.startsWith('⚠️') || message.content.startsWith('*Error')));

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className={`flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 group ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm select-none ${
          isUser
            ? 'bg-gradient-to-br from-brand-blue/60 to-brand-pistachio/40 border border-brand-blue/20'
            : isError
            ? 'bg-gradient-to-br from-brand-red/50 to-brand-red/30 border border-brand-red/20'
            : 'bg-gradient-to-br from-brand-green/40 to-brand-blue/30 border border-brand-green/15'
        }`}>
          {isUser ? '👤' : isError ? '⚠️' : '🦄'}
        </div>
        {streaming && !isUser && <StreamRipple />}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
        style={{ maxWidth: 'min(78%, 620px)' }}
      >
        {/* Bubble */}
        <motion.div
          layout
          className={`rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-brand-blue/18 to-brand-pistachio/10 border border-brand-blue/20 rounded-tr-sm'
              : isError
              ? ''
              : 'bg-[#0A0A14] border border-white/[0.07] rounded-bl-sm'
          }`}
        >
          {isUser ? (
            <p className="text-white/90 whitespace-pre-wrap break-words">{message.content}</p>
          ) : isError ? (
            <ErrorBubble content={message.content} onRetry={onRegenerate} />
          ) : streaming && isLong ? (
            <div className="prose prose-invert prose-sm max-w-none break-words">
              <StaggerWords text={message.content} />
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none break-words overflow-x-auto
              prose-code:bg-[#16161F] prose-code:border prose-code:border-white/10 prose-code:text-brand-pistachio prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs
              prose-pre:bg-[#111118] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </motion.div>

        {/* Streaming indicator */}
        {streaming && (
          <div className="flex items-center gap-1 px-1 mt-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-brand-blue/60"
                animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        {!streaming && (
          <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Copy — pistachio */}
            <motion.button
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              title="Salin"
              className="p-1.5 rounded-lg text-white/25 hover:text-brand-pistachio hover:bg-brand-pistachio/8 transition-colors"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check size={11} className="text-brand-green" />
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy size={11} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Regenerate — blue */}
            {!isUser && onRegenerate && (
              <motion.button
                whileHover={{ scale: 1.15, rotate: 180 }} whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', damping: 15 }}
                onClick={onRegenerate}
                title="Ulangi respons"
                className="p-1.5 rounded-lg text-white/25 hover:text-brand-blue hover:bg-brand-blue/8 transition-colors"
              >
                <RefreshCw size={11} />
              </motion.button>
            )}

            {/* Like — green */}
            {!isUser && onLike && (
              <>
                <motion.button
                  whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
                  onClick={() => onLike(message.liked === true ? null : true)}
                  title="Bagus"
                  className={`p-1.5 rounded-lg transition-colors ${
                    message.liked === true ? 'text-brand-green bg-brand-green/12' : 'text-white/25 hover:text-brand-green hover:bg-brand-green/8'
                  }`}
                >
                  <ThumbsUp size={11} />
                </motion.button>
                {/* Dislike — red */}
                <motion.button
                  whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
                  onClick={() => onLike(message.liked === false ? null : false)}
                  title="Kurang bagus"
                  className={`p-1.5 rounded-lg transition-colors ${
                    message.liked === false ? 'text-brand-red bg-brand-red/12' : 'text-white/25 hover:text-brand-red hover:bg-brand-red/8'
                  }`}
                >
                  <ThumbsDown size={11} />
                </motion.button>
              </>
            )}

            {message.model && (
              <span className="text-[9px] text-white/20 ml-1 font-mono hidden sm:block">
                {message.model.split('/').pop()?.split(':')[0]?.slice(0, 22)}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
