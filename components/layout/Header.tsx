'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Zap } from 'lucide-react';
import ModelSelector from '@/components/ui/ModelSelector';
import { useChatStore } from '@/store/chat-store';

export default function Header() {
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);
  const { isStreaming, selectedProvider, selectedModel } = useChatStore();

  const handleLogoClick = () => {
    const next = logoClickCount + 1;
    setLogoClickCount(next);
    if (next >= 3) {
      setEasterEgg(true);
      setTimeout(() => {
        setEasterEgg(false);
        setLogoClickCount(0);
      }, 3000);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-md flex-shrink-0 relative z-10">
      <div className="flex items-center gap-3">
        <motion.button
          onClick={handleLogoClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2"
        >
          <motion.span
            className="text-2xl"
            animate={easterEgg ? {
              rotate: [0, 20, -20, 20, -20, 0],
              scale: [1, 1.3, 1.3, 1.3, 1.3, 1],
            } : {}}
            transition={{ duration: 0.8 }}
          >
            🦄
          </motion.span>
        </motion.button>

        {easterEgg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            {['🌟', '✨', '💜', '🦄', '✨', '🌟'].map((emoji, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -10, 0], rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, delay: i * 0.1, repeat: 3 }}
                className="text-lg"
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ModelSelector />

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          {isStreaming ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-neon-cyan"
              />
              <span className="text-[10px] text-neon-cyan">Streaming</span>
            </>
          ) : (
            <>
              <Zap size={10} className="text-neon-purple" />
              <span className="text-[10px] text-gray-500">
                {selectedProvider === 'cloudflare' ? 'Cloudflare' : 'OpenRouter'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
