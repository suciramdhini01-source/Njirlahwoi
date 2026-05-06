"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MessageSquare,
  Code2,
  Monitor,
  Key,
  Cloud,
  Check,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Plug,
  Layers,
} from "lucide-react";
import { ApiStatusBadge } from "./ApiStatusBadge";
import { useApiKeyStore } from "@/store/api-key";
import { useChatStore } from "@/store/chat";
import { NJIRLAHLogo } from "./Logo";

const NAV = [
  { href: "/", label: "Chat", icon: MessageSquare, glow: "neon-glow-purple", color: "text-neon-purple" },
  { href: "/compare", label: "Compare", icon: GitCompare, glow: "neon-glow-cyan", color: "text-neon-cyan" },
  { href: "/agent", label: "Agent Code", icon: Code2, glow: "neon-glow-pink", color: "text-neon-pink" },
  { href: "/preview", label: "App Preview", icon: Monitor, glow: "neon-glow-cyan", color: "text-neon-cyan" },
  { href: "/projects", label: "Projects", icon: Layers, glow: "neon-glow-cyan", color: "text-neon-cyan" },
  { href: "/api-njir", label: "API NJIR", icon: Plug, glow: "neon-glow-cyan", color: "text-neon-cyan" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const openrouterKey = useApiKeyStore((s) => s.openrouterKey);
  const cloudflareToken = useApiKeyStore((s) => s.cloudflareToken);
  const cloudflareAccountId = useApiKeyStore((s) => s.cloudflareAccountId);
  const setOpenrouterKey = useApiKeyStore((s) => s.setOpenrouterKey);
  const setCloudflare = useApiKeyStore((s) => s.setCloudflare);
  const hydrate = useApiKeyStore((s) => s.hydrate);
  const hydrated = useApiKeyStore((s) => s.hydrated);
  const chats = useChatStore((s) => s.chats);
  const activeId = useChatStore((s) => s.activeId);
  const selectChat = useChatStore((s) => s.selectChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const newChat = useChatStore((s) => s.newChat);
  const chatHydrate = useChatStore((s) => s.hydrate);
  const chatHydrated = useChatStore((s) => s.hydrated);

  const [or, setOr] = useState("");
  const [cfT, setCfT] = useState("");
  const [cfA, setCfA] = useState("");
  const [orSaved, setOrSaved] = useState(false);
  const [cfSaved, setCfSaved] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
    if (!chatHydrated) chatHydrate();
  }, [hydrate, hydrated, chatHydrate, chatHydrated]);
  useEffect(() => setOr(openrouterKey), [openrouterKey]);
  useEffect(() => setCfT(cloudflareToken), [cloudflareToken]);
  useEffect(() => setCfA(cloudflareAccountId), [cloudflareAccountId]);

  const saveOR = async () => {
    await setOpenrouterKey(or.trim());
    setOrSaved(true);
    setTimeout(() => setOrSaved(false), 1500);
  };
  const saveCF = async () => {
    await setCloudflare(cfT.trim(), cfA.trim());
    setCfSaved(true);
    setTimeout(() => setCfSaved(false), 1500);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 320 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="relative z-10 h-screen flex flex-col shrink-0 overflow-hidden glass-strong"
    >
      {/* Neon accent stripe */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{
          background: "linear-gradient(180deg, #A855F7, #06B6D4, #EC4899)",
          backgroundSize: "100% 200%",
        }}
        animate={{ backgroundPosition: ["0% 0%", "0% 200%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Logo + title */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 relative">
        <NJIRLAHLogo size={38} />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 min-w-0"
            >
              <h1 className="font-bold tracking-tight text-gradient-neon text-lg leading-none">
                NJIRLAH AI
              </h1>
              <p className="text-[10px] text-gray-400 mt-1 tracking-widest uppercase">
                BYOK · Multi-Model
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition relative"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 border-b border-white/10">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition overflow-hidden ${
                  active
                    ? "text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-purple/25 via-neon-cyan/20 to-neon-pink/25 border border-white/20"
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  />
                )}
                <Icon className={`h-5 w-5 relative shrink-0 ${active ? item.color : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="relative font-medium text-sm whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && !collapsed && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative ml-auto h-1.5 w-1.5 rounded-full bg-neon-pink shadow-[0_0_8px_#EC4899]"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <>
          <div className="px-3 pt-3 pb-1 flex justify-start">
            <ApiStatusBadge />
          </div>

          {/* API Keys */}
          <div className="p-3 space-y-3 border-b border-white/10">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-1.5">
                <Key className="h-3.5 w-3.5 text-neon-purple" />
                OpenRouter API Key
                <KeyDot active={!!openrouterKey} />
              </label>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  value={or}
                  onChange={(e) => setOr(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveOR()}
                  placeholder="sk-or-v1-..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-neon-purple transition min-w-0"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.04 }}
                  onClick={saveOR}
                  className="px-2.5 py-1.5 rounded-lg bg-neon-purple/20 border border-neon-purple/40 text-neon-purple hover:bg-neon-purple/30 transition text-xs shrink-0"
                >
                  {orSaved ? <Check className="h-3.5 w-3.5" /> : "Simpan"}
                </motion.button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-1.5">
                <Cloud className="h-3.5 w-3.5 text-neon-cyan" />
                Cloudflare Workers AI
                <KeyDot active={!!cloudflareToken && !!cloudflareAccountId} />
              </label>
              <input
                type="password"
                value={cfT}
                onChange={(e) => setCfT(e.target.value)}
                placeholder="API Token"
                className="w-full mb-1.5 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-neon-cyan transition"
              />
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={cfA}
                  onChange={(e) => setCfA(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveCF()}
                  placeholder="Account ID"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-neon-cyan transition min-w-0"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.04 }}
                  onClick={saveCF}
                  className="px-2.5 py-1.5 rounded-lg bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30 transition text-xs shrink-0"
                >
                  {cfSaved ? <Check className="h-3.5 w-3.5" /> : "Simpan"}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="p-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300">Riwayat Chat</span>
            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.08, rotate: 90 }}
              onClick={() => newChat("", "openrouter")}
              className="p-1.5 rounded-lg bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 hover:from-neon-purple/30 hover:to-neon-pink/30 border border-white/10 transition"
              aria-label="New chat"
            >
              <Plus className="h-3.5 w-3.5" />
            </motion.button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-neon px-3 pb-3 space-y-1.5">
            <AnimatePresence mode="popLayout">
              {chats.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-gray-500 text-center py-6"
                >
                  Belum ada riwayat. Yuk mulai ngobrol!
                </motion.p>
              )}
              {chats.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className={`group relative rounded-lg border transition cursor-pointer ${
                    activeId === c.id
                      ? "bg-gradient-to-r from-neon-purple/15 to-neon-pink/15 border-neon-purple/40"
                      : "bg-white/[0.02] border-white/10 hover:bg-white/5"
                  }`}
                >
                  <button onClick={() => selectChat(c.id)} className="w-full text-left px-3 py-2 pr-8">
                    <p className="text-xs font-medium truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{c.messages.length} pesan</p>
                  </button>
                  <button
                    onClick={() => deleteChat(c.id)}
                    className="absolute top-1/2 right-1.5 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition hover:text-red-400"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {collapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-2">
          <ApiStatusBadge collapsed />
        </div>
      )}
    </motion.aside>
  );
}

function KeyDot({ active }: { active: boolean }) {
  return (
    <motion.span
      animate={active ? { scale: [1, 1.35, 1], opacity: [1, 0.7, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
      className={`ml-auto h-1.5 w-1.5 rounded-full ${
        active ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]" : "bg-gray-600"
      }`}
    />
  );
}
