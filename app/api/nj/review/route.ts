import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

export const dynamic = "force-dynamic";

interface FileResult { path: string; content: string; }
interface ReviewIssue { path: string; severity: "error" | "warning" | "info"; message: string; line?: number; }

const KNOWN_PACKAGES = new Set(["react", "react-dom", "next", "framer-motion", "zustand", "tailwindcss", "@supabase/supabase-js", "lucide-react", "clsx", "tailwind-merge", "class-variance-authority", "@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs", "canvas-confetti", "jszip", "nanoid", "date-fns", "zod", "react-hook-form", "@hookform/resolvers", "sonner"]);

function staticReview(files: FileResult[]): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  for (const f of files) {
    const lines = f.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const importMatch = line.match(/^import\s+.*\s+from\s+['"]([^'"@./][^'"]*)['"]/);
      if (importMatch) {
        const pkg = importMatch[1].split("/")[0];
        if (!KNOWN_PACKAGES.has(pkg) && !pkg.startsWith("@/")) {
          issues.push({ path: f.path, severity: "warning", message: `Unknown import "${pkg}" — verify it's installed`, line: i + 1 });
        }
      }
      if (line.includes("console.log(") && !f.path.includes("util")) {
        issues.push({ path: f.path, severity: "info", message: "Remove console.log before production", line: i + 1 });
      }
      if (line.includes("localhost:") && !f.path.endsWith(".md")) {
        issues.push({ path: f.path, severity: "warning", message: 'Hardcoded "localhost" URL — use env variable', line: i + 1 });
      }
    }
    if (f.content.includes(".map(") && !f.content.includes("key=")) {
      issues.push({ path: f.path, severity: "warning", message: "List render (.map) found but no `key` prop detected" });
    }
  }
  return issues;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, sessionId, files, byok } = body;
    if (!Array.isArray(files) || !sessionId) return NextResponse.json({ error: "Missing files or sessionId" }, { status: 400 });

    if (projectId) {
      await query(
        "INSERT INTO nj_project_steps (project_id, session_id, role, status, input_json, order_idx) VALUES ($1, $2, $3, $4, $5, $6)",
        [projectId, sessionId, "reviewer", "running", JSON.stringify({ fileCount: files.length }), 3]
      ).catch(() => {});
    }

    const start = Date.now();
    const staticIssues = staticReview(files);

    let llmIssues: ReviewIssue[] | null = null;
    if (byok?.source === "openrouter" && byok.apiKey) {
      const filesSummary = files.slice(0, 6).map((f: FileResult) => `--- ${f.path} ---\n${f.content.slice(0, 600)}`).join("\n\n");
      const sys = `You are a code reviewer. Review files for: broken imports, missing key props, console.logs, hardcoded URLs, type safety. Reply with ONLY valid JSON: {"issues":[{"path":"","severity":"error|warning|info","message":"","line":1}]}. Max 10 issues.`;
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${byok.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: byok.modelId || "meta-llama/llama-3.3-70b-instruct:free", messages: [{ role: "system", content: sys }, { role: "user", content: `Review:\n${filesSummary}` }], temperature: 0.2, response_format: { type: "json_object" } }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) { try { const obj = JSON.parse(text); if (Array.isArray(obj?.issues)) llmIssues = obj.issues.slice(0, 10); } catch {} }
        }
      } catch {}
    }

    const merged: ReviewIssue[] = [...staticIssues];
    if (llmIssues) {
      for (const li of llmIssues) {
        if (!merged.find((s) => s.path === li.path && s.message === li.message)) merged.push(li);
      }
    }
    const source = llmIssues ? "llm+static" : "static";

    if (projectId) {
      await query(
        "UPDATE nj_project_steps SET status = $1, output_json = $2, latency_ms = $3, updated_at = NOW() WHERE project_id = $4 AND role = $5",
        [merged.some((i) => i.severity === "error") ? "error" : "done", JSON.stringify({ issues: merged, source }), Date.now() - start, projectId, "reviewer"]
      ).catch(() => {});
    }

    return NextResponse.json({ issues: merged, source });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
