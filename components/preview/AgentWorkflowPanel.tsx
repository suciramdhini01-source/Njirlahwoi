"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Send, Eye, Save, GitFork, Terminal,
  Brain, Palette, Code2, SearchCheck,
} from "lucide-react";
import { AgentRole, AgentStep } from "@/types";
import { StepItem } from "./StepItem";
import { supabase } from "@/lib/supabase";

const ROLE_META: Record<AgentRole, { label: string; color: string; Icon: React.ElementType }> = {
  planner:  { label: "Planner",  color: "#3b82f6", Icon: Brain },
  designer: { label: "Designer", color: "#8b5cf6", Icon: Palette },
  coder:    { label: "Coder",    color: "#10b981", Icon: Code2 },
  reviewer: { label: "Reviewer", color: "#f59e0b", Icon: SearchCheck },
};

function roleMeta(role?: AgentRole) {
  if (!role) return null;
  return ROLE_META[role] ?? null;
}

function RoleBadge({ role }: { role: AgentRole }) {
  const meta = roleMeta(role);
  if (!meta) return null;
  const { label, color, Icon } = meta;
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border"
      style={{ color, borderColor: `${color}40`, background: `${color}15` }}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function dbRowToStep(row: any): AgentStep {
  return {
    id: row.id,
    role: row.role,
    title: row.role ? `${row.role.charAt(0).toUpperCase()}${row.role.slice(1)} Agent` : "Step",
    description: row.output_json?.plan?.summary || row.input_json?.prompt?.slice(0, 120) || row.role,
    status: row.status === "running" ? "running" : row.status === "done" ? "done" : row.status === "error" ? "error" : "pending",
    files: row.output_json?.plan?.files?.map((f: any) => f.path).slice(0, 4),
    startedAt: row.created_at ? new Date(row.created_at).getTime() : undefined,
    endedAt: row.updated_at && row.status === "done" ? new Date(row.updated_at).getTime() : undefined,
    tokens_in: row.tokens_in,
    tokens_out: row.tokens_out,
  };
}

const DEMO_STEPS: AgentStep[] = [
  {
    id: "demo-1", role: "planner",
    title: "Planner Agent",
    description: "Analyzing requirements, generating file tree and design tokens from your prompt",
    status: "done",
    files: ["app/page.tsx", "app/layout.tsx"],
    startedAt: Date.now() - 12000, endedAt: Date.now() - 9700,
  },
  {
    id: "demo-2", role: "designer",
    title: "Designer Agent",
    description: "Defining palette, typography, spacing scale and component patterns",
    status: "done",
    files: ["globals.css", "tailwind.config.ts"],
    startedAt: Date.now() - 9500, endedAt: Date.now() - 7200,
  },
  {
    id: "demo-3", role: "coder",
    title: "Coder Agent",
    description: "Streaming full source code for all target files per the Planner spec",
    status: "running",
    files: ["components/Hero.tsx", "components/Features.tsx"],
    startedAt: Date.now() - 4600,
  },
  {
    id: "demo-4", role: "reviewer",
    title: "Reviewer Agent",
    description: "Scanning imports, flagging broken dependencies, validating structure",
    status: "pending",
  },
];

export function AgentWorkflowPanel({
  steps: propSteps,
  projectId,
  onAsk,
  onRetryFile,
}: {
  steps?: AgentStep[];
  projectId?: string;
  onAsk?: (msg: string) => void;
  onRetryFile?: (filePath: string) => void;
}) {
  const [dbSteps, setDbSteps] = useState<AgentStep[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    supabase
      .from("nj_project_steps")
      .select("*")
      .eq("project_id", projectId)
      .order("order_idx", { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setDbSteps(data.map(dbRowToStep));
      });

    const channel = supabase
      .channel(`steps:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nj_project_steps",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as any;
          setDbSteps((prev) => {
            const idx = prev.findIndex((s) => s.id === row.id);
            const next = dbRowToStep(row);
            if (idx === -1) return [...prev, next];
            const copy = [...prev];
            copy[idx] = next;
            return copy;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const displaySteps =
    dbSteps.length > 0
      ? dbSteps
      : propSteps && propSteps.length > 0
      ? propSteps
      : DEMO_STEPS;

  const doneCount = displaySteps.filter((s) => s.status === "done").length;
  const totalCount = displaySteps.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const running = displaySteps.find((s) => s.status === "running");

  return (
    <div className="h-full flex flex-col bg-[#0d0d18]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.07]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-[17px] font-semibold text-white tracking-tight">
              Agent Workflow
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className={`h-1.5 w-1.5 rounded-full ${running ? "bg-blue-400" : doneCount === totalCount ? "bg-green-400" : "bg-gray-600"}`}
              />
              <p className="text-xs text-gray-400">
                {running
                  ? `${roleMeta(running.role as AgentRole)?.label || "Agent"} running...`
                  : doneCount === totalCount && totalCount > 0
                  ? "Build complete"
                  : "Waiting to start"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Terminal className="h-3.5 w-3.5" />
            <span>{doneCount}/{totalCount} steps</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Role pipeline chips */}
        <div className="flex items-center gap-2 mt-3">
          {(["planner", "designer", "coder", "reviewer"] as AgentRole[]).map((role) => {
            const meta = ROLE_META[role];
            const step = displaySteps.find((s) => s.role === role);
            const status = step?.status ?? "pending";
            return (
              <motion.div
                key={role}
                whileHover={{ y: -1 }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border transition-all ${
                  status === "done"
                    ? "opacity-100"
                    : status === "running"
                    ? "opacity-100"
                    : "opacity-35"
                }`}
                style={{
                  color: meta.color,
                  borderColor: `${meta.color}40`,
                  background: `${meta.color}15`,
                }}
              >
                <meta.Icon className="h-2.5 w-2.5" />
                {meta.label}
                {status === "running" && (
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full ml-0.5"
                    style={{ background: meta.color }}
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                )}
                {status === "done" && <span style={{ color: meta.color }}>✓</span>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto scrollbar-neon px-4 py-4">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="space-y-2"
        >
          <AnimatePresence>
            {displaySteps.map((s, i) => (
              <StepItem key={s.id} step={s} index={i + 1} onRetry={onRetryFile} roleBadge={s.role ? <RoleBadge role={s.role as AgentRole} /> : undefined} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/[0.07] space-y-3 bg-[#0a0a14]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) { onAsk?.(input.trim()); setInput(""); }
          }}
          className="flex items-center gap-2 border border-white/[0.12] rounded-xl px-3 py-2 bg-white/[0.03] focus-within:border-blue-500/50 transition"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the Agent about the next step..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.9 }}
            className={`p-1.5 rounded-lg transition ${
              input.trim() ? "text-blue-400 hover:bg-blue-500/20" : "text-gray-600 cursor-default"
            }`}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </form>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/[0.06] transition"
          >
            <Eye className="h-3.5 w-3.5" />
            View Plan
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/[0.06] transition"
          >
            <GitFork className="h-3.5 w-3.5" />
            Fork
          </motion.button>
        </div>
      </div>
    </div>
  );
}
