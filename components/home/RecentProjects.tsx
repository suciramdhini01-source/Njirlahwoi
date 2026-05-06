"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Clock, Trash2, Layers, Smartphone, FileText, AlertCircle, CheckCircle2, Loader2, FileCode2 } from "lucide-react";
import { useWorkspaceStore, WsProject } from "@/store/workspace";
import { formatDistanceToNowStrict } from "date-fns";

const KIND_ICON = {
  fullstack: Layers,
  mobile: Smartphone,
  landing: FileText,
};

const STATUS_META = {
  draft: { label: "Draft", color: "text-gray-400", bg: "bg-gray-400/10 border-gray-500/20" },
  building: { label: "Building", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-500/20" },
  ready: { label: "Ready", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-500/20" },
  error: { label: "Error", color: "text-red-400", bg: "bg-red-400/10 border-red-500/20" },
};

function ProjectCard({ project, onOpen, onDelete }: {
  project: WsProject;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const KindIcon = KIND_ICON[project.kind] || FileCode2;
  const meta = STATUS_META[project.status] || STATUS_META.draft;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group relative rounded-xl border border-white/[0.07] bg-[#070b09]/70 p-4 cursor-pointer hover:border-[#18C493]/30 hover:bg-[#080d0b] transition"
      onClick={onOpen}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
        style={{ background: "radial-gradient(300px circle at 0% 0%, rgba(24,196,147,0.08), transparent 70%)" }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center bg-[#18C493]/10 border border-[#18C493]/20 shrink-0">
            <KindIcon className="h-3.5 w-3.5 text-[#18C493]" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white truncate">{project.name}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
              {project.prompt.slice(0, 80)}{project.prompt.length > 80 ? "…" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-400/10 transition opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div className="relative flex items-center gap-2 mt-3">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
        <span className="text-[10px] text-gray-600 flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {formatDistanceToNowStrict(new Date(project.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </motion.div>
  );
}

export function RecentProjects() {
  const recent = useWorkspaceStore((s) => s.recent);
  const recentLoaded = useWorkspaceStore((s) => s.recentLoaded);
  const deleteProject = useWorkspaceStore((s) => s.deleteProject);
  const router = useRouter();

  if (!recentLoaded) return null;
  if (recent.length === 0) return null;

  return (
    <section className="relative px-6 pb-8">
      <div className="max-w-[720px] mx-auto">
        <motion.h3
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3"
        >
          Recent Projects
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AnimatePresence>
            {recent.slice(0, 6).map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => router.push(`/workspace/${p.id}`)}
                onDelete={() => deleteProject(p.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
