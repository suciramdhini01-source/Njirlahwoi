"use client";
import { motion } from "framer-motion";
import { useState } from "react";

interface Props {
  size?: number;
  className?: string;
}

export function NJIRLAHLogo({ size = 40, className = "" }: Props) {
  const [clicks, setClicks] = useState(0);
  const [dance, setDance] = useState(false);

  const handleClick = () => {
    const n = clicks + 1;
    setClicks(n);
    if (n >= 3) {
      setDance(true);
      setTimeout(() => {
        setDance(false);
        setClicks(0);
      }, 2400);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.08, rotate: -4 }}
      whileTap={{ scale: 0.92 }}
      animate={
        dance
          ? { rotate: [0, -20, 20, -10, 10, 0], y: [0, -8, 0, -4, 0] }
          : { rotate: 0, y: 0 }
      }
      transition={dance ? { duration: 1.2, repeat: 1 } : { type: "spring" }}
      aria-label="NJIRLAH AI Logo"
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="nj-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#A855F7" />
            <stop offset="0.5" stopColor="#06B6D4" />
            <stop offset="1" stopColor="#EC4899" />
          </linearGradient>
          <filter id="nj-glow">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d="M14 48 L14 20 L26 36 L26 14 M38 48 Q32 38 42 30 Q52 22 48 14 L56 14 L54 24 Q50 38 42 44 L50 48"
          stroke="url(#nj-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#nj-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <motion.circle
          cx="48"
          cy="14"
          r="2.5"
          fill="#EC4899"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      </svg>
      {dance && (
        <motion.div
          className="absolute -bottom-8 left-1/2 text-xs font-semibold text-neon-pink whitespace-nowrap"
          initial={{ opacity: 0, x: "-50%", y: -4 }}
          animate={{ opacity: 1, x: "-50%", y: 0 }}
        >
          njirrr unicorn menarii!
        </motion.div>
      )}
    </motion.button>
  );
}
