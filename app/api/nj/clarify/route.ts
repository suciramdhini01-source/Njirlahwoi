import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

export const dynamic = "force-dynamic";

type Kind = "fullstack" | "mobile" | "landing";
interface Clarification { question: string; category: string; why?: string; }

function heuristicQuestions(prompt: string, kind: Kind): Clarification[] {
  const p = prompt.toLowerCase();
  const out: Clarification[] = [];

  out.push({
    question: kind === "mobile" ? "Platform utama: iOS, Android, atau keduanya (responsif web)?" : kind === "landing" ? "Siapa target audiens landing page ini (founder, developer, umum)?" : "Siapa target pengguna utama aplikasi ini?",
    category: "audience",
    why: "Menentukan tone copywriting & prioritas UX",
  });

  if (!/(warna|color|hex|#[0-9a-f]{3,6}|palette)/.test(p)) {
    out.push({ question: "Palet warna & mood visual (mis. dark neon hijau, pastel hangat, minimal mono)?", category: "design", why: "Dipakai Designer Agent untuk design tokens" });
  }

  const hasAuth = /(login|auth|register|sign[- ]?in|sign[- ]?up)/.test(p);
  out.push({ question: hasAuth ? "Metode autentikasi: email/password, Google OAuth, magic link?" : "Apakah perlu autentikasi user atau cukup mode tamu?", category: "features", why: "Berpengaruh ke skema database & halaman auth" });
  out.push({ question: kind === "landing" ? "Section wajib (hero, fitur, testimonial, pricing, FAQ, CTA)?" : "Sebutkan 3-5 fitur inti yang paling penting di MVP ini.", category: "features", why: "Menentukan file tree & prioritas build" });
  out.push({ question: "Integrasi eksternal yang dibutuhkan (DB, Stripe, email, pihak ketiga)?", category: "integration", why: "Memicu setup environment" });

  return out.slice(0, 5);
}

async function llmQuestions(prompt: string, kind: Kind, byok?: Record<string, string>): Promise<Clarification[] | null> {
  if (!byok) return null;
  const sys = `You are a senior product designer. Given a user's initial project prompt, produce 4-6 SHORT, SPECIFIC clarifying questions in Bahasa Indonesia. Reply with ONLY valid JSON: {"questions":[{"question":"...","category":"design|audience|features|integration|general","why":"..."}]}. Kind hint: ${kind}.`;
  const user = `Prompt proyek:\n${prompt}\n\nGenerate questions JSON only.`;

  try {
    if (byok.source === "openrouter" && byok.apiKey) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${byok.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: byok.modelId || "meta-llama/llama-3.3-70b-instruct:free", messages: [{ role: "system", content: sys }, { role: "user", content: user }], temperature: 0.4, response_format: { type: "json_object" } }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return normalize(safeJson(data?.choices?.[0]?.message?.content)?.questions);
    }
    if (byok.source === "cloudflare" && byok.cfToken && byok.cfAccountId) {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${byok.cfAccountId}/ai/run/${byok.modelId || "@cf/meta/llama-3.1-8b-instruct"}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${byok.cfToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return normalize(safeJson(data?.result?.response)?.questions);
    }
  } catch { return null; }
  return null;
}

function safeJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

function normalize(arr: unknown[]): Clarification[] | null {
  if (!Array.isArray(arr)) return null;
  const allowed = ["design", "audience", "features", "integration", "general"];
  const out: Clarification[] = [];
  for (const q of arr) {
    const item = q as Record<string, unknown>;
    if (!item || typeof item.question !== "string" || !item.question.trim()) continue;
    out.push({ question: item.question.trim().slice(0, 240), category: allowed.includes(item.category as string) ? item.category as string : "general", why: typeof item.why === "string" ? item.why.slice(0, 200) : undefined });
  }
  return out.length ? out.slice(0, 6) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, projectId: existingProjectId, name, prompt, kind, agentPresetId, byok } = body;
    if (!prompt || !sessionId || !kind) return NextResponse.json({ error: "Missing prompt/sessionId/kind" }, { status: 400 });

    let projectId = existingProjectId;
    if (!projectId) {
      const result = await query(
        "INSERT INTO nj_projects (session_id, name, kind, prompt, status, agent_preset_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [sessionId, name || prompt.slice(0, 48), kind, prompt, "clarifying", agentPresetId || "e-1"]
      );
      projectId = result.rows[0]?.id;
      if (!projectId) return NextResponse.json({ error: "insert failed" }, { status: 500 });
    } else {
      await query("UPDATE nj_projects SET status = $1, prompt = $2, updated_at = NOW() WHERE id = $3", ["clarifying", prompt, projectId]);
    }

    const fromLLM = await llmQuestions(prompt, kind, byok);
    const source = fromLLM && fromLLM.length ? "llm" : "heuristic";
    const questions = fromLLM && fromLLM.length ? fromLLM : heuristicQuestions(prompt, kind);

    await query("DELETE FROM nj_project_clarifications WHERE project_id = $1", [projectId]);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await query(
        "INSERT INTO nj_project_clarifications (project_id, session_id, question, category, order_idx) VALUES ($1, $2, $3, $4, $5)",
        [projectId, sessionId, q.question, q.category, i]
      );
    }

    return NextResponse.json({ projectId, questions, source });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
