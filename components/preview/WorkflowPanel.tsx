"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Circle,
  AlertCircle,
  GitFork,
  Save,
  Eye,
} from "lucide-react";
import { AgentStep } from "@/types";

export function WorkflowPanel({
  steps,
  onAsk,
}: {
  steps: AgentStep[];
  onAsk?: (msg: string) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold tracking-tight">Agent Workflow</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Langkah-langkah yang dijalankan agent untuk membangun proyekmu.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-neon p-4 space-y-3">
        {steps.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-500">
            Belum ada aktivitas. Buka halaman Agent untuk mulai membangun.
          </div>
        )}
        <AnimatePresence initial={false}>
          {steps.map((s, i) => (
            <StepItem key={s.id} step={s} index={i + 1} />
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-white/10 space-y-3">
        <AskInput onAsk={onAsk} />
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1 }}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-lg glass hover:bg-white/10 transition"
          >
            <Eye className="h-3.5 w-3.5" /> View Proposed Plan
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-lg glass hover:bg-white/10 transition"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-lg glass hover:bg-white/10 transition"
          >
            <GitFork className="h-3.5 w-3.5" /> Fork
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function StepItem({ step, index }: { step: AgentStep; index: number }) {
  const Icon =
    step.status === "done"
      ? CheckCircle2
      : step.status === "running"
      ? Loader2
      : step.status === "error"
      ? AlertCircle
      : Circle;
  const color =
    step.status === "done"
      ? "text-green-400"
      : step.status === "running"
      ? "text-neon-cyan"
      : step.status === "error"
      ? "text-red-400"
      : "text-gray-500";
  const duration =
    step.startedAt && step.endedAt
      ? `${((step.endedAt - step.startedAt) / 1000).toFixed(1)}s`
      : step.status === "running"
      ? "berjalan..."
      : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass rounded-xl p-3"
    >
      <div className="flex items-start gap-3">
        <div className={`${color} shrink-0 mt-0.5`}>
          <Icon
            className={`h-5 w-5 ${
              step.status === "running" ? "animate-spin" : ""
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">
              Step {index}:{" "}
              <span className="font-normal text-gray-300">{step.title}</span>
            </p>
            {duration && (
              <span className="text-[10px] text-gray-500">{duration}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
          {step.files && step.files.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {step.files.map((f) => (
                <span
                  key={f}
                  className="px-2 py-0.5 rounded-md bg-neon-cyan/10 border border-neon-cyan/30 text-[10px] text-neon-cyan font-mono"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AskInput({ onAsk }: { onAsk?: (v: string) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = e.target as HTMLFormElement;
        const input = f.elements.namedItem("ask") as HTMLInputElement;
        if (input.value) {
          onAsk?.(input.value);
          input.value = "";
        }
      }}
      className="flex gap-2 glass rounded-xl p-1.5"
    >
      <input
        name="ask"
        placeholder="Ask the Agent about the next step..."
        className="flex-1 bg-transparent outline-none px-2 text-sm placeholder:text-gray-500"
      />
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink text-xs font-semibold"
      >
        Ask
      </button>
    </form>
  );
}
