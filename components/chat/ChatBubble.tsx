'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
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
          transition={{ delay: Math.min(i * 0.015, 1.5), duration: 0.2 }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export default function ChatBubble({ message, onRegenerate, onLike, streaming }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isLong = message.content.split(' ').length > 30;

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
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className={`flex items-start gap-3 px-4 py-2 group ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
            isUser
              ? 'bg-gradient-to-br from-neon-pink to-neon-purple'
              : 'bg-gradient-to-br from-neon-purple to-neon-cyan'
          }`}
        >
          {isUser ? '👤' : '🦄'}
        </div>
        {streaming && !isUser && <AppleRipple />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <motion.div
          layout
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 border border-neon-purple/30 rounded-tr-sm'
              : 'glass rounded-bl-sm'
          }`}
        >
          {isUser ? (
            <p className="text-white/90 whitespace-pre-wrap">{message.content}</p>
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

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            isUser ? 'flex-row-reverse' : ''
          }`}
        >
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className="p-1.5 rounded-md text-gray-500 hover:text-neon-cyan hover:bg-white/5 transition-colors"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check size={12} className="text-green-400" />
                </motion.div>
              ) : (
                <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Copy size={12} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {!isUser && onRegenerate && (
            <motion.button
              whileHover={{ scale: 1.15, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', damping: 15 }}
              onClick={onRegenerate}
              className="p-1.5 rounded-md text-gray-500 hover:text-neon-purple hover:bg-white/5 transition-colors"
            >
              <RefreshCw size={12} />
            </motion.button>
          )}

          {!isUser && onLike && (
            <>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => onLike(message.liked === true ? null : true)}
                className={`p-1.5 rounded-md transition-colors ${
                  message.liked === true ? 'text-neon-cyan' : 'text-gray-500 hover:text-neon-cyan hover:bg-white/5'
                }`}
              >
                <ThumbsUp size={12} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => onLike(message.liked === false ? null : false)}
                className={`p-1.5 rounded-md transition-colors ${
                  message.liked === false ? 'text-neon-pink' : 'text-gray-500 hover:text-neon-pink hover:bg-white/5'
                }`}
              >
                <ThumbsDown size={12} />
              </motion.button>
            </>
          )}
          {message.model && (
            <span className="text-[9px] text-gray-700 ml-1 font-mono">
              {message.model.split('/').pop()?.split(':')[0]?.slice(0, 20)}
            </span>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
