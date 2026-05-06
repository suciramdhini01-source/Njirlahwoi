'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Plus, MessageSquare, Key, ChevronLeft, ChevronRight, Sparkles, Search } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { useApiKeyStore } from '@/store/api-key-store';
import HoldToDelete from '@/components/ui/HoldToDelete';

interface SidebarProps {
  onOpenApiKey: () => void;
}

/* ── Swipe-left-to-reveal + Hold-to-delete row ─────────────────── */
function ChatRow({
  chat,
  isActive,
  onSelect,
  onDelete,
  index,
}: {
  chat: { id: string; title: string };
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  index: number;
}) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-70, -10], [1, 0]);
  const rowBg = useTransform(x, [-70, 0], ['rgba(239,68,68,0.18)', 'rgba(0,0,0,0)']);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -60, scale: 0.92 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300, delay: index * 0.04 }}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Delete bg */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-3 rounded-xl"
        style={{ background: rowBg }}
      >
        <motion.div style={{ opacity: deleteOpacity }}>
          <HoldToDelete onDelete={onDelete} />
        </motion.div>
      </motion.div>

      {/* Draggable row */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -70, right: 0 }}
        dragElastic={0.08}
        style={{ x }}
        onDragEnd={(_, info) => { if (info.offset.x < -50) { /* reveal only */ } else x.set(0); }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelect}
        className={`relative flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
          isActive
            ? 'bg-neon-purple/15 border border-neon-purple/20'
            : 'hover:bg-white/5 border border-transparent'
        }`}
      >
        <MessageSquare
          size={13}
          className={isActive ? 'text-neon-purple flex-shrink-0' : 'text-gray-600 flex-shrink-0'}
        />
        <span className="text-xs text-white/70 truncate flex-1">{chat.title}</span>
        {isActive && (
          <motion.div
            className="w-1 h-1 rounded-full bg-neon-purple flex-shrink-0"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Main Sidebar ──────────────────────────────────────────────── */
export default function Sidebar({ onOpenApiKey }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const { chats, activeChatId, createChat, deleteChat, setActiveChat } = useChatStore();
  const { hasKey } = useApiKeyStore();

  const filtered = search
    ? chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : chats;

  return (
    <motion.div
      animate={{ width: collapsed ? 52 : 256 }}
      transition={{ type: 'spring', damping: 26, stiffness: 250 }}
      className="flex flex-col h-full glass border-r border-white/10 flex-shrink-0 overflow-hidden relative z-10"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2 min-w-0"
            >
              <motion.span
                animate={{ rotate: [0, 12, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-lg flex-shrink-0"
              >
                🦄
              </motion.span>
              <span className="font-bold text-sm font-heading gradient-text truncate">NJIRLAH AI</span>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors ml-auto flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </motion.button>
      </div>

      {/* ── New Chat ── */}
      <div className="p-2 border-b border-white/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => createChat()}
          className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20 text-neon-purple hover:bg-neon-purple/20 transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Plus size={14} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xs font-medium whitespace-nowrap overflow-hidden"
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Search (when expanded) ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2 pt-2 pb-1">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-2.5 py-1.5">
                <Search size={11} className="text-gray-600 flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari chat..."
                  className="flex-1 bg-transparent text-xs text-white/70 placeholder-gray-700 outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat List ── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <AnimatePresence initial={false}>
          {!collapsed &&
            filtered.map((chat, i) => (
              <ChatRow
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                index={i}
                onSelect={() => setActiveChat(chat.id)}
                onDelete={() => deleteChat(chat.id)}
              />
            ))}
        </AnimatePresence>

        {/* Collapsed icons */}
        {collapsed && (
          <div className="flex flex-col items-center gap-1 pt-1">
            {chats.slice(0, 6).map((c) => (
              <motion.button
                key={c.id}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => setActiveChat(c.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  c.id === activeChatId
                    ? 'bg-neon-purple/20 text-neon-purple'
                    : 'text-gray-600 hover:text-gray-300'
                }`}
              >
                <MessageSquare size={13} />
              </motion.button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {chats.length === 0 && !collapsed && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles size={22} className="text-neon-purple/40 mb-2 mx-auto" />
            </motion.div>
            <p className="text-xs text-gray-600">Belum ada chat</p>
            <p className="text-xs text-gray-700 mt-0.5">Mulai percakapan!</p>
          </div>
        )}
      </div>

      {/* ── API Keys ── */}
      <div className="p-2 border-t border-white/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpenApiKey}
          className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
            hasKey()
              ? 'text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/10'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <Key size={14} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs overflow-hidden"
              >
                <span className="whitespace-nowrap">API Keys</span>
                {hasKey() && (
                  <motion.span
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-neon-cyan flex-shrink-0"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}
