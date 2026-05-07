'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Plus, MessageSquare, Key, ChevronLeft, ChevronRight,
  Search, Settings2, Pin, Star, X, Zap,
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
  const rowBg = useTransform(x, [-72, 0], ['rgba(255,59,48,0.15)', 'rgba(0,0,0,0)']);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.92 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300, delay: Math.min(index * 0.03, 0.22) }}
      className="relative overflow-hidden rounded-xl"
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-3 rounded-xl pointer-events-none"
        style={{ background: rowBg }}
      >
        <motion.div style={{ opacity: deleteOpacity }} className="pointer-events-auto">
          <HoldToDelete onDelete={onDelete} />
        </motion.div>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -72, right: 0 }}
        dragElastic={0.06}
        style={{ x }}
        onDragEnd={(_, info) => { if (info.offset.x >= -50) x.set(0); }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelect}
        className={`relative flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-brand-blue/10 border border-brand-blue/20'
            : 'hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        <MessageSquare
          size={12}
          className={`flex-shrink-0 transition-colors ${isActive ? 'text-brand-blue' : 'text-white/30'}`}
        />
        <span className="text-xs text-white/70 truncate flex-1 leading-snug">
          {chat.title === 'New Chat' ? 'Chat Baru' : chat.title}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {chat.pinned && <Pin size={9} className="text-brand-amber/70 fill-brand-amber/40" />}
          {chat.favorited && <Star size={9} className="text-brand-pistachio/70 fill-brand-pistachio/40" />}
          {isActive && (
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-brand-blue ml-0.5"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionLabel({ icon, label, color = 'text-white/25' }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 pb-1 pt-2.5">
      <span className={color}>{icon}</span>
      <span className={`text-[9px] font-bold uppercase tracking-widest ${color}`}>{label}</span>
    </div>
  );
}

export default function Sidebar({ onOpenApiKey, mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const { chats, activeChatId, createChat, deleteChat, setActiveChat } = useChatStore();
  const { hasKey } = useApiKeyStore();

  const filtered = search
    ? chats.filter((c) => (c.title === 'New Chat' ? 'Chat Baru' : c.title).toLowerCase().includes(search.toLowerCase()))
    : chats;

  const pinned    = filtered.filter((c) => c.pinned);
  const favorited = filtered.filter((c) => !c.pinned && c.favorited);
  const recent    = filtered.filter((c) => !c.pinned && !c.favorited);

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06] flex-shrink-0">
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
          {mobileOpen && onMobileClose && (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors">
              <X size={14} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/8 transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </motion.button>
        </div>
      </div>

      {/* ── New Chat ── */}
      <div className="p-2 border-b border-white/[0.06]">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
          onClick={() => { createChat(); onMobileClose?.(); }}
          className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl bg-brand-green/10 border border-brand-green/25 text-brand-green hover:bg-brand-green/18 transition-all ${collapsed ? 'justify-center' : ''}`}
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
              <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl px-2.5 py-1.5 border border-white/[0.06]">
                <Search size={11} className="text-white/25 flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari chat..."
                  className="flex-1 bg-transparent text-xs text-white/70 placeholder-white/20 outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat list ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
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
            <p className="text-xs font-medium text-white/30 mb-1">Mulai percakapan pertamamu</p>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => createChat()}
              className="mt-2 px-4 py-1.5 rounded-xl bg-brand-green/10 border border-brand-green/25 text-brand-green text-xs"
            >
              Chat Baru
            </motion.button>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {!collapsed && (
            <>
              {pinned.length > 0 && (
                <div>
                  <SectionLabel icon={<Pin size={9} />} label="Disematkan" color="text-brand-amber/60" />
                  {pinned.map((chat, i) => (
                    <ChatRow key={chat.id} chat={chat} isActive={chat.id === activeChatId} index={i}
                      onSelect={() => { setActiveChat(chat.id); onMobileClose?.(); }}
                      onDelete={() => deleteChat(chat.id)} />
                  ))}
                </div>
              )}
              {favorited.length > 0 && (
                <div>
                  <SectionLabel icon={<Star size={9} />} label="Favorit" color="text-brand-pistachio/60" />
                  {favorited.map((chat, i) => (
                    <ChatRow key={chat.id} chat={chat} isActive={chat.id === activeChatId} index={i}
                      onSelect={() => { setActiveChat(chat.id); onMobileClose?.(); }}
                      onDelete={() => deleteChat(chat.id)} />
                  ))}
                </div>
              )}
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

        {collapsed && (
          <div className="flex flex-col items-center gap-1 pt-1">
            {chats.slice(0, 8).map((c) => (
              <motion.button key={c.id} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
                onClick={() => setActiveChat(c.id)}
                className={`p-1.5 rounded-lg transition-colors ${c.id === activeChatId ? 'bg-brand-blue/15 text-brand-blue' : 'text-white/25 hover:text-white/60'}`}
              >
                <MessageSquare size={13} />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom actions ── */}
      <div className="p-2 border-t border-white/[0.06] space-y-1 flex-shrink-0">
        <Link href="/api-njir" className="block" onClick={onMobileClose}>
          <motion.div
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
            className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-white/35 hover:text-brand-blue hover:bg-brand-blue/8 border border-transparent hover:border-brand-blue/15 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          >
            <Zap size={14} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-xs overflow-hidden">
                  <span className="whitespace-nowrap">API NJIR</span>
                  <span className="px-1.5 py-0.5 bg-brand-blue/12 border border-brand-blue/20 rounded text-[8px] text-brand-blue font-bold leading-none">BETA</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
          onClick={() => { onOpenApiKey(); onMobileClose?.(); }}
          className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
            hasKey()
              ? 'text-brand-green border border-brand-green/20 hover:bg-brand-green/8'
              : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <Key size={14} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-xs overflow-hidden">
                <span className="whitespace-nowrap">API Keys</span>
                {hasKey() && (
                  <motion.span
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-brand-green flex-shrink-0"
                  />
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
      <motion.div
        animate={{ width: collapsed ? 52 : 256 }}
        transition={{ type: 'spring', damping: 26, stiffness: 250 }}
        className="hidden md:flex flex-col h-full glass-sm border-r border-white/[0.06] flex-shrink-0 overflow-hidden relative z-10"
      >
        {SidebarContent}
      </motion.div>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="md:hidden fixed inset-y-0 left-0 w-[280px] glass border-r border-white/[0.08] z-50 flex flex-col overflow-hidden"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
