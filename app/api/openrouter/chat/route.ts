import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing OpenRouter API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.arrayBuffer();

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": req.headers.get("origin") || "https://njirlah.ai",
      "X-Title": "NJIRLAH AI",
    },
    body,
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text();
    return new Response(errText || JSON.stringify({ error: "Upstream error" }), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
