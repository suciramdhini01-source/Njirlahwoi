"use client";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, FileCode2, RotateCw } from "lucide-react";
import { AgentStep } from "@/types";
import { ReactNode } from "react";

function CheckIcon({ done }: { done: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle
        cx="10" cy="10" r="9"
        stroke={done ? "#22c55e" : "#374151"}
        strokeWidth="1.5"
        fill={done ? "rgba(34,197,94,0.12)" : "transparent"}
      />
      {done && (
        <motion.path
          d="M6 10l3 3 5-5"
          stroke="#22c55e"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      )}
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="#4b5563" strokeWidth="1.5" />
      <motion.path
        d="M7 6h6M7 14h6M10 10V8M10 10l2 2.5M10 10l-2 2.5"
        stroke="#6b7280"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
    </svg>
  );
}

interface Props {
  step: AgentStep;
  index: number;
  roleBadge?: ReactNode;
  onRetry?: (filePath: string) => void;
}

export function StepItem({ step, index, roleBadge, onRetry }: Props) {
  const duration =
    step.startedAt && step.endedAt
      ? `${((step.endedAt - step.startedAt) / 1000).toFixed(1)}s`
      : step.status === "running"
      ? "running..."
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`relative rounded-xl border p-4 transition-all ${
        step.status === "running"
          ? "bg-blue-500/[0.06] border-blue-500/30"
          : step.status === "done"
          ? "bg-white/[0.03] border-white/10"
          : step.status === "error"
          ? "bg-red-500/[0.06] border-red-500/30"
          : "bg-white/[0.02] border-white/[0.06]"
      }`}
    >
      {step.status === "running" && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.08), transparent)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {step.status === "done" ? (
            <CheckIcon done />
          ) : step.status === "running" ? (
            <div className="h-5 w-5 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            </div>
          ) : step.status === "error" ? (
            <AlertCircle className="h-5 w-5 text-red-400" />
          ) : (
            <HourglassIcon />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white leading-snug flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-500 font-normal text-xs">#{index}</span>
              {roleBadge}
              {step.title}
            </p>
            {duration && (
              <span className={`text-[10px] shrink-0 font-mono ${
                step.status === "running" ? "text-blue-400" : "text-gray-500"
              }`}>
                {duration}
              </span>
            )}
          </div>

          {step.description && (
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{step.description}</p>
          )}

          {step.status === "error" && onRetry && step.files && step.files[0] && (
            <button
              onClick={() => onRetry(step.files![0])}
              className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-[10px] text-red-300 hover:bg-red-500/25 transition"
            >
              <RotateCw className="h-3 w-3" />
              Retry file
            </button>
          )}

          {step.files && step.files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {step.files.map((f) => (
                <motion.span
                  key={f}
                  whileHover={{ scale: 1.02 }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/25 text-[10px] text-blue-300 font-mono cursor-pointer hover:bg-blue-500/20 hover:border-blue-400/40 transition"
                >
                  <FileCode2 className="h-2.5 w-2.5" />
                  {f}
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
