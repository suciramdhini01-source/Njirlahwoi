'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
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

const STYLES = {
  success: {
    border: 'border-brand-green/25',
    bg: 'bg-brand-green/8',
    bar: 'bg-brand-green',
    icon: <CheckCircle size={14} className="text-brand-green flex-shrink-0" />,
  },
  error: {
    border: 'border-brand-red/25',
    bg: 'bg-brand-red/8',
    bar: 'bg-brand-red',
    icon: <AlertCircle size={14} className="text-brand-red flex-shrink-0" />,
  },
  info: {
    border: 'border-brand-blue/25',
    bg: 'bg-brand-blue/8',
    bar: 'bg-brand-blue',
    icon: <Info size={14} className="text-brand-blue flex-shrink-0" />,
  },
  warning: {
    border: 'border-brand-amber/25',
    bg: 'bg-brand-amber/8',
    bar: 'bg-brand-amber',
    icon: <AlertTriangle size={14} className="text-brand-amber flex-shrink-0" />,
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const s = STYLES[toast.type];
  useEffect(() => {
    const t = setTimeout(onRemove, 4400);
    return () => clearTimeout(t);
  }, [onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.92 }}
      transition={{ type: 'spring', damping: 24, stiffness: 360 }}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border glass overflow-hidden min-w-[240px] max-w-sm ${s.border} ${s.bg}`}
    >
      {s.icon}
      <p className="text-xs text-white/80 flex-1 leading-snug">{toast.message}</p>
      <button onClick={onRemove} className="text-white/25 hover:text-white/70 transition-colors flex-shrink-0">
        <X size={12} />
      </button>
      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${s.bar} opacity-60`}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4.4, ease: 'linear' }}
        style={{ transformOrigin: 'left' }}
      />
    </motion.div>
  );
}

export default function ToastStack() {
  const { toasts, remove } = useToastStore();
  return (
    <div className="fixed bottom-6 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={() => remove(t.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
