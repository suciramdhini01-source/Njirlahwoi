'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Pin, Star, MoreHorizontal, Pencil, Trash2,
  Download, Check, X, Menu,
} from 'lucide-react';
import ModelSelector from '@/components/ui/ModelSelector';
import MultiStateBadge from '@/components/ui/MultiStateBadge';
import { useChatStore } from '@/store/chat-store';

interface HeaderProps {
  onOpenCommand?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

/* ── Editable chat title ─────────────────────────────────────────── */
function EditableTitle({ chatId, title }: { chatId: string; title: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const { renameChat } = useChatStore();

  useEffect(() => { setValue(title); }, [title]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) renameChat(chatId, trimmed);
    else setValue(title);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setValue(title); setEditing(false); }
        }}
        className="bg-white/5 border border-neon-purple/30 rounded-lg px-2 py-0.5 text-xs sm:text-sm text-white font-medium outline-none w-full max-w-[160px] sm:max-w-[220px]"
        maxLength={60}
      />
    );
  }

  return (
    <motion.button
      key={title}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1 text-xs sm:text-sm font-medium text-white/75 hover:text-white transition-colors max-w-[130px] sm:max-w-[220px]"
    >
      <span className="truncate">{title === 'New Chat' ? 'Chat Baru' : title}</span>
      <Pencil size={10} className="text-gray-700 group-hover:text-neon-purple transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100" />
    </motion.button>
  );
}

/* ── 3-dot context menu ──────────────────────────────────────────── */
function ChatMenu({
  chatId, isPinned, isFavorited, onPin, onFav, onDelete,
}: {
  chatId: string;
  isPinned?: boolean;
  isFavorited?: boolean;
  onPin: () => void;
  onFav: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const items = [
    {
      icon: <Pin size={12} className={isPinned ? 'fill-neon-purple text-neon-purple' : ''} />,
      label: isPinned ? 'Lepas Pin' : 'Sematkan Chat',
      action: () => { onPin(); setOpen(false); },
    },
    {
      icon: <Star size={12} className={isFavorited ? 'fill-yellow-400 text-yellow-400' : ''} />,
      label: isFavorited ? 'Hapus Favorit' : 'Tambah Favorit',
      action: () => { onFav(); setOpen(false); },
    },
    {
      icon: <Download size={12} />,
      label: 'Ekspor Chat',
      action: () => setOpen(false),
    },
    {
      icon: <Trash2 size={12} />,
      label: 'Hapus Chat',
      action: () => { onDelete(); setOpen(false); },
      danger: true,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-all"
      >
        <MoreHorizontal size={14} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            transition={{ type: 'spring', damping: 26, stiffness: 400 }}
            className="absolute right-0 top-full mt-1.5 w-44 glass border border-white/15 rounded-xl overflow-hidden shadow-2xl z-50"
          >
            {items.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors hover:bg-white/8 ${
                  item.danger ? 'text-red-400 hover:text-red-300' : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Logo ─────────────────────────────────────────────────────────── */
function Logo() {
  const [hovered, setHovered] = useState(false);
  const [easterEgg, setEasterEgg] = useState(false);
  const [clicks, setClicks] = useState(0);

  return (
    <motion.button
      onClick={() => {
        const n = clicks + 1;
        setClicks(n);
        if (n >= 3) { setEasterEgg(true); setClicks(0); setTimeout(() => setEasterEgg(false), 3200); }
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="relative flex items-center gap-1.5 select-none flex-shrink-0"
    >
      <motion.span
        className="text-lg sm:text-xl"
        animate={easterEgg ? { rotate: [0, 25, -25, 25, -25, 0], scale: [1, 1.5, 1.5, 1.5, 1.5, 1] } : {}}
        transition={{ duration: 0.9 }}
      >
        🦄
      </motion.span>
      {/* Only show text label on sm+ */}
      <span className="hidden sm:block font-black text-sm font-heading gradient-text whitespace-nowrap">
        NJIRLAH AI
      </span>
      <AnimatePresence>
        {easterEgg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute left-full ml-2 flex gap-0.5 whitespace-nowrap pointer-events-none z-50"
          >
            {['🌟', '✨', '💜', '🦄'].map((e, i) => (
              <motion.span key={i} animate={{ y: [0, -14, 0] }} transition={{ duration: 0.55, delay: i * 0.07, repeat: 4 }} className="text-sm">{e}</motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function Header({ onOpenCommand, onToggleSidebar }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const {
    isStreaming, selectedProvider, activeChatId, getActiveChat,
    setPinned, setFavorited, deleteChat, chats, setActiveChat,
  } = useChatStore();

  const activeChat = mounted ? getActiveChat() : null;
  const badgeState = isStreaming ? 'streaming' : 'online';
  const provider = selectedProvider === 'cloudflare' ? '☁️ CF' : '🔗 OR';

  const handleDelete = () => {
    if (!activeChatId) return;
    deleteChat(activeChatId);
    const remaining = chats.filter((c) => c.id !== activeChatId);
    if (remaining[0]) setActiveChat(remaining[0].id);
  };

  return (
    <div className="flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 border-b border-white/10 bg-[#0a0a14]/80 backdrop-blur-xl flex-shrink-0 relative z-10 gap-2">

      {/* ── LEFT: hamburger + logo + chat title ── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
        {/* Mobile hamburger */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleSidebar}
          aria-label="Buka sidebar"
          className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
        >
          <Menu size={16} />
        </motion.button>

        <Logo />

        {/* Divider — hidden on mobile */}
        {activeChat && <div className="w-px h-4 bg-white/10 flex-shrink-0 hidden sm:block" />}

        {/* Contextual chat title */}
        {activeChat && activeChatId && (
          <div className="flex items-center gap-1 min-w-0">
            <EditableTitle chatId={activeChatId} title={activeChat.title} />
          </div>
        )}
      </div>

      {/* ── RIGHT: actions + model + badge + ⌘K ── */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">

        {/* Pin + Fav — desktop only, in 3-dot on mobile */}
        {activeChat && activeChatId && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setPinned(activeChatId, !activeChat.pinned)}
              className={`hidden sm:flex p-1.5 rounded-lg transition-all ${
                activeChat.pinned
                  ? 'text-neon-purple bg-neon-purple/15 border border-neon-purple/20'
                  : 'text-gray-700 hover:text-gray-400 hover:bg-white/8'
              }`}
              title="Pin chat"
            >
              <Pin size={13} className={activeChat.pinned ? 'fill-neon-purple' : ''} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFavorited(activeChatId, !activeChat.favorited)}
              className={`hidden sm:flex p-1.5 rounded-lg transition-all ${
                activeChat.favorited
                  ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
                  : 'text-gray-700 hover:text-gray-400 hover:bg-white/8'
              }`}
              title="Favoritkan"
            >
              <Star size={13} className={activeChat.favorited ? 'fill-yellow-400' : ''} />
            </motion.button>

            <ChatMenu
              chatId={activeChatId}
              isPinned={activeChat.pinned}
              isFavorited={activeChat.favorited}
              onPin={() => setPinned(activeChatId, !activeChat.pinned)}
              onFav={() => setFavorited(activeChatId, !activeChat.favorited)}
              onDelete={handleDelete}
            />

            <div className="w-px h-4 bg-white/10 mx-0.5 hidden sm:block" />
          </>
        )}

        <ModelSelector />
        <MultiStateBadge state={badgeState} provider={provider} />

        {/* ⌘K — desktop only */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass text-gray-500 hover:text-neon-purple hover:border-neon-purple/30 transition-all border border-white/10"
          title="Command Palette (Ctrl+K)"
        >
          <Terminal size={12} />
          <kbd className="text-[9px] font-mono">⌘K</kbd>
        </motion.button>
      </div>
    </div>
  );
}
