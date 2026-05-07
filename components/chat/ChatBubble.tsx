'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check, AlertTriangle, RotateCcw } from 'lucide-react';
import { Message } from '@/store/chat-store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  onLike?: (liked: boolean | null) => void;
  streaming?: boolean;
}

function AppleRipple() {
  return (
    <div className="absolute -inset-1 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-neon-purple/40"
          animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
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
          transition={{ delay: Math.min(i * 0.012, 1.2), duration: 0.18 }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── Error bubble ─────────────────────────────────────────────── */
function ErrorBubble({ content, onRetry }: { content: string; onRetry?: () => void }) {
  // Strip leading emoji/markdown error prefix for cleaner display
  const cleaned = content.replace(/^[❌⚠️*_\s]+Error[*_:\s]*/i, '').trim();
  return (
    <div className="rounded-2xl px-4 py-3 bg-red-500/8 border border-red-500/20 backdrop-blur-sm">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-red-300 mb-0.5">Oops, ada masalah</p>
          <p className="text-xs text-red-400/80 leading-relaxed break-words">{cleaned || content}</p>
        </div>
      </div>
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={onRetry}
          className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 hover:bg-red-500/20 transition-colors"
        >
          <RotateCcw size={11} />
          Coba Lagi
        </motion.button>
      )}
    </div>
  );
}

export default function ChatBubble({ message, onRegenerate, onLike, streaming }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isLong = message.content.split(' ').length > 30;
  const isError = message.isError ||
    (message.role === 'assistant' && (message.content.startsWith('❌') || message.content.startsWith('⚠️')));

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className={`flex items-start gap-3 px-4 py-2 group ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm select-none ${
          isUser
            ? 'bg-gradient-to-br from-neon-pink to-neon-purple'
            : isError
            ? 'bg-gradient-to-br from-red-500/60 to-red-800/60'
            : 'bg-gradient-to-br from-neon-purple to-neon-cyan'
        }`}>
          {isUser ? '👤' : isError ? '⚠️' : '🦄'}
        </div>
        {streaming && !isUser && <AppleRipple />}
      </div>

      {/* Content */}
      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>

        {/* Bubble */}
        <motion.div layout className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 border border-neon-purple/30 rounded-tr-sm'
            : isError
            ? '' /* error component handles its own container */
            : 'glass rounded-bl-sm'
        }`}>
          {isUser ? (
            <p className="text-white/90 whitespace-pre-wrap">{message.content}</p>
          ) : isError ? (
            <ErrorBubble content={message.content} onRetry={onRegenerate} />
          ) : streaming && isLong ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <StaggerWords text={message.content} />
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </motion.div>

        {/* Actions row — always visible on mobile, hover on desktop */}
        {!streaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity duration-150 ${isUser ? 'flex-row-reverse' : ''}`}
          >
            {/* Copy */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              title="Salin"
              className="p-1.5 rounded-lg text-gray-500 hover:text-neon-cyan hover:bg-white/5 transition-colors"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check size={11} className="text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy size={11} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Regenerate */}
            {!isUser && onRegenerate && (
              <motion.button
                whileHover={{ scale: 1.15, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', damping: 15 }}
                onClick={onRegenerate}
                title="Generate ulang"
                className="p-1.5 rounded-lg text-gray-500 hover:text-neon-purple hover:bg-white/5 transition-colors"
              >
                <RefreshCw size={11} />
              </motion.button>
            )}

            {/* Like / Dislike */}
            {!isUser && onLike && (
              <>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    onLike(message.liked === true ? null : true);
                  }}
                  title="Bagus"
                  className={`p-1.5 rounded-lg transition-colors ${
                    message.liked === true ? 'text-neon-cyan bg-neon-cyan/10' : 'text-gray-500 hover:text-neon-cyan hover:bg-white/5'
                  }`}
                >
                  <ThumbsUp size={11} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    onLike(message.liked === false ? null : false);
                  }}
                  title="Kurang bagus"
                  className={`p-1.5 rounded-lg transition-colors ${
                    message.liked === false ? 'text-neon-pink bg-neon-pink/10' : 'text-gray-500 hover:text-neon-pink hover:bg-white/5'
                  }`}
                >
                  <ThumbsDown size={11} />
                </motion.button>
              </>
            )}

            {/* Model tag */}
            {message.model && (
              <span className="text-[9px] text-gray-700 ml-1 font-mono hidden sm:block">
                {message.model.split('/').pop()?.split(':')[0]?.slice(0, 24)}
              </span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
