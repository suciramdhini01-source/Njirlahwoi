import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";
// Edge function hard timeout guard — emit error+done before connection is killed
const STREAM_TIMEOUT_MS = 55_000;

type Source = "openrouter" | "cloudflare" | "anthropic" | "gemini" | "replit";

interface ReqBody {
  prompt: string;
  modelSource: Source;
  modelId: string;
  plan: unknown;
  filePath: string;
  filePurpose: string;
  existingFiles: { path: string; content: string }[];
  preset?: { id: string; systemPrompt?: string };
}

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function buildSystemPrompt(
  userPrompt: string,
  plan: any,
  filePath: string,
  filePurpose: string,
  existing: { path: string; content: string }[],
  presetSystem?: string,
  toolContext?: string
): string {
  const tokens = plan?.designTokens || {};
  const palette = tokens.palette
    ? Object.entries(tokens.palette).map(([k, v]) => `${k}=${v}`).join(", ")
    : "";
  const allFiles = Array.isArray(plan?.files)
    ? plan.files.map((f: any) => `- ${f.path}: ${f.purpose}`).join("\n")
    : "";

  const existingContext = existing.length
    ? existing
        .slice(-6)
        .map(
          (f) =>
            `--- ${f.path} ---\n${f.content.slice(0, 1200)}${f.content.length > 1200 ? "\n... (truncated)" : ""}`
        )
        .join("\n\n")
    : "(none yet — this is the first file)";

  const presetLine = presetSystem ? `\nPRESET GUIDELINES:\n${presetSystem}\n` : "";
  const toolLine = toolContext ? `\nMCP TOOL RESULTS (use these to inform your code):\n${toolContext}\n` : "";

  return `You are the CODER sub-agent of NJIRLAH AI. Output ONLY the full content of a single file. No markdown fences. No "###FILE" markers. No prose before or after.

TARGET FILE: ${filePath}
PURPOSE: ${filePurpose}

Stack: ${(plan?.techStack || []).join(", ")}
Palette: ${palette}
Typography: ${tokens?.typography?.heading || ""} / ${tokens?.typography?.body || ""}
${presetLine}${toolLine}
ENTIRE PROJECT FILE LIST (do not invent paths outside this list when importing):
${allFiles}

ALREADY COMPLETED FILES (use these exactly when importing, do not redefine):
${existingContext}

USER PROMPT:
${userPrompt}

Rules:
- Write COMPLETE, production-quality code for ${filePath} only.
- Match exact framework conventions for the declared stack (Next.js App Router if present, React otherwise).
- Match design tokens (palette, typography, radius).
- Never emit imports to packages not in a typical modern React/Next.js project unless clearly required.
- Do not wrap in backticks. Output raw file content.
- End with a final newline.`;
}

async function callUpstream(
  source: Source,
  modelId: string,
  system: string,
  apiKey: string,
  cfToken: string,
  cfAccount: string
): Promise<Response> {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: `Output the full content now.` },
  ];

  if (source === "openrouter") {
    return fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://njirlah.ai",
        "X-Title": "NJIRLAH Coder Sub-Agent",
      },
      body: JSON.stringify({ model: modelId, stream: true, messages, max_tokens: 6000, temperature: 0.2 }),
    });
  }

  if (source === "cloudflare") {
    return fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${modelId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ stream: true, max_tokens: 4096, messages }),
      }
    );
  }

  // Built-in sources (anthropic/gemini/replit) are not handled here — they delegate to edge function above
  if (source === "replit" || source === "anthropic" || source === "gemini") {
    throw new Error(`${source} should have been delegated to edge function`);
  }

  throw new Error(`Unsupported source: ${source}`);
}

function extractDelta(source: Source, json: unknown): string {
  const j = json as Record<string, unknown>;
  if (source === "cloudflare") {
    return (j.response as string) || "";
  }
  if (source === "anthropic") {
    const t = j.type as string;
    if (t === "content_block_delta") {
      const d = j.delta as { type?: string; text?: string } | undefined;
      return d?.type === "text_delta" ? d.text || "" : "";
    }
    return "";
  }
  if (source === "gemini") {
    const candidates = j.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    const parts = candidates?.[0]?.content?.parts;
    return parts?.map((p) => p.text || "").join("") || "";
  }
  // openrouter / replit (OpenAI shape)
  const choices = j.choices as Array<{ delta?: { content?: string } }> | undefined;
  return choices?.[0]?.delta?.content || "";
}

async function runMCPTools(
  filePath: string,
  filePurpose: string,
  origin: string
): Promise<string> {
  const keywords = (filePath + " " + filePurpose).toLowerCase();
  const iconConcepts: string[] = [];
  const componentNames: string[] = [];

  const iconMatches = ["home", "user", "chart", "cart", "search", "mail", "chat", "image", "edit", "alert", "settings"];
  for (const k of iconMatches) if (keywords.includes(k)) iconConcepts.push(k);

  const compMatches = ["Button", "Card", "Dialog", "Tabs", "Select", "Input", "Badge", "Avatar"];
  for (const name of compMatches) if (keywords.toLowerCase().includes(name.toLowerCase())) componentNames.push(name);

  if (filePath.includes("Hero") || filePath.includes("Landing")) componentNames.push("Button", "Card");
  if (filePath.includes("Feature")) componentNames.push("Card", "Badge");
  if (filePath.includes("Form") || filePath.includes("Auth")) componentNames.push("Input", "Button");

  const parts: string[] = [];

  for (const concept of Array.from(new Set(iconConcepts)).slice(0, 3)) {
    try {
      const r = await fetch(`${origin}/api/tools/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "iconSearch", args: { concept } }),
      });
      if (r.ok) {
        const { result } = await r.json();
        parts.push(`Icons for "${concept}": ${(result.icons || []).join(", ")}`);
      }
    } catch {
      /* skip */
    }
  }

  for (const name of Array.from(new Set(componentNames)).slice(0, 3)) {
    try {
      const r = await fetch(`${origin}/api/tools/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "componentRegistry", args: { name } }),
      });
      if (r.ok) {
        const { result } = await r.json();
        if (result.snippet) parts.push(`${name} usage:\n${result.snippet}`);
      }
    } catch {
      /* skip */
    }
  }

  return parts.join("\n\n");
}

function stripMarkdownFences(s: string): string {
  return s
    .replace(/^\s*```[a-zA-Z0-9]*\s*\n/, "")
    .replace(/\n```\s*$/, "")
    .replace(/^\s*```\s*/, "")
    .replace(/\s*```\s*$/, "");
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ReqBody;
  const apiKey = req.headers.get("x-api-key") || "";
  const cfToken = req.headers.get("x-cf-token") || "";
  const cfAccountId = req.headers.get("x-cf-account-id") || "";

  // For built-in providers (Anthropic/Gemini/Replit), delegate to edge function
  // which has access to Supabase environment secrets
  if (["anthropic", "gemini", "replit"].includes(body.modelSource)) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (supabaseUrl) {
      const edgeUrl = `${supabaseUrl}/functions/v1/nj-file-builtin`;
      try {
        const edgeReq = new Request(edgeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const edgeRes = await fetch(edgeReq);
        return new Response(edgeRes.body, {
          status: edgeRes.status,
          headers: new Headers(edgeRes.headers),
        });
      } catch (e) {
        console.error("Edge function delegation failed:", e);
        // Fall through to inline handling if edge function is not available
      }
    }
  }

  if (!body.filePath || !body.modelId || !body.modelSource) {
    return new Response(sse("error", { message: "Missing filePath/modelId/modelSource" }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  // Validate BYOK credentials only for user-provided keys
  if (body.modelSource === "openrouter" && !apiKey) {
    return new Response(sse("error", { message: "OpenRouter API key missing (BYOK required)" }), {
      status: 401, headers: { "Content-Type": "text/event-stream" },
    });
  }
  if (body.modelSource === "cloudflare" && (!cfToken || !cfAccountId)) {
    return new Response(sse("error", { message: "Cloudflare token/account missing (BYOK required)" }), {
      status: 401, headers: { "Content-Type": "text/event-stream" },
    });
  }
  // Built-in sources (anthropic/gemini/replit) are validated by edge function

  const origin = new URL(req.url).origin;
  let toolContext = "";
  try {
    toolContext = await runMCPTools(body.filePath, body.filePurpose, origin);
  } catch {
    toolContext = "";
  }

  const system = buildSystemPrompt(
    body.prompt,
    body.plan,
    body.filePath,
    body.filePurpose,
    body.existingFiles || [],
    body.preset?.systemPrompt,
    toolContext
  );

  let upstream: Response;
  try {
    upstream = await callUpstream(body.modelSource, body.modelId, system, apiKey, cfToken, cfAccountId);
  } catch (e) {
    return new Response(sse("error", { message: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text();
    return new Response(sse("error", { message: t || "upstream error" }), {
      status: upstream.status,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstreamBody = upstream.body;

  const outStream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      // Timeout guard: emit error before edge runtime kills the connection
      const timeout = setTimeout(() => {
        try {
          emit("error", { message: `Timeout: file ${body.filePath} generation exceeded ${STREAM_TIMEOUT_MS / 1000}s. Try a smaller file scope or a faster model.` });
          controller.close();
        } catch { /* already closed */ }
      }, STREAM_TIMEOUT_MS);

      if (toolContext) emit("agent_log", { message: `MCP tools injected for ${body.filePath}` });
      emit("file_start", { path: body.filePath });
      const reader = upstreamBody.getReader();
      let sseBuffer = "";
      let accumulated = "";
      let firstChunk = true;

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = extractDelta(body.modelSource, json);
              if (delta) {
                accumulated += delta;
                // Strip leading code fence on the fly, once
                let outChunk = delta;
                if (firstChunk) {
                  accumulated = accumulated.replace(/^\s*```[a-zA-Z0-9]*\s*\n?/, "");
                  outChunk = accumulated;
                  firstChunk = false;
                  if (outChunk) emit("file_chunk", { path: body.filePath, chunk: outChunk });
                } else {
                  emit("file_chunk", { path: body.filePath, chunk: outChunk });
                }
              }
            } catch {
              /* ignore */
            }
          }
        }
        // Strip trailing fence if present (we can't retroactively, so emit a correction)
        const cleaned = stripMarkdownFences(accumulated);
        if (cleaned !== accumulated) {
          emit("file_rewrite", { path: body.filePath, content: cleaned });
        }
        emit("file_end", { path: body.filePath });
        emit("done", {});
      } catch (e) {
        emit("error", { message: (e as Error).message });
      } finally {
        clearTimeout(timeout);
        controller.close();
      }
    },
  });

  return new Response(outStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
