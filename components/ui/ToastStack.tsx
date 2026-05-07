'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Zap } from 'lucide-react';
import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastStore {
  toasts: Toast[];
  add: (t: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4500);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function showToast(message: string, type: Toast['type'] = 'info') {
  useToastStore.getState().add({ message, type });
}

const styles = {
  success: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/8',
    glow: '0 0 20px rgba(52,211,153,0.15)',
    icon: <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />,
    bar: 'bg-emerald-500',
  },
  error: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/8',
    glow: '0 0 20px rgba(239,68,68,0.15)',
    icon: <AlertCircle size={14} className="text-red-400 flex-shrink-0" />,
    bar: 'bg-red-500',
  },
  info: {
    border: 'border-neon-cyan/30',
    bg: 'bg-neon-cyan/8',
    glow: '0 0 20px rgba(6,182,212,0.15)',
    icon: <Info size={14} className="text-neon-cyan flex-shrink-0" />,
    bar: 'bg-neon-cyan',
  },
  warning: {
    border: 'border-yellow-400/30',
    bg: 'bg-yellow-400/8',
    glow: '0 0 20px rgba(250,204,21,0.15)',
    icon: <Zap size={14} className="text-yellow-400 flex-shrink-0" />,
    bar: 'bg-yellow-400',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const s = styles[toast.type];

  useEffect(() => {
    const t = setTimeout(onRemove, 4500);
    return () => clearTimeout(t);
  }, [onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.92, x: 40 }}
      transition={{ type: 'spring', damping: 22, stiffness: 380 }}
      drag="x"
      dragConstraints={{ left: 0, right: 200 }}
      onDragEnd={(_, info) => { if (info.offset.x > 60) onRemove(); }}
      style={{ boxShadow: s.glow }}
      className={`relative flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl border glass overflow-hidden min-w-[280px] max-w-[360px] cursor-grab active:cursor-grabbing ${s.border} ${s.bg}`}
    >
      {/* Progress drain bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${s.bar} opacity-40 rounded-full`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 4.5, ease: 'linear' }}
      />

      {s.icon}
      <p className="text-sm text-white/85 flex-1 leading-snug">{toast.message}</p>
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.85 }}
        onClick={onRemove}
        className="text-gray-600 hover:text-gray-300 transition-colors ml-1 flex-shrink-0"
      >
        <X size={12} />
      </motion.button>
    </motion.div>
  );
}

export default function ToastStack() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={() => remove(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
