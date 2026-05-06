"use client";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Check, Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import { useWorkspaceStore } from "@/store/workspace";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-400",
  building: "bg-blue-400 animate-pulse",
  ready: "bg-emerald-400",
  error: "bg-red-400",
};

interface Props {
  projectId: string;
  onBack: () => void;
}

export function WorkspaceTopBar({ projectId, onBack }: Props) {
  const project = useWorkspaceStore((s) => s.project);
  const renameProject = useWorkspaceStore((s) => s.renameProject);
  const isBuilding = useWorkspaceStore((s) => s.isBuilding);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const startEdit = () => {
    setDraft(project?.name || "");
    setEditing(true);
  };

  const confirmRename = async () => {
    if (!draft.trim()) return setEditing(false);
    setSaving(true);
    await renameProject(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleShare = async () => {
    if (!projectId) {
      toast.error("Project not ready");
      return;
    }
    setSharing(true);
    try {
      const res = await fetch("/api/public/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = (await res.json()) as { shareUrl?: string };
      if (data.shareUrl) {
        navigator.clipboard.writeText(data.shareUrl);
        toast.success("Share link copied!");
      }
    } catch (e) {
      toast.error("Failed to create share link");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.07] bg-[#040706]/80 backdrop-blur-sm shrink-0">
      <motion.button
        onClick={onBack}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.92 }}
        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition"
        title="Kembali ke Home"
      >
        <ArrowLeft className="h-4 w-4" />
      </motion.button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Status dot */}
        {project && (
          <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_COLOR[project.status] || "bg-gray-500"}`} />
        )}

        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={confirmRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmRename();
              if (e.key === "Escape") setEditing(false);
            }}
            className="flex-1 min-w-0 bg-transparent border-b border-[#18C493]/60 outline-none text-sm text-white font-medium"
          />
        ) : (
          <span className="text-sm font-medium text-white truncate flex-1 min-w-0">
            {project?.name || "Workspace"}
          </span>
        )}

        {!editing && (
          <motion.button
            onClick={startEdit}
            whileHover={{ scale: 1.1 }}
            className="shrink-0 h-5 w-5 flex items-center justify-center text-gray-600 hover:text-gray-300 transition"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pencil className="h-3 w-3" />}
          </motion.button>
        )}

        {editing && !saving && (
          <motion.button onClick={confirmRename} whileTap={{ scale: 0.9 }} className="shrink-0">
            <Check className="h-3.5 w-3.5 text-[#18C493]" />
          </motion.button>
        )}
      </div>

      {/* Kind badge — hidden on xs */}
      {project && (
        <span className="hidden sm:inline shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-gray-400 font-medium capitalize">
          {project.kind}
        </span>
      )}

      {isBuilding && (
        <div className="shrink-0 flex items-center gap-1.5 text-xs text-blue-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="hidden sm:inline">Building...</span>
        </div>
      )}

      {/* Share button */}
      <motion.button
        onClick={handleShare}
        disabled={sharing || !project?.id}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="shrink-0 h-7 px-2.5 flex items-center gap-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-medium text-gray-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Share project"
      >
        <Share2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Share</span>
      </motion.button>
    </div>
  );
}
