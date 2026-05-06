import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/api/agent/:path*",
    "/api/openrouter/:path*",
    "/api/cloudflare/:path*",
    "/api/anthropic/:path*",
    "/api/gemini/:path*",
    "/api/replit/:path*",
    "/api/njiriah/:path*",
  ],
};

// In-memory sliding-window rate limiter.
// Edge runtime shares state only within a single isolate instance.
// This gives per-IP limits that reset as isolates recycle — good enough
// to prevent casual abuse without a Redis dependency.
const counters = new Map<string, { count: number; resetAt: number }>();

// Limits per route group (requests / window)
const LIMITS: { pattern: RegExp; max: number; windowMs: number }[] = [
  { pattern: /\/api\/agent\/generate/, max: 8, windowMs: 60_000 },
  { pattern: /\/api\/agent\/file/, max: 30, windowMs: 60_000 },
  { pattern: /\/api\/(openrouter|cloudflare|anthropic|gemini|replit|njiriah)/, max: 40, windowMs: 60_000 },
];

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function checkLimit(ip: string, path: string, now: number): { allowed: boolean; retryAfter: number } {
  const rule = LIMITS.find((r) => r.pattern.test(path));
  if (!rule) return { allowed: true, retryAfter: 0 };

  const key = `${ip}:${path.replace(/\/[a-f0-9-]{36}/g, "/:id")}:${rule.pattern.source}`;
  const entry = counters.get(key);

  if (!entry || now > entry.resetAt) {
    counters.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count++;
  if (entry.count > rule.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

// Prune stale entries periodically to avoid unbounded growth
let lastPrune = Date.now();
function maybePrune(now: number) {
  if (now - lastPrune < 120_000) return;
  lastPrune = now;
  counters.forEach((v, k) => {
    if (now > v.resetAt) counters.delete(k);
  });
}

export function middleware(req: NextRequest) {
  const now = Date.now();
  maybePrune(now);

  const ip = getIp(req);
  const path = req.nextUrl.pathname;
  const { allowed, retryAfter } = checkLimit(ip, path, now);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests. Slow down — NJIRLAH AI melindungi infrastruktur dari spam.",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": "see policy",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return NextResponse.next();
}
