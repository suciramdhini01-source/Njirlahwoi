'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  isStreaming: boolean;
  onStop?: () => void;
  disabled?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function ChatInput({ onSend, isStreaming, onStop, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleSend = (e?: React.MouseEvent) => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;

    // Ripple effect
    if (e && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const id = Date.now();
      setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
    }

    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  return (
    <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        <motion.div
          animate={{
            boxShadow: isStreaming
              ? '0 0 20px rgba(6,182,212,0.3)'
              : value.trim()
              ? '0 0 20px rgba(168,85,247,0.2)'
              : 'none',
          }}
          className="glass rounded-2xl p-3 flex items-end gap-3 border border-white/10"
        >
          {/* Neon dot */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              backgroundColor: isStreaming ? '#06B6D4' : '#A855F7',
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full mb-2.5 flex-shrink-0"
          />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={isStreaming ? 'AI sedang berpikir...' : 'Tanya apa aja... AI siap njir lah!'}
            disabled={disabled || isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-white/90 placeholder-gray-600 text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-[200px] overflow-y-auto disabled:opacity-50"
          />

          {/* Send / Stop button */}
          <div className="relative flex-shrink-0 overflow-hidden rounded-xl">
            <motion.button
              ref={btnRef}
              onClick={isStreaming ? onStop : (e) => handleSend(e as any)}
              disabled={!isStreaming && !canSend}
              whileHover={canSend || isStreaming ? { scale: 1.05 } : {}}
              whileTap={canSend || isStreaming ? { scale: 0.93 } : {}}
              className={`relative p-2 rounded-xl transition-all overflow-hidden ${
                isStreaming
                  ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/40'
                  : canSend
                  ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/40'
                  : 'text-gray-700 cursor-not-allowed'
              }`}
            >
              <AnimatePresence mode="wait">
                {isStreaming ? (
                  <motion.div
                    key="stop"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ type: 'spring', damping: 20 }}
                  >
                    <Square size={15} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={{ type: 'spring', damping: 20 }}
                  >
                    <Send size={15} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ripples */}
              {ripples.map((r) => (
                <motion.span
                  key={r.id}
                  className="absolute rounded-full bg-neon-purple/40 pointer-events-none"
                  initial={{ width: 0, height: 0, x: r.x, y: r.y, opacity: 0.6 }}
                  animate={{ width: 80, height: 80, x: r.x - 40, y: r.y - 40, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              ))}
            </motion.button>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-gray-700 mt-2">
          Enter kirim · Shift+Enter baris baru · Ctrl+K command palette
        </p>
      </div>
    </div>
  );
}
