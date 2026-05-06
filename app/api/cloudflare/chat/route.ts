import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-cf-token");
  const accountId = req.headers.get("x-cf-account-id");
  if (!token || !accountId) {
    return new Response(
      JSON.stringify({ error: "Missing Cloudflare token or account ID" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const payload = await req.json() as {
    model: string;
    messages: { role: string; content: string }[];
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
  };

  const { model, messages, stream = true, max_tokens = 2048, temperature = 0.7 } = payload;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, stream, max_tokens, temperature }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!stream || !upstream.body) {
    const text = await upstream.text();
    return new Response(text, {
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
