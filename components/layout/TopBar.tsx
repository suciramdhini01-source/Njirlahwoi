"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  MessageSquare,
  Code2,
  Monitor,
  GitCompare,
  Sparkles,
  Plug,
  Plus,
  X,
  ChevronDown,
  Check,
  Trash2,
  Rocket,
  FolderOpen,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "@/store/projects";

const TABS = [
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/api-njir", label: "API NJIR", icon: Plug },
];

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const activeId = useProjectStore((s) => s.activeId);
  const hydrated = useProjectStore((s) => s.hydrated);
  const hydrate = useProjectStore((s) => s.hydrate);
  const select = useProjectStore((s) => s.select);
  const remove = useProjectStore((s) => s.remove);
  const [wsOpen, setWsOpen] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);
  const activeProject = projects.find((p) => p.id === activeId) || null;

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const inProject = !!activeProject && (pathname === "/agent" || pathname === "/preview");

  return (
    <div className="relative z-30 flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] bg-[#060a09]/90 backdrop-blur-xl">
      {/* App Builder pill (workspace selector) */}
      <div className="relative" ref={wsRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setWsOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#18C493] to-[#14B489] text-[#052018] text-[12px] font-semibold shadow-[0_0_16px_rgba(24,196,147,0.35)]"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          App builder
          <ChevronDown className="h-3 w-3 opacity-80" />
        </motion.button>

        <AnimatePresence>
          {wsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="absolute top-full left-0 mt-2 w-[320px] rounded-xl bg-[#0a100d] border border-white/[0.08] shadow-2xl overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-3.5 w-3.5 text-[#18C493]" />
                  <span className="text-[12px] font-semibold text-white">Workspace</span>
                </div>
                <span className="text-[10px] text-gray-500">{projects.length} projek</span>
              </div>

              <div className="max-h-72 overflow-y-auto scrollbar-none">
                {projects.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[11px] text-gray-500 mb-3">Belum ada projek</p>
                    <Link href="/" onClick={() => setWsOpen(false)}>
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#18C493]/15 border border-[#18C493]/40 text-[11px] font-medium text-[#BFF5E0]"
                      >
                        <Plus className="h-3 w-3" /> Buat projek baru
                      </motion.div>
                    </Link>
                  </div>
                )}

                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      select(p.id);
                      setWsOpen(false);
                      router.push("/agent");
                    }}
                    className={`group w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.04] transition ${
                      activeId === p.id ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        p.status === "ready"
                          ? "bg-[#18C493]"
                          : p.status === "building"
                          ? "bg-amber-400 animate-pulse"
                          : p.status === "error"
                          ? "bg-red-400"
                          : "bg-gray-600"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {p.kind} · {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {activeId === p.id && <Check className="h-3 w-3 text-[#18C493]" />}
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(p.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                    </motion.span>
                  </button>
                ))}
              </div>

              <div className="border-t border-white/[0.06] p-2">
                <Link href="/" onClick={() => setWsOpen(false)}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-gray-300 hover:bg-white/[0.04]"
                  >
                    <Plus className="h-3 w-3" />
                    Projek baru
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link href="/">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.08] transition"
          title="Home"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </motion.div>
      </Link>

      <div className="mx-2 h-5 w-px bg-white/[0.08]" />

      {/* Tabs: Home + project tab (if active) + secondary nav */}
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
        <Link href="/">
          <TabChip
            icon={LayoutGrid}
            label="Home"
            active={pathname === "/"}
          />
        </Link>

        {activeProject && (
          <Link href="/agent">
            <TabChip
              icon={Code2}
              label={activeProject.name.toLowerCase()}
              active={pathname === "/agent" || pathname === "/preview"}
              closable
              onClose={() => select(null)}
            />
          </Link>
        )}

        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link key={t.href} href={t.href}>
              <TabChip icon={t.icon} label={t.label} active={active} />
            </Link>
          );
        })}

        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="h-7 w-7 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/[0.06] transition"
            aria-label="New tab"
          >
            <Plus className="h-3.5 w-3.5" />
          </motion.button>
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <AnimatePresence>
          {inProject && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-1.5"
            >
              <ActionButton href="/agent" active={pathname === "/agent"} icon={Code2} label="Code" />
              <ActionButton href="/preview" active={pathname === "/preview"} icon={Monitor} label="Preview" />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold bg-gradient-to-r from-[#18C493] to-[#14B489] hover:from-[#25DCA8] hover:to-[#18C493] text-[#052018] shadow-[0_0_18px_rgba(24,196,147,0.45)] transition"
              >
                <Rocket className="h-3 w-3" />
                Deploy
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabChip({
  icon: Icon,
  label,
  active,
  closable,
  onClose,
}: {
  icon: typeof Code2;
  label: string;
  active: boolean;
  closable?: boolean;
  onClose?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className={`relative flex items-center gap-2 pl-2.5 pr-2.5 py-1.5 rounded-md text-[12px] font-medium transition group cursor-pointer ${
        active ? "bg-[#0c1512] text-white" : "text-gray-400 hover:text-gray-100 hover:bg-white/[0.03]"
      }`}
    >
      {active ? (
        <motion.span
          layoutId="top-tab-dot"
          className="h-1.5 w-1.5 rounded-full bg-[#18C493] shadow-[0_0_8px_#18C493]"
        />
      ) : (
        <Icon className="h-3.5 w-3.5 opacity-70" />
      )}
      <span className="whitespace-nowrap">{label}</span>
      {closable && active && (
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose?.();
          }}
          className="ml-1 p-0.5 rounded text-gray-500 hover:text-white hover:bg-white/10 transition"
        >
          <X className="h-3 w-3" />
        </span>
      )}
    </motion.div>
  );
}

function ActionButton({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: typeof Code2;
  label: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition ${
          active
            ? "bg-white/[0.1] border border-white/[0.18] text-white"
            : "bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08]"
        }`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </motion.div>
    </Link>
  );
}
