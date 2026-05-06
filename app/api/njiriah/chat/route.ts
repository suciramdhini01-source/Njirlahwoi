import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Proxy to the globally-deployed Supabase Edge Function.
// This means every user — anywhere in the world, after deploy — can use
// NJIR LAH without any API key.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/njiriah-chat`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const upstream = await fetch(EDGE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      return new Response(errText || JSON.stringify({ error: "NJIR LAH unavailable" }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isStream = (body.stream ?? true) === true;

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": isStream
          ? "text/event-stream; charset=utf-8"
          : "application/json",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "proxy error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
