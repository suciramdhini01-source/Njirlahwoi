'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

function WalkingUnicorn() {
  const unicornRef = useRef<HTMLSpanElement>(null);

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
    <div className="relative h-8 w-56 mx-auto overflow-hidden">
      <div className="absolute bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-pistachio/30 to-transparent" />
      <span ref={unicornRef} className="absolute bottom-1.5 text-lg select-none" style={{ willChange: 'transform' }}>
        🦄
      </span>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#0A0A14]/60 backdrop-blur-md py-6 text-center flex-shrink-0">
      <WalkingUnicorn />
      <p className="text-base font-bold flex items-center justify-center gap-2 font-heading mt-3 text-white/80">
        Dibuat dengan{' '}
        <motion.span
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          className="text-brand-red inline-block"
        >
          ❤️
        </motion.span>{' '}
        oleh{' '}
        <motion.span
          whileHover={{ color: '#5AC8FA', textShadow: '0 0 12px rgba(90,200,250,0.5)' }}
          className="underline decoration-brand-blue decoration-2 cursor-default text-white/70"
        >
          Andikaa Saputraa
        </motion.span>
      </p>
      <p className="text-sm text-white/25 mt-1">
        Platform chat AI multi-model — gratis, bebas, dan njir lah keren.
      </p>
      <p className="text-xs text-white/15 mt-2">© {year} NJIRLAH AI</p>
    </footer>
  );
}
