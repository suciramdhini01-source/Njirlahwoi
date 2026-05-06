'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/ui/ScrollReveal';

/* ── Unicorn walking along an SVG path (anime.js) ── */
function WalkingUnicorn() {
  const unicornRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const animeModule = await import('animejs');
        const anime = (animeModule as any).default ?? animeModule;
        if (cancelled || !unicornRef.current) return;

        anime({
          targets: unicornRef.current,
          translateX: ['-8px', '220px'],
          translateY: [0, -6, 0, -4, 0, -8, 0],
          rotate: { value: ['-3deg', '3deg'], duration: 500, loop: true, easing: 'easeInOutSine' },
          duration: 6000,
          loop: true,
          easing: 'easeInOutQuad',
          direction: 'alternate',
        });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div ref={containerRef} className="relative h-8 w-56 mx-auto overflow-hidden">
      {/* Track line */}
      <div className="absolute bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-purple/30 to-transparent" />
      <span
        ref={unicornRef}
        className="absolute bottom-1.5 text-lg select-none"
        style={{ willChange: 'transform' }}
      >
        🦄
      </span>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40 backdrop-blur-md py-6 text-center flex-shrink-0">
      <WalkingUnicorn />

      <ScrollReveal delay={0.1}>
        <p className="text-lg font-bold text-neon-pink flex items-center justify-center gap-2 font-heading mt-3">
          Dibuat dengan{' '}
          <motion.span
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            className="text-red-500 inline-block"
          >
            ❤️
          </motion.span>{' '}
          oleh{' '}
          <motion.span
            whileHover={{ color: '#A855F7', textShadow: '0 0 12px rgba(168,85,247,0.6)' }}
            className="underline decoration-neon-purple decoration-2 cursor-default"
          >
            Andikaa Saputraa
          </motion.span>
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.18}>
        <p className="text-sm text-gray-400 mt-1">
          Membangun masa depan AI yang bebas, tanpa batas, ala kadarnya tapi njir lah keren.
        </p>
        <p className="text-xs text-gray-600 mt-2">© {year} NJIRLAH AI</p>
      </ScrollReveal>
    </footer>
  );
}
