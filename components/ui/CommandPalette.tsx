'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Plus, Key, Trash2, Zap, Settings } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  group: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenApiKey: () => void;
}

export default function CommandPalette({ open, onClose, onOpenApiKey }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createChat, chats, setActiveChat, deleteChat } = useChatStore();

  const commands: Command[] = [
    {
      id: 'new-chat',
      label: 'New Chat',
      icon: <Plus size={14} />,
      shortcut: 'N',
      group: 'Actions',
      action: () => { createChat(); onClose(); },
    },
    {
      id: 'api-keys',
      label: 'Manage API Keys',
      icon: <Key size={14} />,
      group: 'Settings',
      action: () => { onOpenApiKey(); onClose(); },
    },
    ...chats.slice(0, 6).map((c) => ({
      id: `chat-${c.id}`,
      label: c.title,
      icon: <MessageSquare size={14} />,
      group: 'Recent Chats',
      action: () => { setActiveChat(c.id); onClose(); },
    })),
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); filtered[selected]?.action(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, filtered, selected, onClose]);

  const groups = [...new Set(filtered.map((c) => c.group))];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="relative w-full max-w-lg glass rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <Search size={16} className="text-gray-500 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                placeholder="Ketik command atau cari..."
                className="flex-1 bg-transparent text-sm text-white/90 placeholder-gray-600 outline-none"
              />
              <kbd className="text-[10px] text-gray-600 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-gray-600 py-8">Tidak ada hasil untuk "{query}"</p>
              ) : (
                groups.map((group) => (
                  <div key={group}>
                    <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                      {group}
                    </p>
                    {filtered
                      .filter((c) => c.group === group)
                      .map((cmd) => {
                        const idx = filtered.indexOf(cmd);
                        return (
                          <motion.button
                            key={cmd.id}
                            whileHover={{ x: 4 }}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelected(idx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              selected === idx
                                ? 'bg-neon-purple/15 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <span className={selected === idx ? 'text-neon-purple' : 'text-gray-600'}>
                              {cmd.icon}
                            </span>
                            <span className="flex-1 text-left">{cmd.label}</span>
                            {cmd.shortcut && (
                              <kbd className="text-[10px] text-gray-600 border border-white/10 rounded px-1.5 py-0.5">
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </motion.button>
                        );
                      })}
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between">
              <p className="text-[10px] text-gray-700">↑↓ navigasi · Enter pilih · Esc tutup</p>
              <p className="text-[10px] text-gray-700 font-heading">NJIRLAH AI</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
