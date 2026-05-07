'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Paperclip, X, FileText, Image } from 'lucide-react';
import TemperatureSlider from '@/components/ui/TemperatureSlider';

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  preview?: string;
}

interface ChatInputProps {
  onSend: (content: string) => void;
  isStreaming: boolean;
  onStop?: () => void;
  disabled?: boolean;
  temperature: number;
  onTemperatureChange: (v: number) => void;
  hasAttachment?: boolean;
}

interface Ripple { id: number; x: number; y: number; }

export default function ChatInput({
  onSend, isStreaming, onStop, disabled, temperature, onTemperatureChange, hasAttachment,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [fillHover, setFillHover] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setAttachments([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newAttachments: Attachment[] = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      type: f.type.startsWith('image/') ? 'image' : 'file',
    }));
    setAttachments((prev) => [...prev, ...newAttachments].slice(0, 5));
    e.target.value = '';
  };

  const removeAttachment = (id: string) => setAttachments((a) => a.filter((x) => x.id !== id));

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  const placeholder = isStreaming
    ? 'AI sedang berpikir...'
    : attachments.length > 0
    ? 'Lanjutkan diskusi tentang file...'
    : 'Tanya apa aja... AI siap njir lah!';

  return (
    <div className="px-4 pb-3 pt-2 border-t border-white/8 bg-[#0a0a14]/60 backdrop-blur-xl flex-shrink-0">
      <div className="max-w-4xl mx-auto space-y-2">

        {/* Attachment chips */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-1.5 overflow-hidden"
            >
              {attachments.map((att) => (
                <motion.div
                  key={att.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/8 border border-white/10 text-xs text-white/70"
                >
                  {att.type === 'image' ? <Image size={11} className="text-neon-cyan" /> : <FileText size={11} className="text-neon-purple" />}
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button onClick={() => removeAttachment(att.id)} className="text-gray-600 hover:text-gray-300 transition-colors ml-0.5">
                    <X size={10} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box */}
        <motion.div
          animate={{
            boxShadow: isStreaming
              ? '0 0 24px rgba(6,182,212,0.3), 0 0 48px rgba(6,182,212,0.08)'
              : value.trim()
              ? '0 0 24px rgba(168,85,247,0.2), 0 0 48px rgba(168,85,247,0.06)'
              : 'none',
          }}
          transition={{ duration: 0.4 }}
          className="glass rounded-2xl border border-white/10 overflow-hidden"
        >
          <div className="flex items-end gap-2 px-3 py-3">
            {/* Attachment button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || disabled}
              className="p-1.5 rounded-lg text-gray-600 hover:text-neon-purple hover:bg-white/8 transition-colors flex-shrink-0 mb-0.5 disabled:opacity-30"
              title="Lampirkan file"
            >
              <Paperclip size={15} />
            </motion.button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.md,.js,.ts,.py,.json" className="hidden" onChange={handleFileChange} />

            {/* Pulsing dot */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], backgroundColor: isStreaming ? '#06B6D4' : '#A855F7' }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full mb-2 flex-shrink-0"
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={placeholder}
              disabled={disabled || isStreaming}
              rows={1}
              className="flex-1 bg-transparent text-white/90 placeholder-gray-600 text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-[200px] overflow-y-auto disabled:opacity-50"
            />

            {/* Temperature slider */}
            <div className="flex-shrink-0 mb-0.5">
              <TemperatureSlider value={temperature} onChange={onTemperatureChange} />
            </div>

            {/* Send / Stop button */}
            <div className="relative flex-shrink-0 overflow-hidden rounded-xl">
              <motion.button
                ref={btnRef}
                onClick={isStreaming ? onStop : (e) => handleSend(e as unknown as React.MouseEvent)}
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
                    <motion.div key="stop" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ type: 'spring', damping: 20 }} className="relative z-10">
                      <Square size={15} />
                    </motion.div>
                  ) : (
                    <motion.div key="send" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0, color: fillHover && canSend ? '#A855F7' : undefined }} exit={{ scale: 0, rotate: -90 }} transition={{ type: 'spring', damping: 20 }} className="relative z-10">
                      <Send size={15} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {ripples.map((r) => (
                  <motion.span key={r.id} className="absolute rounded-full bg-neon-purple/40 pointer-events-none z-20"
                    initial={{ width: 0, height: 0, x: r.x, y: r.y, opacity: 0.7 }}
                    animate={{ width: 80, height: 80, x: r.x - 40, y: r.y - 40, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }} />
                ))}
              </motion.button>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-gray-700">
          Enter kirim · Shift+Enter baris baru · Ctrl+K palette · 🌡️ temp AI
        </p>
      </div>
    </div>
  );
}
