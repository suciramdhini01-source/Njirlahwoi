'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Plus, MessageSquare, Key, ChevronLeft, ChevronRight,
  Search, Settings2, Pin, Star, X,
} from 'lucide-react';
import Link from 'next/link';
import { useChatStore } from '@/store/chat-store';
import { useApiKeyStore } from '@/store/api-key-store';
import HoldToDelete from '@/components/ui/HoldToDelete';

interface SidebarProps {
  onOpenApiKey: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/* ── Swipe+Hold chat row ──────────────────────────────────────────── */
function ChatRow({
  chat, isActive, onSelect, onDelete, index,
}: {
  chat: { id: string; title: string; pinned?: boolean; favorited?: boolean };
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  index: number;
}) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-72, -12], [1, 0]);
  const rowBg = useTransform(x, [-72, 0], ['rgba(239,68,68,0.18)', 'rgba(0,0,0,0)']);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -60, scale: 0.92 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300, delay: Math.min(index * 0.035, 0.25) }}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Delete bg */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-3 rounded-xl pointer-events-none"
        style={{ background: rowBg }}
      >
        <motion.div style={{ opacity: deleteOpacity }} className="pointer-events-auto">
          <HoldToDelete onDelete={onDelete} />
        </motion.div>
      </motion.div>

      {/* Draggable row */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -72, right: 0 }}
        dragElastic={0.06}
        style={{ x }}
        onDragEnd={(_, info) => { if (info.offset.x >= -50) x.set(0); }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelect}
        className={`relative flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-xl transition-colors ${
          isActive
            ? 'bg-neon-purple/15 border border-neon-purple/20'
            : 'hover:bg-white/5 border border-transparent'
        }`}
      >
        <MessageSquare size={12} className={isActive ? 'text-neon-purple flex-shrink-0' : 'text-gray-600 flex-shrink-0'} />
        <span className="text-xs text-white/70 truncate flex-1 leading-snug">
          {chat.title === 'New Chat' ? 'Chat Baru' : chat.title}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {chat.pinned && <Pin size={9} className="text-neon-purple/60 fill-neon-purple/40" />}
          {chat.favorited && <Star size={9} className="text-yellow-400/60 fill-yellow-400/40" />}
          {isActive && (
            <motion.div
              className="w-1 h-1 rounded-full bg-neon-purple ml-0.5"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Section label ────────────────────────────────────────────────── */
function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 pb-1 pt-2">
      <span className="text-gray-700">{icon}</span>
      <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">{label}</span>
    </div>
  );
}

/* ── Main Sidebar ──────────────────────────────────────────────────── */
export default function Sidebar({ onOpenApiKey, mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const { chats, activeChatId, createChat, deleteChat, setActiveChat } = useChatStore();
  const { hasKey } = useApiKeyStore();

  const filtered = search
    ? chats.filter((c) => (c.title === 'New Chat' ? 'Chat Baru' : c.title).toLowerCase().includes(search.toLowerCase()))
    : chats;

  const pinned = filtered.filter((c) => c.pinned);
  const favorited = filtered.filter((c) => !c.pinned && c.favorited);
  const recent = filtered.filter((c) => !c.pinned && !c.favorited);

  const SidebarContent = (
    <div className="flex flex-col h-full">
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
                className="text-lg flex-shrink-0 select-none"
              >
                🦄
              </motion.span>
              <span className="font-black text-sm font-heading gradient-text truncate">NJIRLAH AI</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          {/* Mobile close */}
          {mobileOpen && onMobileClose && (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
              <X size={14} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </motion.button>
        </div>
      </div>

      {/* ── New Chat ── */}
      <div className="p-2 border-b border-white/10">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
          onClick={() => { createChat(); onMobileClose?.(); }}
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
                Chat Baru
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Search ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0"
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

      {/* ── Chat list ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {/* Empty state */}
        {chats.length === 0 && !collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center px-2"
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-4xl mb-3 select-none"
            >
              🦄
            </motion.div>
            <p className="text-xs font-medium text-gray-500 mb-1">Mulai percakapan pertamamu</p>
            <p className="text-[10px] text-gray-700">Klik "Chat Baru" di atas!</p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {!collapsed && (
            <>
              {/* Pinned */}
              {pinned.length > 0 && (
                <div>
                  <SectionLabel icon={<Pin size={9} />} label="Disematkan" />
                  {pinned.map((chat, i) => (
                    <ChatRow key={chat.id} chat={chat} isActive={chat.id === activeChatId} index={i}
                      onSelect={() => { setActiveChat(chat.id); onMobileClose?.(); }}
                      onDelete={() => deleteChat(chat.id)} />
                  ))}
                </div>
              )}

              {/* Favorited */}
              {favorited.length > 0 && (
                <div>
                  <SectionLabel icon={<Star size={9} />} label="Favorit" />
                  {favorited.map((chat, i) => (
                    <ChatRow key={chat.id} chat={chat} isActive={chat.id === activeChatId} index={i}
                      onSelect={() => { setActiveChat(chat.id); onMobileClose?.(); }}
                      onDelete={() => deleteChat(chat.id)} />
                  ))}
                </div>
              )}

              {/* Recent */}
              {recent.length > 0 && (
                <div>
                  {(pinned.length > 0 || favorited.length > 0) && (
                    <SectionLabel icon={<MessageSquare size={9} />} label="Terbaru" />
                  )}
                  {recent.map((chat, i) => (
                    <ChatRow key={chat.id} chat={chat} isActive={chat.id === activeChatId} index={i}
                      onSelect={() => { setActiveChat(chat.id); onMobileClose?.(); }}
                      onDelete={() => deleteChat(chat.id)} />
                  ))}
                </div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Collapsed icon list */}
        {collapsed && (
          <div className="flex flex-col items-center gap-1 pt-1">
            {chats.slice(0, 8).map((c) => (
              <motion.button key={c.id} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
                onClick={() => setActiveChat(c.id)}
                className={`p-1.5 rounded-lg transition-colors ${c.id === activeChatId ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-600 hover:text-gray-300'}`}
              >
                <MessageSquare size={13} />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom actions ── */}
      <div className="p-2 border-t border-white/10 space-y-1 flex-shrink-0">
        {/* API NJIR */}
        <Link href="/api-njir" className="block" onClick={onMobileClose}>
          <motion.div
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
            className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-gray-500 hover:text-neon-cyan hover:bg-neon-cyan/5 border border-transparent hover:border-neon-cyan/15 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          >
            <Settings2 size={14} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-xs overflow-hidden">
                  <span className="whitespace-nowrap">API NJIR</span>
                  <span className="px-1 py-0.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded text-[8px] text-neon-cyan font-bold leading-none">NEW</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>

        {/* API Keys */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
          onClick={() => { onOpenApiKey(); onMobileClose?.(); }}
          className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
            hasKey()
              ? 'text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/10'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <Key size={14} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-xs overflow-hidden">
                <span className="whitespace-nowrap">API Keys</span>
                {hasKey() && (
                  <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-neon-cyan flex-shrink-0" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.div
        animate={{ width: collapsed ? 52 : 256 }}
        transition={{ type: 'spring', damping: 26, stiffness: 250 }}
        className="hidden md:flex flex-col h-full glass border-r border-white/10 flex-shrink-0 overflow-hidden relative z-10"
      >
        {SidebarContent}
      </motion.div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="md:hidden fixed inset-y-0 left-0 w-[280px] glass border-r border-white/10 z-50 flex flex-col overflow-hidden"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
