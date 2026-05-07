'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface ImageRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function ImageReveal({ children, className = '', delay = 0 }: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={inView ? { y: '0%', opacity: 1 } : {}}
        transition={{ type: 'spring', damping: 26, stiffness: 260, delay }}
      >
        {children}
      </motion.div>
      {/* Reveal overlay wipe */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={inView ? { scaleX: 0 } : {}}
        transition={{ type: 'spring', damping: 22, stiffness: 200, delay: delay + 0.08 }}
        style={{ originX: 1 }}
        className="absolute inset-0 bg-gradient-to-r from-brand-blue/40 to-brand-green/40 pointer-events-none"
      />
    </div>
  );
}
