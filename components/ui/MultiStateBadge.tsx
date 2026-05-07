'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface MultiStateBadgeProps {
  state: 'online' | 'streaming' | 'offline' | 'loading';
  provider?: string;
}

const stateConfig = {
  online:    { label: 'Online',   dotClass: 'bg-brand-green',  textClass: 'text-brand-green',  bgClass: 'bg-brand-green/8 border-brand-green/18' },
  streaming: { label: 'Streaming',dotClass: 'bg-brand-blue',   textClass: 'text-brand-blue',   bgClass: 'bg-brand-blue/8 border-brand-blue/18' },
  offline:   { label: 'Offline',  dotClass: 'bg-brand-red',    textClass: 'text-brand-red',    bgClass: 'bg-brand-red/8 border-brand-red/18' },
  loading:   { label: 'Loading',  dotClass: 'bg-brand-amber',  textClass: 'text-brand-amber',  bgClass: 'bg-brand-amber/8 border-brand-amber/18' },
};

export default function MultiStateBadge({ state, provider }: MultiStateBadgeProps) {
  const cfg = stateConfig[state] ?? stateConfig.online;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: 'spring', damping: 22, stiffness: 360 }}
        className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-medium ${cfg.bgClass} ${cfg.textClass}`}
      >
        <motion.div
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotClass}`}
          animate={state === 'streaming'
            ? { scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }
            : state === 'online'
            ? { scale: [1, 1.3, 1] }
            : {}}
          transition={{ duration: state === 'streaming' ? 0.7 : 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="whitespace-nowrap">{provider ? provider : cfg.label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
