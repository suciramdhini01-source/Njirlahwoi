import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Body {
  projectId: string;
  sessionId: string;
  answers: { id: string; answer: string }[];
  finalize?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  try {
    const body = (await req.json()) as Body;
    if (!body?.projectId || !Array.isArray(body?.answers)) {
      return new Response(JSON.stringify({ error: "Missing projectId/answers" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    for (const a of body.answers) {
      if (!a.id) continue;
      await supabase
        .from("nj_project_clarifications")
        .update({ answer: a.answer || "" })
        .eq("id", a.id);
    }

    if (body.finalize) {
      await supabase
        .from("nj_projects")
        .update({ status: "building", updated_at: new Date().toISOString() })
        .eq("id", body.projectId);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
