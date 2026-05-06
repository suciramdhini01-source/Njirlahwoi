'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Message } from '@/store/chat-store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  onLike?: (liked: boolean | null) => void;
}

export default function ChatBubble({ message, onRegenerate, onLike }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-start gap-3 px-4 py-2 group ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-neon-pink to-neon-purple'
            : 'bg-gradient-to-br from-neon-purple to-neon-cyan'
        }`}
      >
        {isUser ? '👤' : '🦄'}
      </div>

      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 border border-neon-purple/30 rounded-tr-sm'
              : 'glass rounded-bl-sm'
          }`}
        >
          {isUser ? (
            <p className="text-white/90 whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div
          className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            isUser ? 'flex-row-reverse' : ''
          }`}
        >
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-gray-500 hover:text-neon-cyan hover:bg-white/5 transition-colors"
            title="Copy"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          {!isUser && (
            <>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-md text-gray-500 hover:text-neon-purple hover:bg-white/5 transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw size={13} />
                </button>
              )}
              {onLike && (
                <>
                  <button
                    onClick={() => onLike(message.liked === true ? null : true)}
                    className={`p-1.5 rounded-md transition-colors ${
                      message.liked === true
                        ? 'text-neon-cyan'
                        : 'text-gray-500 hover:text-neon-cyan hover:bg-white/5'
                    }`}
                    title="Like"
                  >
                    <ThumbsUp size={13} />
                  </button>
                  <button
                    onClick={() => onLike(message.liked === false ? null : false)}
                    className={`p-1.5 rounded-md transition-colors ${
                      message.liked === false
                        ? 'text-neon-pink'
                        : 'text-gray-500 hover:text-neon-pink hover:bg-white/5'
                    }`}
                    title="Dislike"
                  >
                    <ThumbsDown size={13} />
                  </button>
                </>
              )}
            </>
          )}
          {message.model && (
            <span className="text-[10px] text-gray-600 ml-1">
              {message.model.split('/').pop()?.split(':')[0]}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
