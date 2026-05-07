import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    message: "Use /api/agent/file for streaming file generation. All preview logic runs client-side via WebContainers.",
  });
}
