import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Kind = "fullstack" | "mobile" | "landing";

interface Body {
  sessionId: string;
  projectId?: string;
  name?: string;
  prompt: string;
  kind: Kind;
  agentPresetId?: string;
  byok?: {
    source?: "openrouter" | "cloudflare";
    apiKey?: string;
    cfToken?: string;
    cfAccountId?: string;
    modelId?: string;
  };
}

interface Clarification {
  question: string;
  category: "design" | "audience" | "features" | "integration" | "general";
  why?: string;
}

function heuristicQuestions(prompt: string, kind: Kind): Clarification[] {
  const p = prompt.toLowerCase();
  const out: Clarification[] = [];

  out.push({
    question:
      kind === "mobile"
        ? "Platform utama: iOS, Android, atau keduanya (responsif web)?"
        : kind === "landing"
        ? "Siapa target audiens landing page ini (founder, developer, umum)?"
        : "Siapa target pengguna utama aplikasi ini?",
    category: "audience",
    why: "Menentukan tone copywriting & prioritas UX",
  });

  if (!/(warna|color|hex|#[0-9a-f]{3,6}|palette)/.test(p)) {
    out.push({
      question: "Palet warna & mood visual (mis. dark neon hijau, pastel hangat, minimal mono)?",
      category: "design",
      why: "Dipakai Designer Agent untuk design tokens",
    });
  }

  const hasAuth = /(login|auth|register|sign[- ]?in|sign[- ]?up)/.test(p);
  out.push({
    question: hasAuth
      ? "Metode autentikasi: email/password, Google OAuth, magic link?"
      : "Apakah perlu autentikasi user atau cukup mode tamu?",
    category: "features",
    why: "Berpengaruh ke skema Supabase & halaman auth",
  });

  out.push({
    question:
      kind === "landing"
        ? "Section wajib (hero, fitur, testimonial, pricing, FAQ, CTA)?"
        : "Sebutkan 3-5 fitur inti yang paling penting di MVP ini.",
    category: "features",
    why: "Menentukan file tree & prioritas build",
  });

  out.push({
    question: "Integrasi eksternal yang dibutuhkan (Supabase DB, Stripe, email, pihak ketiga)?",
    category: "integration",
    why: "Memicu tool-use untuk setup environment",
  });

  return out.slice(0, 5);
}

async function llmQuestions(body: Body): Promise<Clarification[] | null> {
  const { byok, prompt, kind } = body;
  if (!byok) return null;

  const sys = `You are a senior product designer acting as a requirements-gathering agent. Given a user's initial project prompt, produce 4-6 SHORT, SPECIFIC clarifying questions in Bahasa Indonesia that will materially change the design & implementation. Reply with ONLY valid JSON of shape: {"questions":[{"question":"...","category":"design|audience|features|integration|general","why":"short reason in Bahasa Indonesia"}]}. Kind hint: ${kind}.`;
  const user = `Prompt proyek:\n${prompt}\n\nGenerate questions JSON only.`;

  try {
    if (byok.source === "openrouter" && byok.apiKey) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${byok.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://njirlah.ai",
          "X-Title": "NJIRLAH Clarify",
        },
        body: JSON.stringify({
          model: byok.modelId || "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
          temperature: 0.4,
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const parsed = safeJson(text);
      return normalize(parsed?.questions);
    }
    if (byok.source === "cloudflare" && byok.cfToken && byok.cfAccountId) {
      const model = byok.modelId || "@cf/meta/llama-3.1-8b-instruct";
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${byok.cfAccountId}/ai/run/${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${byok.cfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: sys },
              { role: "user", content: user },
            ],
          }),
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const text = data?.result?.response || "";
      const parsed = safeJson(text);
      return normalize(parsed?.questions);
    }
  } catch {
    return null;
  }
  return null;
}

function safeJson(text: string): any {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }
  return null;
}

function normalize(arr: any): Clarification[] | null {
  if (!Array.isArray(arr)) return null;
  const allowed = ["design", "audience", "features", "integration", "general"];
  const out: Clarification[] = [];
  for (const q of arr) {
    if (!q || typeof q.question !== "string" || !q.question.trim()) continue;
    out.push({
      question: q.question.trim().slice(0, 240),
      category: allowed.includes(q.category) ? q.category : "general",
      why: typeof q.why === "string" ? q.why.slice(0, 200) : undefined,
    });
  }
  return out.length ? out.slice(0, 6) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    if (!body?.prompt || !body?.sessionId || !body?.kind) {
      return new Response(JSON.stringify({ error: "Missing prompt/sessionId/kind" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let projectId = body.projectId;
    if (!projectId) {
      const { data: inserted, error: insErr } = await supabase
        .from("nj_projects")
        .insert({
          session_id: body.sessionId,
          name: body.name || body.prompt.slice(0, 48),
          kind: body.kind,
          prompt: body.prompt,
          status: "clarifying",
          agent_preset_id: body.agentPresetId || "e-1",
        })
        .select("id")
        .maybeSingle();
      if (insErr || !inserted) {
        return new Response(JSON.stringify({ error: insErr?.message || "insert failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      projectId = inserted.id;
    } else {
      await supabase
        .from("nj_projects")
        .update({ status: "clarifying", prompt: body.prompt, updated_at: new Date().toISOString() })
        .eq("id", projectId);
    }

    const fromLLM = await llmQuestions(body);
    const source = fromLLM && fromLLM.length ? "llm" : "heuristic";
    const questions = fromLLM && fromLLM.length ? fromLLM : heuristicQuestions(body.prompt, body.kind);

    await supabase.from("nj_project_clarifications").delete().eq("project_id", projectId!);

    const rows = questions.map((q, i) => ({
      project_id: projectId!,
      session_id: body.sessionId,
      question: q.question,
      category: q.category,
      order_idx: i,
    }));

    const { error: clrErr } = await supabase.from("nj_project_clarifications").insert(rows);
    if (clrErr) {
      return new Response(JSON.stringify({ error: clrErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ projectId, questions, source }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
