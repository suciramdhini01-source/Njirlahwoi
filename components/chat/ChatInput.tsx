'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square } from 'lucide-react';
import TemperatureSlider from '@/components/ui/TemperatureSlider';

interface ChatInputProps {
  onSend: (content: string) => void;
  isStreaming: boolean;
  onStop?: () => void;
  disabled?: boolean;
  temperature: number;
  onTemperatureChange: (v: number) => void;
}

interface Ripple { id: number; x: number; y: number; }

export default function ChatInput({
  onSend, isStreaming, onStop, disabled, temperature, onTemperatureChange,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [fillHover, setFillHover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleSend = (e?: React.MouseEvent) => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;

    if (e && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const id = Date.now();
      setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
    }

    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
              ? '0 0 24px rgba(6,182,212,0.35), 0 0 48px rgba(6,182,212,0.1)'
              : value.trim()
              ? '0 0 24px rgba(168,85,247,0.25), 0 0 48px rgba(168,85,247,0.08)'
              : 'none',
          }}
          transition={{ duration: 0.4 }}
          className="glass rounded-2xl p-3 flex items-end gap-3 border border-white/10"
        >
          {/* Pulsing neon dot */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], backgroundColor: isStreaming ? '#06B6D4' : '#A855F7' }}
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

          {/* Temperature slider */}
          <div className="flex-shrink-0 mb-0.5">
            <TemperatureSlider value={temperature} onChange={onTemperatureChange} />
          </div>

          {/* Send / Stop button — fill text left-to-right on hover */}
          <div className="relative flex-shrink-0 overflow-hidden rounded-xl">
            <motion.button
              ref={btnRef}
              onClick={isStreaming ? onStop : (e) => handleSend(e as any)}
              disabled={!isStreaming && !canSend}
              onHoverStart={() => setFillHover(true)}
              onHoverEnd={() => setFillHover(false)}
              whileHover={canSend || isStreaming ? { scale: 1.06 } : {}}
              whileTap={canSend || isStreaming ? { scale: 0.91 } : {}}
              className={`relative p-2 rounded-xl transition-colors overflow-hidden ${
                isStreaming
                  ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/40'
                  : canSend
                  ? 'border border-neon-purple/40'
                  : 'text-gray-700 cursor-not-allowed'
              }`}
            >
              {/* Fill-text overlay (spec #23) */}
              {canSend && !isStreaming && (
                <motion.div
                  className="absolute inset-0 bg-neon-purple/25 rounded-xl"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: fillHover ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ originX: 0 }}
                />
              )}

              <AnimatePresence mode="wait">
                {isStreaming ? (
                  <motion.div
                    key="stop"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="relative z-10"
                  >
                    <Square size={15} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0, color: fillHover && canSend ? '#A855F7' : undefined }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="relative z-10"
                  >
                    <Send size={15} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Material ripples */}
              {ripples.map((r) => (
                <motion.span
                  key={r.id}
                  className="absolute rounded-full bg-neon-purple/40 pointer-events-none z-20"
                  initial={{ width: 0, height: 0, x: r.x, y: r.y, opacity: 0.7 }}
                  animate={{ width: 80, height: 80, x: r.x - 40, y: r.y - 40, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              ))}
            </motion.button>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-gray-700 mt-2">
          Enter kirim · Shift+Enter baris baru · Ctrl+K palette · 🌡️ temp AI
        </p>
      </div>
    </div>
  );
}
