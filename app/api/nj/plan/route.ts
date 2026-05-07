import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

export const dynamic = "force-dynamic";

interface Plan {
  summary: string;
  techStack: string[];
  files: { path: string; purpose: string }[];
  pages: { route: string; purpose: string }[];
  designTokens: {
    palette: Record<string, string>;
    typography: { heading: string; body: string };
    radius: string;
    vibe: string;
  };
}

function fallbackPlan(prompt: string, kind: string, answers: string): Plan {
  return {
    summary: prompt.slice(0, 180),
    techStack:
      kind === "mobile"
        ? ["React Native (Expo)", "NativeWind", "Zustand"]
        : ["Next.js 14 (App Router)", "Tailwind CSS", "shadcn/ui", "Zustand"],
    files: [
      { path: "app/page.tsx", purpose: "Root landing / home" },
      { path: "app/layout.tsx", purpose: "Root shell with providers" },
      { path: "components/Hero.tsx", purpose: "Hero section" },
      { path: "components/Features.tsx", purpose: "Primary feature grid" },
      { path: "lib/utils.ts", purpose: "Shared helpers" },
    ],
    pages:
      kind === "landing"
        ? [{ route: "/", purpose: "Single landing page" }]
        : [
            { route: "/", purpose: "Home / dashboard" },
            { route: "/auth", purpose: "Sign in" },
          ],
    designTokens: {
      palette: { bg: "#05050A", surface: "#0B0B12", primary: "#18C493", accent: "#7CF7D0", text: "#E6E6EC" },
      typography: { heading: "Space Grotesk", body: "Inter" },
      radius: "0.75rem",
      vibe: `Clean ${kind} UI. Context: ${answers.slice(0, 200)}`,
    },
  };
}

async function llmPlan(prompt: string, kind: string, answersText: string, byok?: Record<string, string>): Promise<Plan | null> {
  if (!byok) return null;
  const sys = `You are the PLANNER sub-agent of NJIRLAH AI. Output STRICT JSON only, matching: {"summary":"","techStack":[],"files":[{"path":"","purpose":""}],"pages":[{"route":"","purpose":""}],"designTokens":{"palette":{"bg":"","surface":"","primary":"","accent":"","text":""},"typography":{"heading":"","body":""},"radius":"","vibe":""}}. Target kind: ${kind}. Keep files <= 12. No prose.`;
  const user = `User prompt:\n${prompt}\n\nClarification answers:\n${answersText}\n\nReturn JSON.`;

  try {
    if (byok.source === "openrouter" && byok.apiKey) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${byok.apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://njirlah.ai", "X-Title": "NJIRLAH Plan" },
        body: JSON.stringify({ model: byok.modelId || "meta-llama/llama-3.3-70b-instruct:free", messages: [{ role: "system", content: sys }, { role: "user", content: user }], temperature: 0.3, response_format: { type: "json_object" } }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return parsePlan(data?.choices?.[0]?.message?.content);
    }
    if (byok.source === "cloudflare" && byok.cfToken && byok.cfAccountId) {
      const model = byok.modelId || "@cf/meta/llama-3.1-8b-instruct";
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${byok.cfAccountId}/ai/run/${model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${byok.cfToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return parsePlan(data?.result?.response);
    }
  } catch { return null; }
  return null;
}

function parsePlan(text: string): Plan | null {
  if (!text) return null;
  try { const obj = JSON.parse(text); if (Array.isArray(obj?.files) && obj.designTokens) return obj as Plan; } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { const obj = JSON.parse(m[0]); if (Array.isArray(obj?.files) && obj.designTokens) return obj as Plan; } catch {}
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, projectId, byok } = body;
    if (!projectId || !sessionId) return NextResponse.json({ error: "Missing projectId/sessionId" }, { status: 400 });

    const projResult = await query("SELECT id, prompt, kind FROM nj_projects WHERE id = $1 LIMIT 1", [projectId]);
    const project = projResult.rows[0];
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const clrResult = await query("SELECT question, answer FROM nj_project_clarifications WHERE project_id = $1 ORDER BY order_idx ASC", [projectId]);
    const answersText = (clrResult.rows || []).map((c: { question: string; answer: string }) => `Q: ${c.question}\nA: ${c.answer || "(kosong)"}`).join("\n\n");

    await query(
      "INSERT INTO nj_project_steps (project_id, session_id, role, status, input_json, order_idx) VALUES ($1, $2, $3, $4, $5, $6)",
      [projectId, sessionId, "planner", "running", JSON.stringify({ prompt: project.prompt, kind: project.kind, answers: answersText }), 0]
    ).catch(() => {});

    const start = Date.now();
    const fromLLM = await llmPlan(project.prompt, project.kind, answersText, byok);
    const plan = fromLLM || fallbackPlan(project.prompt, project.kind, answersText);
    const source = fromLLM ? "llm" : "heuristic";

    await query(
      "UPDATE nj_project_steps SET status = $1, output_json = $2, latency_ms = $3, updated_at = NOW() WHERE project_id = $4 AND role = $5 ORDER BY created_at DESC LIMIT 1",
      ["done", JSON.stringify({ plan, source }), Date.now() - start, projectId, "planner"]
    ).catch(() => {});

    return NextResponse.json({ plan, source });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
