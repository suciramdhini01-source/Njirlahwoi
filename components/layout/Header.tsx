'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Zap, Terminal } from 'lucide-react';
import ModelSelector from '@/components/ui/ModelSelector';
import { useChatStore } from '@/store/chat-store';

interface HeaderProps {
  onOpenCommand?: () => void;
}

function SplitText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, type: 'spring', damping: 20, stiffness: 300 }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

export default function Header({ onOpenCommand }: HeaderProps) {
  const [logoClicks, setLogoClicks] = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { isStreaming, selectedProvider } = useChatStore();
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setHidden(currentY > lastScrollY.current && currentY > 80);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 3) {
      setEasterEgg(true);
      setLogoClicks(0);
      setTimeout(() => setEasterEgg(false), 3000);
    }
  };

  return (
    <motion.div
      animate={{ y: hidden ? -80 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-md flex-shrink-0 relative z-10"
    >
      <div className="flex items-center gap-3">
        <motion.button
          onClick={handleLogoClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 select-none"
        >
          <motion.span
            className="text-xl"
            animate={
              easterEgg
                ? { rotate: [0, 25, -25, 25, -25, 0], scale: [1, 1.4, 1.4, 1.4, 1.4, 1] }
                : {}
            }
            transition={{ duration: 0.8 }}
          >
            🦄
          </motion.span>
          <SplitText
            text="NJIRLAH AI"
            className="hidden sm:block text-sm font-bold font-heading gradient-text"
          />
        </motion.button>

        <AnimatePresence>
          {easterEgg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex items-center gap-0.5"
            >
              {['🌟', '✨', '💜', '🦄', '💜', '✨', '🌟'].map((e, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -12, 0], rotate: [0, 20, -20, 0] }}
                  transition={{ duration: 0.5, delay: i * 0.07, repeat: 3 }}
                  className="text-base"
                >
                  {e}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        <ModelSelector />

        {/* Provider badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10">
          {isStreaming ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-neon-cyan"
              />
              <span className="text-[10px] text-neon-cyan font-medium">Streaming</span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-neon-purple"
              />
              <span className="text-[10px] text-gray-500">
                {selectedProvider === 'cloudflare' ? '☁️ Cloudflare' : '🔗 OpenRouter'}
              </span>
            </>
          )}
        </div>

        {/* Command palette shortcut */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg glass text-gray-500 hover:text-neon-purple hover:border-neon-purple/30 transition-colors border border-white/10"
          title="Command Palette (Ctrl+K)"
        >
          <Terminal size={12} />
          <kbd className="text-[9px]">⌘K</kbd>
        </motion.button>
      </div>
    </motion.div>
  );
}
