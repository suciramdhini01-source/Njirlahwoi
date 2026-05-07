'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function ProgressBar({ active }: { active: boolean }) {
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
            style={{
              height: '100%',
              transformOrigin: 'left',
              background: 'linear-gradient(90deg, #5AC8FA, #34C759, #A9D171, #FF9500, #5AC8FA)',
              backgroundSize: '300% 100%',
              boxShadow: '0 0 8px rgba(90,200,250,0.7)',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '300% 50%'],
              scaleX: [0.05, 0.6, 0.85, 1],
            }}
            transition={{
              backgroundPosition: { duration: 1.8, repeat: Infinity, ease: 'linear' },
              scaleX: { duration: 3.5, ease: 'easeInOut' },
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
