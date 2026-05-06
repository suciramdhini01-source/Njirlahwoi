export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// NOTE: OpenAI (Replit) API key is managed by Supabase Edge Function, not Next.js.
// This stub is kept for backward compatibility but always returns 503.

export async function POST() {
  return new Response(
    JSON.stringify({
      error: "OpenAI (Replit) integration has moved to Supabase Edge Function.",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}
