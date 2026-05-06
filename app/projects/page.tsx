"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FolderOpen, Play, GitFork, Trash2, Clock, CheckCircle2,
  AlertCircle, Loader2, Layers, Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase, getSessionId } from "@/lib/supabase";
import { useAgentStore } from "@/store/agent";

interface ProjectRow {
  id: string;
  name: string;
  kind: "fullstack" | "mobile" | "landing";
  prompt: string;
  status: "clarifying" | "building" | "ready" | "error";
  created_at: string;
  updated_at: string;
}

interface RunSummary {
  id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
}

const KIND_LABELS: Record<string, string> = {
  fullstack: "Full Stack",
  mobile: "Mobile",
  landing: "Landing Page",
};

const STATUS_META: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  clarifying: { label: "Clarifying", color: "#3b82f6", Icon: Loader2 },
  building:   { label: "Building",   color: "#f59e0b", Icon: Loader2 },
  ready:      { label: "Ready",      color: "#22c55e", Icon: CheckCircle2 },
  error:      { label: "Error",      color: "#ef4444", Icon: AlertCircle },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [runs, setRuns] = useState<Record<string, RunSummary[]>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const resetAgent = useAgentStore((s) => s.reset);
  const setPlan = useAgentStore((s) => s.setPlan);

  useEffect(() => {
    const sessionId = getSessionId();
    supabase
      .from("nj_projects")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects((data as ProjectRow[]) || []);
        setLoading(false);
        // Fetch run summaries
        if (data && data.length > 0) {
          const ids = data.map((p: any) => p.id);
          supabase
            .from("nj_project_runs")
            .select("id, status, started_at, ended_at, project_id")
            .in("project_id", ids)
            .order("started_at", { ascending: false })
            .then(({ data: runData }) => {
              const grouped: Record<string, RunSummary[]> = {};
              for (const run of runData || []) {
                const pid = (run as any).project_id;
                if (!grouped[pid]) grouped[pid] = [];
                grouped[pid].push(run as RunSummary);
              }
              setRuns(grouped);
            });
        }
      });
  }, []);

  const resume = async (project: ProjectRow) => {
    resetAgent();
    setPlan(null);

    // Load plan from latest done planner step
    const { data: stepData } = await supabase
      .from("nj_project_steps")
      .select("output_json")
      .eq("project_id", project.id)
      .eq("role", "planner")
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (stepData?.output_json?.plan) {
      setPlan(stepData.output_json.plan);
    }

    useAgentStore.getState().setPrompt(project.prompt);
    router.push("/agent");
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from("nj_projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  };

  return (
    <AppShell>
      <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-white tracking-tight">
              Projects
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              All generated projects from this session
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/clarify")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition"
          >
            <Plus className="h-4 w-4" />
            New Project
          </motion.button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
          </div>
        )}

        {!loading && projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
              <Layers className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Start by describing your app idea and let the Agent build it.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push("/clarify")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition"
            >
              <Plus className="h-4 w-4" />
              Create First Project
            </motion.button>
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence>
            {projects.map((project) => {
              const statusMeta = STATUS_META[project.status] ?? STATUS_META.ready;
              const { Icon: StatusIcon } = statusMeta;
              const projectRuns = runs[project.id] ?? [];
              const lastRun = projectRuns[0];

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] p-5 transition-all"
                >
                  {/* Kind badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <FolderOpen className="h-4.5 w-4.5 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-gray-400">
                        {KIND_LABELS[project.kind] || project.kind}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded border font-semibold flex items-center gap-0.5"
                        style={{ color: statusMeta.color, borderColor: `${statusMeta.color}40`, background: `${statusMeta.color}15` }}
                      >
                        <StatusIcon
                          className={`h-2.5 w-2.5 ${project.status === "building" ? "animate-spin" : ""}`}
                        />
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-[15px] font-semibold text-white mb-1 leading-snug truncate">
                    {project.name}
                  </h3>
                  <p className="text-[12px] text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                    {project.prompt}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(project.created_at)}
                    </span>
                    {lastRun && (
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {projectRuns.length} run{projectRuns.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => resume(project)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Resume
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => router.push(`/clarify`)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.1] text-gray-300 hover:bg-white/[0.06] text-xs font-medium transition"
                    >
                      <GitFork className="h-3.5 w-3.5" />
                      Fork
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      className="flex items-center justify-center p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </AppShell>
  );
}
