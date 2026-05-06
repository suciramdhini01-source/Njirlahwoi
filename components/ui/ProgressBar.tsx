'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ProgressBarProps {
  active: boolean;
}

export default function ProgressBar({ active }: ProgressBarProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, #A855F7, #06B6D4, #EC4899, #A855F7)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '200% 50%'],
              scaleX: [0.1, 0.7, 0.9, 1],
            }}
            transition={{
              backgroundPosition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
              scaleX: { duration: 3, ease: 'easeInOut' },
            }}
            style={{
              transformOrigin: 'left',
              background: 'linear-gradient(90deg, #A855F7, #06B6D4, #EC4899)',
              boxShadow: '0 0 10px #A855F7, 0 0 20px #06B6D460',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
