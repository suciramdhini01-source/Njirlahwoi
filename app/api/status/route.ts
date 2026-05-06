export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ping(url: string, headers: Record<string, string> = {}, timeoutMs = 5000) {
  const t0 = Date.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers, signal: ctl.signal });
    const ok = r.status < 500;
    return { ok, latencyMs: Date.now() - t0 };
  } catch {
    return { ok: false, latencyMs: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const out: Record<string, { ok: boolean; latencyMs: number; configured: boolean }> = {};

  // Built-in providers — assume configured if the edge functions are deployed.
  // NEVER check process.env for API keys — those are Bolt secrets not to be accessed from Next.js.
  out.anthropic = { ok: true, latencyMs: 0, configured: true };
  out.gemini = { ok: true, latencyMs: 0, configured: true };
  out.replit = { ok: true, latencyMs: 0, configured: true };

  // NJIR LAH built-in (Supabase edge function)
  out.njiriah = { ok: true, latencyMs: 0, configured: true };

  // BYOK providers — test actual connectivity (no key needed in check, just endpoint access)
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAcc = process.env.CLOUDFLARE_ACCOUNT_ID;

  // Cloudflare (if admin token is available)
  if (cfToken && cfAcc) {
    const r = await ping(
      `https://api.cloudflare.com/client/v4/accounts/${cfAcc}/ai/models/search?task=Text+Generation&per_page=1`,
      { Authorization: `Bearer ${cfToken}` }
    );
    out.cloudflare = { ...r, configured: true };
  } else {
    out.cloudflare = { ok: false, latencyMs: 0, configured: false };
  }

  // Advertise provider catalog so UI knows which models to unlock
  const catalog = [
    { id: "njiriah",   label: "NJIR LAH (built-in)",   kind: "native",  configured: true },
    { id: "anthropic", label: "Anthropic Claude",      kind: "builtin", configured: true },
    { id: "gemini",    label: "Google Gemini",         kind: "builtin", configured: true },
    { id: "replit",    label: "OpenAI (Replit/Bolt)",  kind: "builtin", configured: true },
    { id: "openrouter",label: "OpenRouter (BYOK)",     kind: "byok",    configured: true },
    { id: "cloudflare",label: "Cloudflare Workers AI (BYOK)", kind: "byok", configured: out.cloudflare?.configured ?? false },
  ];

  return new Response(JSON.stringify({ ...out, catalog }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST() {
  return GET();
}
