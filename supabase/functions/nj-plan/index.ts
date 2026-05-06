import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Body {
  sessionId: string;
  projectId: string;
  byok?: {
    source?: "openrouter" | "cloudflare";
    apiKey?: string;
    cfToken?: string;
    cfAccountId?: string;
    modelId?: string;
  };
}

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
      palette: {
        bg: "#05050A",
        surface: "#0B0B12",
        primary: "#18C493",
        accent: "#7CF7D0",
        text: "#E6E6EC",
      },
      typography: { heading: "Space Grotesk", body: "Inter" },
      radius: "0.75rem",
      vibe: `Clean ${kind} UI. Context: ${answers.slice(0, 200)}`,
    },
  };
}

async function llmPlan(
  prompt: string,
  kind: string,
  answersText: string,
  byok?: Body["byok"]
): Promise<Plan | null> {
  if (!byok) return null;
  const sys = `You are the PLANNER sub-agent of NJIRLAH AI. Output STRICT JSON only, matching: {"summary":"","techStack":[],"files":[{"path":"","purpose":""}],"pages":[{"route":"","purpose":""}],"designTokens":{"palette":{"bg":"","surface":"","primary":"","accent":"","text":""},"typography":{"heading":"","body":""},"radius":"","vibe":""}}. Target kind: ${kind}. Keep files <= 12. No prose.`;
  const user = `User prompt:\n${prompt}\n\nClarification answers:\n${answersText}\n\nReturn JSON.`;
  try {
    if (byok.source === "openrouter" && byok.apiKey) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${byok.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://njirlah.ai",
          "X-Title": "NJIRLAH Plan",
        },
        body: JSON.stringify({
          model: byok.modelId || "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      return parsePlan(text);
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
      return parsePlan(text);
    }
  } catch {
    return null;
  }
  return null;
}

function parsePlan(text: string): Plan | null {
  if (!text) return null;
  let obj: any = null;
  try {
    obj = JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      obj = JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  if (!Array.isArray(obj.files) || !obj.designTokens) return null;
  return obj as Plan;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    if (!body?.projectId || !body?.sessionId) {
      return new Response(JSON.stringify({ error: "Missing projectId/sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: project } = await supabase
      .from("nj_projects")
      .select("id, prompt, kind")
      .eq("id", body.projectId)
      .maybeSingle();

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: clrs } = await supabase
      .from("nj_project_clarifications")
      .select("question, answer")
      .eq("project_id", body.projectId)
      .order("order_idx", { ascending: true });

    const answersText = (clrs || [])
      .map((c: any) => `Q: ${c.question}\nA: ${c.answer || "(kosong)"}`)
      .join("\n\n");

    const { data: stepRow } = await supabase
      .from("nj_project_steps")
      .insert({
        project_id: body.projectId,
        session_id: body.sessionId,
        role: "planner",
        status: "running",
        input_json: { prompt: project.prompt, kind: project.kind, answers: answersText },
        order_idx: 0,
      })
      .select("id")
      .maybeSingle();

    const start = Date.now();
    const fromLLM = await llmPlan(project.prompt, project.kind, answersText, body.byok);
    const plan = fromLLM || fallbackPlan(project.prompt, project.kind, answersText);
    const source = fromLLM ? "llm" : "heuristic";

    if (stepRow?.id) {
      await supabase
        .from("nj_project_steps")
        .update({
          status: "done",
          output_json: { plan, source },
          latency_ms: Date.now() - start,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stepRow.id);
    }

    return new Response(JSON.stringify({ plan, source }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
