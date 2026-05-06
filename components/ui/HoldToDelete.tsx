'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface HoldToDeleteProps {
  onDelete: () => void;
  duration?: number;
}

const R = 10;
const CIRC = 2 * Math.PI * R;

export default function HoldToDelete({ onDelete, duration = 1800 }: HoldToDeleteProps) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const start = () => {
    setActive(true);
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setActive(false);
        setProgress(0);
        onDelete();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const cancel = () => {
    cancelAnimationFrame(rafRef.current);
    setActive(false);
    setProgress(0);
  };

  const strokeDash = CIRC * (1 - progress);

  return (
    <button
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={start}
      onTouchEnd={cancel}
      className="relative flex items-center justify-center w-6 h-6 flex-shrink-0 select-none"
      title="Tahan untuk hapus"
    >
      <svg width={24} height={24} className="absolute inset-0 -rotate-90">
        <circle
          cx={12}
          cy={12}
          r={R}
          fill="none"
          stroke="rgba(239,68,68,0.2)"
          strokeWidth={2}
        />
        <AnimatePresence>
          {active && (
            <motion.circle
              cx={12}
              cy={12}
              r={R}
              fill="none"
              stroke="#EF4444"
              strokeWidth={2}
              strokeLinecap="round"
              initial={{ strokeDashoffset: CIRC, strokeDasharray: CIRC }}
              style={{ strokeDasharray: CIRC, strokeDashoffset: strokeDash }}
            />
          )}
        </AnimatePresence>
      </svg>
      <motion.div
        animate={{ scale: active ? 1.2 : 1, color: active ? '#EF4444' : '#6B7280' }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <Trash2 size={11} />
      </motion.div>
    </button>
  );
}
