export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface ShareReq {
  projectId: string; // workspace_projects.id
}

interface ShareRes {
  shareUrl: string;
  embedUrl: string;
  forkUrl: string;
  expiresAt?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ShareReq;

    if (!body.projectId) {
      return new Response(JSON.stringify({ error: "Missing projectId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch project
    const { data: project, error: projErr } = await supabase
      .from("workspace_projects")
      .select("id, name, prompt, plan")
      .eq("id", body.projectId)
      .maybeSingle();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate short share token
    const shareToken = crypto.randomUUID().split("-")[0]; // e.g., "a1b2c3d4"
    const baseUrl = new URL(req.url).origin;

    const result: ShareRes = {
      shareUrl: `${baseUrl}/share/${shareToken}?projectId=${project.id}`,
      embedUrl: `${baseUrl}/embed/${shareToken}?projectId=${project.id}&mode=view`,
      forkUrl: `${baseUrl}/workspace/new?fork=${project.id}`,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
