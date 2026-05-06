import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FileResult {
  path: string;
  content: string;
}

interface ReviewIssue {
  path: string;
  severity: "error" | "warning" | "info";
  message: string;
  line?: number;
}

interface Body {
  projectId?: string;
  sessionId: string;
  files: FileResult[];
  byok?: {
    source?: "openrouter" | "cloudflare";
    apiKey?: string;
    cfToken?: string;
    cfAccountId?: string;
    modelId?: string;
  };
}

const KNOWN_PACKAGES = new Set([
  "react", "react-dom", "next", "framer-motion", "zustand",
  "tailwindcss", "@supabase/supabase-js", "lucide-react",
  "clsx", "tailwind-merge", "class-variance-authority",
  "@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs",
  "canvas-confetti", "jszip", "nanoid", "date-fns", "zod",
  "react-hook-form", "@hookform/resolvers", "sonner",
]);

function staticReview(files: FileResult[]): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const f of files) {
    const lines = f.content.split("\n");

    // Check for unknown imports
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const importMatch = line.match(/^import\s+.*\s+from\s+['"]([^'"@./][^'"]*)['"]/);
      if (importMatch) {
        const pkg = importMatch[1].split("/")[0];
        if (!KNOWN_PACKAGES.has(pkg) && !pkg.startsWith("@/")) {
          issues.push({
            path: f.path,
            severity: "warning",
            message: `Unknown import "${pkg}" — verify it's installed in package.json`,
            line: i + 1,
          });
        }
      }

      // Check for console.log in non-utility files
      if (line.includes("console.log(") && !f.path.includes("util") && !f.path.includes("debug")) {
        issues.push({
          path: f.path,
          severity: "info",
          message: "Remove console.log before production",
          line: i + 1,
        });
      }

      // Check for hardcoded localhost
      if (line.includes("localhost:") && !f.path.endsWith(".md")) {
        issues.push({
          path: f.path,
          severity: "warning",
          message: 'Hardcoded "localhost" URL — use env variable',
          line: i + 1,
        });
      }

      // Check for any type usage
      if (line.match(/:\s*any\b/) && f.path.endsWith(".ts") || f.path.endsWith(".tsx")) {
        issues.push({
          path: f.path,
          severity: "info",
          message: "Avoid `any` type — use specific type or `unknown`",
          line: i + 1,
        });
      }
    }

    // Check for missing key prop in JSX lists (simple pattern)
    if (f.content.includes(".map(") && !f.content.includes("key=")) {
      issues.push({
        path: f.path,
        severity: "warning",
        message: "List render (.map) found but no `key` prop detected — add key to list items",
      });
    }

    // Check index.html for required tags
    if (f.path === "index.html") {
      if (!f.content.includes("<meta name=\"viewport\"")) {
        issues.push({ path: f.path, severity: "warning", message: "Missing viewport meta tag" });
      }
      if (!f.content.includes("<title>")) {
        issues.push({ path: f.path, severity: "info", message: "Missing <title> tag" });
      }
    }
  }

  return issues;
}

async function llmReview(files: FileResult[], byok?: Body["byok"]): Promise<ReviewIssue[] | null> {
  if (!byok || files.length === 0) return null;

  const filesSummary = files
    .slice(0, 6)
    .map((f) => `--- ${f.path} ---\n${f.content.slice(0, 600)}`)
    .join("\n\n");

  const sys = `You are a code reviewer. Review the provided web project files for: broken imports, missing key props, console.logs, hardcoded URLs, type safety issues, accessibility (missing alt, aria), and logic bugs. Reply with ONLY valid JSON: {"issues":[{"path":"","severity":"error|warning|info","message":"","line":1}]}. Max 10 issues. Be concise.`;
  const user = `Review these files:\n${filesSummary}\n\nReturn JSON only.`;

  try {
    if (byok.source === "openrouter" && byok.apiKey) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${byok.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://njirlah.ai",
          "X-Title": "NJIRLAH Review",
        },
        body: JSON.stringify({
          model: byok.modelId || "meta-llama/llama-3.3-70b-instruct:free",
          messages: [{ role: "system", content: sys }, { role: "user", content: user }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return parseIssues(data?.choices?.[0]?.message?.content);
    }
    if (byok.source === "cloudflare" && byok.cfToken && byok.cfAccountId) {
      const model = byok.modelId || "@cf/meta/llama-3.1-8b-instruct";
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${byok.cfAccountId}/ai/run/${model}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${byok.cfToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return parseIssues(data?.result?.response);
    }
  } catch {
    return null;
  }
  return null;
}

function parseIssues(text: string): ReviewIssue[] | null {
  if (!text) return null;
  let obj: any = null;
  try { obj = JSON.parse(text); } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { obj = JSON.parse(m[0]); } catch { return null; }
  }
  if (!Array.isArray(obj?.issues)) return null;
  const allowed = ["error", "warning", "info"];
  return obj.issues
    .filter((i: any) => typeof i.path === "string" && typeof i.message === "string")
    .map((i: any) => ({
      path: i.path,
      severity: allowed.includes(i.severity) ? i.severity : "info",
      message: i.message.slice(0, 200),
      line: typeof i.line === "number" ? i.line : undefined,
    }))
    .slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    if (!Array.isArray(body?.files) || !body?.sessionId) {
      return new Response(JSON.stringify({ error: "Missing files or sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let stepId: string | null = null;
    if (body.projectId) {
      const { data: stepRow } = await supabase
        .from("nj_project_steps")
        .insert({
          project_id: body.projectId,
          session_id: body.sessionId,
          role: "reviewer",
          status: "running",
          input_json: { fileCount: body.files.length },
          order_idx: 3,
        })
        .select("id")
        .maybeSingle();
      stepId = stepRow?.id ?? null;
    }

    const start = Date.now();
    const staticIssues = staticReview(body.files);
    const llmIssues = await llmReview(body.files, body.byok);
    const source = llmIssues ? "llm+static" : "static";

    const merged: ReviewIssue[] = [...staticIssues];
    if (llmIssues) {
      for (const li of llmIssues) {
        if (!merged.find((s) => s.path === li.path && s.message === li.message)) {
          merged.push(li);
        }
      }
    }

    if (stepId) {
      await supabase
        .from("nj_project_steps")
        .update({
          status: merged.some((i) => i.severity === "error") ? "error" : "done",
          output_json: { issues: merged, source },
          latency_ms: Date.now() - start,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stepId);
    }

    return new Response(JSON.stringify({ issues: merged, source }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
