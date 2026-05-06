"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Cpu, Palette, FileCode2, LayoutGrid, Sparkles, Brain } from "lucide-react";
import { AgentPlan } from "@/store/agent";

interface Props {
  plan: AgentPlan;
  source?: string;
}

export function PlanSummaryPanel({ plan, source }: Props) {
  const [open, setOpen] = useState(false);

  const palette = plan.designTokens?.palette ?? {};
  const paletteEntries = Object.entries(palette).slice(0, 6);

  return (
    <div className="border border-white/[0.08] rounded-xl bg-[#0a0f1a]/80 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.04] transition"
      >
        <div className="h-6 w-6 rounded-md bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
          <Brain className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-white truncate">Planner Output</p>
          <p className="text-[10px] text-gray-500 truncate">{plan.summary?.slice(0, 72) || "Plan ready"}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {source && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
              source === "llm"
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                : "bg-gray-500/15 text-gray-400 border border-gray-500/20"
            }`}>
              {source === "llm" ? "AI" : "fallback"}
            </span>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-white/[0.06]">
              {/* Tech stack */}
              {plan.techStack?.length > 0 && (
                <div className="pt-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1.5">
                    <Cpu className="h-3 w-3" /> Tech Stack
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {plan.techStack.map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.07] text-gray-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Palette */}
              {paletteEntries.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1.5">
                    <Palette className="h-3 w-3" /> Palette
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {paletteEntries.map(([k, v]) => (
                      <div key={k} className="flex items-center gap-1">
                        <span
                          className="h-3 w-3 rounded-full border border-white/20 shrink-0"
                          style={{ background: v as string }}
                        />
                        <span className="text-[10px] text-gray-400 font-mono">{v as string}</span>
                      </div>
                    ))}
                  </div>
                  {plan.designTokens?.vibe && (
                    <p className="text-[10px] text-gray-500 mt-1.5 italic">{plan.designTokens.vibe.slice(0, 100)}</p>
                  )}
                </div>
              )}

              {/* File targets */}
              {plan.files?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1.5">
                    <FileCode2 className="h-3 w-3" /> Target Files ({plan.files.length})
                  </div>
                  <div className="space-y-1">
                    {plan.files.slice(0, 8).map((f) => (
                      <div key={f.path} className="flex items-start gap-1.5">
                        <span className="text-[10px] font-mono text-blue-400 shrink-0">{f.path}</span>
                        <span className="text-[10px] text-gray-500">— {f.purpose}</span>
                      </div>
                    ))}
                    {plan.files.length > 8 && (
                      <p className="text-[10px] text-gray-600">+{plan.files.length - 8} more files</p>
                    )}
                  </div>
                </div>
              )}

              {/* Pages */}
              {plan.pages?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1.5">
                    <LayoutGrid className="h-3 w-3" /> Pages
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.pages.map((p) => (
                      <span key={p.route} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono">
                        {p.route}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
