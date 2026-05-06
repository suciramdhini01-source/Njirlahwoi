'use client';

import { motion } from 'framer-motion';

function AnimatedHeart() {
  return (
    <motion.span
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      className="inline-block text-neon-pink"
    >
      ❤️
    </motion.span>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40 backdrop-blur-md py-6 text-center flex-shrink-0">
      <p className="text-lg font-bold text-neon-pink flex items-center justify-center gap-2 font-heading">
        Dibuat dengan <AnimatedHeart /> oleh{' '}
        <span className="underline decoration-neon-purple">Andikaa Saputraa</span>
      </p>
      <p className="text-sm text-gray-400 mt-1">
        Membangun masa depan AI yang bebas, tanpa batas, ala kadarnya tapi njir lah keren. © {year}
      </p>
    </footer>
  );
}
