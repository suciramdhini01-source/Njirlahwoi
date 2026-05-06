"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  GitCompare,
  Download,
  Sparkles,
  KeyRound,
  Settings,
  FileText,
  Terminal,
  Search,
} from "lucide-react";
import { useChatStore } from "@/store/chat";

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  run: (router: ReturnType<typeof useRouter>) => void;
}

const commands: Cmd[] = [
  {
    id: "new-chat",
    label: "Obrolan Baru",
    hint: "New chat",
    icon: MessageSquarePlus,
    run: (r) => {
      useChatStore.getState().newChat("gpt-5.4", "replit");
      r.push("/");
    },
  },
  {
    id: "compare",
    label: "Compare Model",
    icon: GitCompare,
    run: (r) => r.push("/compare"),
  },
  {
    id: "agent",
    label: "Agent Code Generator",
    icon: Terminal,
    run: (r) => r.push("/agent"),
  },
  {
    id: "preview",
    label: "App Preview",
    icon: FileText,
    run: (r) => r.push("/preview"),
  },
  {
    id: "api-key",
    label: "Kelola API Keys",
    icon: KeyRound,
    run: () => {
      window.dispatchEvent(new CustomEvent("nj:open-settings", { detail: "keys" }));
    },
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    run: () => {
      window.dispatchEvent(new CustomEvent("nj:open-settings"));
    },
  },
  {
    id: "export",
    label: "Export semua chat (JSON)",
    icon: Download,
    run: () => {
      const chats = useChatStore.getState().chats;
      const blob = new Blob([JSON.stringify(chats, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "njirlah-ai-chats.json";
      a.click();
      URL.revokeObjectURL(url);
    },
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-start justify-center pt-[12vh] bg-black/60 backdrop-blur"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-[min(560px,92vw)] rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <Search className="h-4 w-4 text-white/50" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari perintah..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <kbd className="text-[10px] text-white/40 border border-white/10 rounded px-1.5 py-0.5">
                ESC
              </kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto scrollbar-neon py-2">
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-sm text-white/40 text-center">
                  Tidak ada perintah.
                </p>
              )}
              {filtered.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      c.run(router);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition"
                  >
                    <Icon className="h-4 w-4 text-accent-a" />
                    <span className="text-sm flex-1">{c.label}</span>
                    {c.hint && (
                      <span className="text-[10px] text-white/40">{c.hint}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
