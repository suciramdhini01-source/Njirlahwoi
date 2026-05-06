'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Plus, MessageSquare, Trash2, Key, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { useApiKeyStore } from '@/store/api-key-store';

interface SidebarProps {
  onOpenApiKey: () => void;
}

function SwipeableChat({
  chat,
  isActive,
  onSelect,
  onDelete,
}: {
  chat: { id: string; title: string };
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const x = useMotionValue(0);
  const bg = useTransform(x, [-80, 0], ['rgba(239,68,68,0.3)', 'rgba(0,0,0,0)']);
  const iconOpacity = useTransform(x, [-80, -20], [1, 0]);

  return (
    <motion.div layout className="relative overflow-hidden rounded-xl">
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-4"
        style={{ background: bg }}
      >
        <motion.div style={{ opacity: iconOpacity }}>
          <Trash2 size={14} className="text-red-400" />
        </motion.div>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) onDelete();
          else x.set(0);
        }}
        className={`group relative flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
          isActive
            ? 'bg-neon-purple/15 border border-neon-purple/20'
            : 'hover:bg-white/5'
        }`}
        onClick={onSelect}
        whileTap={{ scale: 0.98 }}
      >
        <MessageSquare
          size={13}
          className={isActive ? 'text-neon-purple flex-shrink-0' : 'text-gray-600 flex-shrink-0'}
        />
        <span className="text-xs text-white/70 truncate flex-1">{chat.title}</span>
      </motion.div>
    </motion.div>
  );
}

export default function Sidebar({ onOpenApiKey }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { chats, activeChatId, createChat, deleteChat, setActiveChat } = useChatStore();
  const { hasKey } = useApiKeyStore();

  return (
    <motion.div
      animate={{ width: collapsed ? 52 : 256 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="flex flex-col h-full glass border-r border-white/10 flex-shrink-0 overflow-hidden relative z-10"
    >
      {/* Header */}
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
                animate={{ rotate: [0, 10, -10, 0] }}
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
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors ml-auto flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </motion.button>
      </div>

      {/* New Chat */}
      <div className="p-2 border-b border-white/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => createChat()}
          className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20 text-neon-purple hover:bg-neon-purple/20 transition-all ${collapsed ? 'justify-center' : ''}`}
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

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <AnimatePresence initial={false}>
          {!collapsed &&
            chats.map((chat) => (
              <SwipeableChat
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onSelect={() => setActiveChat(chat.id)}
                onDelete={() => deleteChat(chat.id)}
              />
            ))}
        </AnimatePresence>
        {collapsed && chats.length > 0 && (
          <div className="flex flex-col items-center gap-1 pt-1">
            {chats.slice(0, 5).map((c) => (
              <motion.button
                key={c.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveChat(c.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  c.id === activeChatId ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-600 hover:text-gray-300'
                }`}
              >
                <MessageSquare size={13} />
              </motion.button>
            ))}
          </div>
        )}
        {chats.length === 0 && !collapsed && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles size={20} className="text-neon-purple/40 mb-2" />
            </motion.div>
            <p className="text-xs text-gray-600">Belum ada chat</p>
            <p className="text-xs text-gray-700 mt-1">Mulai percakapan!</p>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="p-2 border-t border-white/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpenApiKey}
          className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
            hasKey()
              ? 'text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/10'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
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
                    animate={{ scale: [1, 1.3, 1] }}
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
