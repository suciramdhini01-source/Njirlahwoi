"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  Plus,
  Gauge,
  Flame,
  Zap,
  Layers,
  Smartphone,
  Rocket,
  Bot,
} from "lucide-react";
import { useAgentPresetStore, AgentPreset, BUILTIN_PRESETS } from "@/store/agent-presets";

const ICONS: Record<string, typeof Gauge> = {
  Gauge,
  Flame,
  Zap,
  Layers,
  Smartphone,
  Rocket,
  Bot,
};

function TierBadge({ tier }: { tier: AgentPreset["tier"] }) {
  if (tier === "pro")
    return (
      <span className="px-1.5 py-[1px] rounded-full bg-amber-500/15 border border-amber-400/40 text-[8.5px] font-bold text-amber-300 uppercase tracking-wide">
        Pro
      </span>
    );
  if (tier === "beta")
    return (
      <span className="px-1.5 py-[1px] rounded-full bg-cyan-500/15 border border-cyan-400/40 text-[8.5px] font-bold text-cyan-300 uppercase tracking-wide">
        Beta
      </span>
    );
  return null;
}

export function AgentPicker() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeId = useAgentPresetStore((s) => s.activeId);
  const custom = useAgentPresetStore((s) => s.custom);
  const hydrate = useAgentPresetStore((s) => s.hydrate);
  const setActive = useAgentPresetStore((s) => s.setActive);
  const all = [...BUILTIN_PRESETS, ...custom];
  const active = all.find((p) => p.id === activeId) || BUILTIN_PRESETS[0];

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const ActiveIcon = ICONS[active.icon] || Bot;

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((v) => !v)}
        title="Agent"
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium border bg-white/[0.04] border-white/[0.08] text-gray-300 hover:bg-white/[0.08] transition"
      >
        <ActiveIcon className="h-3 w-3" style={{ color: active.accent }} />
        <span>{active.label}</span>
        <TierBadge tier={active.tier} />
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="absolute bottom-full mb-2 left-0 w-[340px] rounded-xl bg-[#0a100d] border border-white/[0.08] shadow-2xl overflow-hidden z-50"
          >
            <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-3.5 w-3.5 text-[#18C493]" />
                <span className="text-[12px] font-semibold text-white">Pilih Agent</span>
              </div>
              <span className="text-[10px] text-gray-500">{all.length} agent</span>
            </div>

            <div className="max-h-80 overflow-y-auto scrollbar-none py-1">
              {all.map((p) => {
                const Icon = ICONS[p.icon] || Bot;
                const isActive = activeId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActive(p.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-white/[0.04] transition ${
                      isActive ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    <div
                      className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 border"
                      style={{
                        background: `${p.accent}18`,
                        borderColor: `${p.accent}40`,
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: p.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[12px] font-semibold text-white truncate">
                          {p.label}
                        </p>
                        <TierBadge tier={p.tier} />
                        {!p.builtin && (
                          <span className="px-1.5 py-[1px] rounded-full bg-[#18C493]/15 border border-[#18C493]/40 text-[8.5px] font-bold text-[#9BF3D3] uppercase">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-gray-500 truncate">{p.tagline}</p>
                    </div>
                    {isActive && (
                      <Check className="h-3 w-3 text-[#18C493] mt-1.5 shrink-0" />
                    )}
                  </button>
                );
              })}

              {custom.length === 0 && (
                <p className="px-3 py-2 text-[10px] text-gray-600">
                  Belum ada custom agent.
                </p>
              )}
            </div>

            <div className="border-t border-white/[0.06] p-2">
              <Link href="/agents/new" onClick={() => setOpen(false)}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium text-[#18C493] hover:bg-[#18C493]/10"
                >
                  <Plus className="h-3 w-3" />
                  Buat agent baru
                </motion.div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
