"use client";
import { motion } from "framer-motion";
import { FileCode, FileText, FileJson, File as FileIcon, Loader2, CheckCircle2, Clock, AlertTriangle, Info } from "lucide-react";
import { AgentFile } from "@/types";
import { FileStatus } from "@/store/agent";

export interface ReviewIssue {
  path: string;
  severity: "error" | "warning" | "info";
  message: string;
  line?: number;
}

interface Props {
  files: AgentFile[];
  active: string | null;
  onSelect: (path: string) => void;
  fileStatuses?: Record<string, FileStatus>;
  reviewIssues?: ReviewIssue[];
}

export function FileTree({ files, active, onSelect, fileStatuses = {}, reviewIssues = [] }: Props) {
  const issueMap: Record<string, ReviewIssue[]> = {};
  for (const issue of reviewIssues) {
    if (!issueMap[issue.path]) issueMap[issue.path] = [];
    issueMap[issue.path].push(issue);
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {files.length === 0 && (
        <p className="text-xs text-gray-500 px-2 py-4">
          Belum ada file. Mulai generate untuk melihat kode muncul di sini.
        </p>
      )}
      {files.map((f) => {
        const Icon = pickIcon(f.path);
        const isActive = active === f.path;
        const status = fileStatuses[f.path] ?? "pending";
        const fileIssues = issueMap[f.path] ?? [];
        const hasError = fileIssues.some((i) => i.severity === "error");
        const hasWarning = fileIssues.some((i) => i.severity === "warning");
        return (
          <motion.button
            key={f.path}
            whileHover={{ x: 3 }}
            onClick={() => onSelect(f.path)}
            title={fileIssues.map((i) => `[${i.severity}] ${i.message}`).join("\n") || undefined}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
              isActive
                ? "bg-blue-500/15 text-white border border-blue-500/35"
                : "text-gray-300 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${
                isActive ? "text-blue-400" : "text-gray-400"
              }`}
            />
            <span className="truncate flex-1">{f.path}</span>
            {hasError && <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />}
            {!hasError && hasWarning && <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />}
            {!hasError && !hasWarning && fileIssues.length > 0 && <Info className="h-3 w-3 text-gray-500 shrink-0" />}
            <StatusIcon status={status} />
          </motion.button>
        );
      })}
    </div>
  );
}

function StatusIcon({ status }: { status: FileStatus }) {
  if (status === "streaming") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="shrink-0"
      >
        <Loader2 className="h-3 w-3 text-neon-cyan" />
      </motion.div>
    );
  }
  if (status === "done") {
    return <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />;
  }
  return <Clock className="h-3 w-3 text-gray-600 shrink-0" />;
}

function pickIcon(p: string) {
  if (/\.json$/.test(p)) return FileJson;
  if (/\.(tsx?|jsx?|css|html)$/.test(p)) return FileCode;
  if (/\.md$/.test(p)) return FileText;
  return FileIcon;
}
