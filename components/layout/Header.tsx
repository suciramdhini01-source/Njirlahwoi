'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';
import ModelSelector from '@/components/ui/ModelSelector';
import MultiStateBadge from '@/components/ui/MultiStateBadge';
import { useChatStore } from '@/store/chat-store';

interface HeaderProps {
  onOpenCommand?: () => void;
}

/* ── Split-text letter entrance ─────────────────────────────────── */
function SplitText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: -14, rotateX: -80 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: i * 0.04, type: 'spring', damping: 18, stiffness: 280 }}
          className="inline-block"
          style={{ transformOrigin: 'top' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

/* ── anime.js neon path drawing around logo ─────────────────────── */
function LogoWithPathDraw() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);

  useEffect(() => {
    if (!hovered || !svgRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const animeModule = await import('animejs');
        const anime = (animeModule as any).default ?? animeModule;
        if (cancelled || !svgRef.current) return;

        const path = svgRef.current.querySelector('rect.neon-outline');
        if (!path) return;

        anime({
          targets: path,
          strokeDashoffset: [anime.setDashoffset(path), 0],
          duration: 800,
          easing: 'easeInOutCubic',
        });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [hovered]);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 3) {
      setEasterEgg(true);
      setLogoClicks(0);
      setTimeout(() => setEasterEgg(false), 3200);
    }
  };

  return (
    <motion.button
      onClick={handleLogoClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex items-center gap-2 select-none"
    >
      {/* SVG path-draw outline on hover */}
      <svg
        ref={svgRef}
        className="absolute -inset-1.5 pointer-events-none overflow-visible"
        style={{ width: 'calc(100% + 12px)', height: 'calc(100% + 12px)' }}
      >
        <rect
          className="neon-outline"
          x="1" y="1"
          width="calc(100% - 2px)" height="calc(100% - 2px)"
          rx="10"
          fill="none"
          stroke={hovered ? '#A855F7' : 'transparent'}
          strokeWidth="1.5"
          style={{ filter: hovered ? 'drop-shadow(0 0 4px #A855F7)' : 'none' }}
        />
      </svg>

      <motion.span
        className="text-xl"
        animate={
          easterEgg
            ? { rotate: [0, 25, -25, 25, -25, 0], scale: [1, 1.5, 1.5, 1.5, 1.5, 1] }
            : {}
        }
        transition={{ duration: 0.9 }}
      >
        🦄
      </motion.span>
      <SplitText
        text="NJIRLAH AI"
        className="hidden sm:block text-sm font-bold font-heading gradient-text"
      />

      <AnimatePresence>
        {easterEgg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute left-full ml-2 flex items-center gap-0.5 whitespace-nowrap"
          >
            {['🌟', '✨', '💜', '🦄', '💜', '✨', '🌟'].map((e, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -14, 0], rotate: [0, 20, -20, 0] }}
                transition={{ duration: 0.55, delay: i * 0.07, repeat: 4 }}
                className="text-base"
              >
                {e}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function Header({ onOpenCommand }: HeaderProps) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const { isStreaming, selectedProvider } = useChatStore();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 80);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const badgeState = isStreaming ? 'streaming' : 'online';
  const provider = selectedProvider === 'cloudflare' ? '☁️ CF' : '🔗 OR';

  return (
    <motion.div
      animate={{ y: hidden ? -72 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-md flex-shrink-0 relative z-10"
    >
      <LogoWithPathDraw />

      <div className="flex items-center gap-2">
        <ModelSelector />
        <MultiStateBadge state={badgeState} provider={provider} />

        {/* Command palette shortcut */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass text-gray-500 hover:text-neon-purple hover:border-neon-purple/30 transition-all border border-white/10"
          title="Command Palette (Ctrl+K)"
        >
          <Terminal size={12} />
          <kbd className="text-[9px] font-mono">⌘K</kbd>
        </motion.button>
      </div>
    </motion.div>
  );
}
