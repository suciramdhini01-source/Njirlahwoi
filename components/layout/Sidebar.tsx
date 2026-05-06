'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, Key, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { useApiKeyStore } from '@/store/api-key-store';

interface SidebarProps {
  onOpenApiKey: () => void;
}

export default function Sidebar({ onOpenApiKey }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { chats, activeChatId, createChat, deleteChat, setActiveChat } = useChatStore();
  const { hasOpenrouterKey, hasCloudflareKey } = useApiKeyStore();

  return (
    <motion.div
      animate={{ width: collapsed ? 56 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex flex-col h-full glass border-r border-white/10 flex-shrink-0 overflow-hidden relative z-10"
    >
      <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <span className="text-lg">🦄</span>
              <span className="font-bold text-sm font-heading gradient-text">NJIRLAH AI</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="p-2 border-b border-white/10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => createChat()}
          className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20 text-neon-purple hover:bg-neon-purple/20 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <Plus size={15} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium"
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <AnimatePresence>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                chat.id === activeChatId
                  ? 'bg-neon-purple/15 border border-neon-purple/20'
                  : 'hover:bg-white/5'
              }`}
              onClick={() => setActiveChat(chat.id)}
            >
              <MessageSquare
                size={13}
                className={chat.id === activeChatId ? 'text-neon-purple flex-shrink-0' : 'text-gray-600 flex-shrink-0'}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-white/70 truncate flex-1"
                  >
                    {chat.title}
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {chats.length === 0 && !collapsed && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles size={20} className="text-neon-purple/40 mb-2" />
            <p className="text-xs text-gray-600">Belum ada chat</p>
            <p className="text-xs text-gray-700 mt-1">Mulai percakapan baru!</p>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-white/10 space-y-1">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenApiKey}
          className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
            hasOpenrouterKey() || hasCloudflareKey()
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
                className="flex items-center gap-1.5 text-xs"
              >
                <span>API Keys</span>
                {(hasOpenrouterKey() || hasCloudflareKey()) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}
