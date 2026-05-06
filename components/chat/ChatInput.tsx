'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Square, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  isStreaming: boolean;
  onStop?: () => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, isStreaming, onStop, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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

  return (
    <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-2xl p-3 flex items-end gap-3 neon-border-purple">
          <Sparkles size={16} className="text-neon-purple mb-2 flex-shrink-0 animate-neon-pulse" />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Tanya apa aja... AI siap njir lah!"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-white/90 placeholder-gray-600 text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-[200px] overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isStreaming ? onStop : handleSend}
            disabled={!isStreaming && (!value.trim() || disabled)}
            className={`p-2 rounded-xl transition-all flex-shrink-0 ${
              isStreaming
                ? 'bg-neon-pink/20 text-neon-pink hover:bg-neon-pink/30 border border-neon-pink/40'
                : value.trim()
                ? 'bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 border border-neon-purple/40'
                : 'text-gray-700 cursor-not-allowed'
            }`}
          >
            {isStreaming ? <Square size={16} /> : <Send size={16} />}
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-gray-700 mt-2">
          Enter untuk kirim · Shift+Enter untuk baris baru
        </p>
      </div>
    </div>
  );
}
