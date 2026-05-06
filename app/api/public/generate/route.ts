export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX = 10; // requests per window

// In-memory rate limit (simple; use Redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get("x-api-key") || req.headers.get("x-forwarded-for") || "unknown";
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now() / 1000;
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil(entry.resetAt - now),
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    retryAfter: 0,
  };
}

interface PublicReqBody {
  prompt: string;
  modelSource?: "anthropic" | "gemini" | "replit" | "openrouter" | "cloudflare";
  modelId?: string;
  filePath?: string;
  apiKey?: string; // for BYOK (OpenRouter)
  cfToken?: string; // for BYOK (Cloudflare)
  cfAccountId?: string;
}

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req);
  const { allowed, remaining, retryAfter } = checkRateLimit(key);

  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + retryAfter),
  };

  if (!allowed) {
    return new Response(sse("error", { message: "Rate limit exceeded" }), {
      status: 429,
      headers,
    });
  }

  try {
    const body = (await req.json()) as PublicReqBody;

    // Validate required fields
    if (!body.prompt || !body.prompt.trim()) {
      return new Response(sse("error", { message: "Missing 'prompt' field" }), {
        status: 400,
        headers,
      });
    }

    // Default to first available built-in
    const modelSource = body.modelSource || "anthropic";
    const modelId =
      body.modelId ||
      (() => {
        switch (modelSource) {
          case "anthropic":
            return "claude-sonnet-4-6";
          case "gemini":
            return "gemini-2.5-flash";
          case "replit":
            return "gpt-5-mini";
          case "openrouter":
            return "meta-llama/llama-2-70b-chat";
          case "cloudflare":
            return "@cf/meta/llama-2-7b-chat-fp16";
          default:
            return "claude-sonnet-4-6";
        }
      })();

    const filePath = body.filePath || "generated.ts";

    // Build internal request to /api/agent/file
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const internalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // For BYOK sources, add client headers (they won't work, but that's OK — user needs real key)
    if (modelSource === "openrouter" && body.apiKey) {
      internalHeaders["x-api-key"] = body.apiKey;
    } else if (modelSource === "cloudflare" && body.cfToken && body.cfAccountId) {
      internalHeaders["x-cf-token"] = body.cfToken;
      internalHeaders["x-cf-account-id"] = body.cfAccountId;
    }

    const internalBody = {
      prompt: body.prompt,
      modelSource,
      modelId,
      filePath,
      filePurpose: "Generated file",
      existingFiles: [],
    };

    // Route to internal /api/agent/file
    const internalReq = new Request(
      `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/agent/file`,
      {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify(internalBody),
      }
    );

    const internalRes = await fetch(internalReq);

    if (!internalRes.ok) {
      const errorText = await internalRes.text();
      return new Response(sse("error", { message: errorText || "Internal error" }), {
        status: internalRes.status,
        headers,
      });
    }

    // Proxy stream
    return new Response(internalRes.body, {
      status: 200,
      headers: {
        ...headers,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
      },
    });
  } catch (e) {
    return new Response(sse("error", { message: (e as Error).message }), {
      status: 500,
      headers: {
        ...headers,
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    },
  });
}
