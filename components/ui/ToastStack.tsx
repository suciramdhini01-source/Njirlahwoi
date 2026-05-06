'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
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
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function showToast(message: string, type: Toast['type'] = 'info') {
  useToastStore.getState().add({ message, type });
}

const icons = {
  success: <CheckCircle size={14} className="text-green-400" />,
  error: <AlertCircle size={14} className="text-red-400" />,
  info: <Info size={14} className="text-neon-cyan" />,
};

const colors = {
  success: 'border-green-500/30 bg-green-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  info: 'border-neon-cyan/30 bg-neon-cyan/10',
};

export default function ToastStack() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, i) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1 - (toasts.length - 1 - i) * 0.04,
              y: (toasts.length - 1 - i) * -6,
            }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', damping: 26, stiffness: 350 }}
            drag="x"
            dragConstraints={{ left: 0, right: 200 }}
            onDragEnd={(_, info) => { if (info.offset.x > 60) remove(toast.id); }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border glass shadow-xl min-w-[260px] max-w-[320px] ${colors[toast.type]}`}
          >
            {icons[toast.type]}
            <p className="text-sm text-white/90 flex-1">{toast.message}</p>
            <button
              onClick={() => remove(toast.id)}
              className="text-gray-600 hover:text-gray-300 transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
