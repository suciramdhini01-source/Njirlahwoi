'use client';

import { motion } from 'framer-motion';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40 backdrop-blur-md py-6 text-center flex-shrink-0">
      <p className="text-lg font-bold text-neon-pink flex items-center justify-center gap-2 font-heading">
        Dibuat dengan{' '}
        <motion.span
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          className="text-red-500 inline-block"
        >
          ❤️
        </motion.span>{' '}
        oleh{' '}
        <span className="underline decoration-neon-purple decoration-2">Andikaa Saputraa</span>
      </p>
      <p className="text-sm text-gray-400 mt-1">
        Membangun masa depan AI yang bebas, tanpa batas, ala kadarnya tapi njir lah keren.
      </p>
      <p className="text-xs text-gray-500 mt-2">© {year} NJIRLAH AI</p>
    </footer>
  );
}
