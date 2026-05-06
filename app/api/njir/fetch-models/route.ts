import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const body = await req.json();
  const res = await fetch(`${origin}/api/njir/test-connection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return NextResponse.json({ models: json.models || [] });
}
