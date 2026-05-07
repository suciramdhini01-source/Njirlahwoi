'use client';

import { motion, AnimatePresence } from 'framer-motion';

type State = 'online' | 'streaming' | 'offline' | 'thinking';

interface MultiStateBadgeProps {
  state: State;
  provider?: string;
}

const CONFIG: Record<State, { color: string; dot: string; label: string; pulse: boolean }> = {
  online:    { color: 'text-neon-cyan',   dot: 'bg-neon-cyan',   label: 'Online',     pulse: false },
  streaming: { color: 'text-neon-purple', dot: 'bg-neon-purple', label: 'Streaming',  pulse: true  },
  thinking:  { color: 'text-neon-pink',   dot: 'bg-neon-pink',   label: 'Thinking',   pulse: true  },
  offline:   { color: 'text-gray-500',    dot: 'bg-gray-600',    label: 'Offline',    pulse: false },
};

export default function MultiStateBadge({ state, provider }: MultiStateBadgeProps) {
  const cfg = CONFIG[state];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.8, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 4 }}
        transition={{ type: 'spring', damping: 22, stiffness: 360 }}
        className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-full sm:rounded-xl glass border border-white/10 ${cfg.color} flex-shrink-0`}
      >
        <div className="relative flex-shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.pulse && (
            <motion.div
              className={`absolute inset-0 rounded-full ${cfg.dot}`}
              animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </div>
        {/* Text hidden on mobile, visible on sm+ */}
        <span className="hidden sm:inline text-[10px] font-medium whitespace-nowrap">
          {provider ? `${provider} · ${cfg.label}` : cfg.label}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
