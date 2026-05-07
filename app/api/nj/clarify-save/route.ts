import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, answers, finalize } = body;
    if (!projectId || !Array.isArray(answers)) return NextResponse.json({ error: "Missing projectId/answers" }, { status: 400 });

    for (const a of answers) {
      if (!a.id) continue;
      await query("UPDATE nj_project_clarifications SET answer = $1 WHERE id = $2", [a.answer || "", a.id]);
    }

    if (finalize) {
      await query("UPDATE nj_projects SET status = $1, updated_at = NOW() WHERE id = $2", ["building", projectId]);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
