'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface HoldToDeleteProps {
  onDelete: () => void;
  holdDuration?: number;
}

export default function HoldToDelete({ onDelete, holdDuration = 1800 }: HoldToDeleteProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startHold = () => {
    setIsHolding(true);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current!);
        setIsHolding(false);
        setProgress(0);
        onDelete();
      }
    }, 30);
  };

  const stopHold = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsHolding(false);
    setProgress(0);
  };

  const radius = 9;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;

  return (
    <motion.button
      onMouseDown={startHold}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchStart={startHold}
      onTouchEnd={stopHold}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-1.5 rounded-lg bg-brand-red/10 border border-brand-red/25 text-brand-red flex items-center justify-center"
      title="Tahan untuk hapus"
    >
      <svg width="22" height="22" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90">
        <circle cx="11" cy="11" r={radius} fill="none" stroke="rgba(255,59,48,0.15)" strokeWidth="2" />
        {isHolding && (
          <motion.circle
            cx="11" cy="11" r={radius}
            fill="none"
            stroke="#FF3B30"
            strokeWidth="2"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        )}
      </svg>
      <Trash2 size={11} className="relative z-10" />
    </motion.button>
  );
}
