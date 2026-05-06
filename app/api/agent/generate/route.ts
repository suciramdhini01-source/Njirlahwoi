import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";
const STREAM_TIMEOUT_MS = 55_000;

const SYSTEM_PROMPT = `You are NJIRLAH AI's expert full-stack code agent. Generate a COMPLETE, runnable single-page web project as plain HTML/CSS/JavaScript (no build step required).

OUTPUT FORMAT — STRICT, follow exactly:

For each file emit this block:

###FILE: relative/path/to/file.ext
<the full file content here>
###END

Rules:
- Always include index.html as the entry point.
- You may include style.css, script.js, and additional files.
- Keep fully self-contained: no npm, no bundler, no external local imports.
- Use modern clean UI. Responsive. Beautiful.
- Do NOT wrap file content in markdown backticks.
- Before each ###FILE: line you may write one short "AGENT: ..." log line.
- After all files output exactly: ###DONE
- No other prose outside of ###FILE blocks and AGENT: lines.`;

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function planContext(plan: any): string {
  if (!plan || typeof plan !== "object") return "";
  try {
    const tokens = plan.designTokens || {};
    const palette = tokens.palette
      ? Object.entries(tokens.palette)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")
      : "";
    const files = Array.isArray(plan.files)
      ? plan.files.map((f: any) => `- ${f.path}: ${f.purpose}`).join("\n")
      : "";
    const stack = Array.isArray(plan.techStack) ? plan.techStack.join(", ") : "";
    return `\n\nPLANNER CONTEXT (follow this as the authoritative design/architecture spec):\nSummary: ${plan.summary || ""}\nTech stack: ${stack}\nPalette: ${palette}\nTypography: ${tokens?.typography?.heading || ""} / ${tokens?.typography?.body || ""}\nVibe: ${tokens?.vibe || ""}\nFile targets:\n${files}\n`;
  } catch {
    return "";
  }
}

async function callUpstream(
  modelSource: string,
  modelId: string,
  prompt: string,
  apiKey: string,
  cfToken: string,
  cfAccountId: string,
  plan: any
): Promise<Response> {
  const system = SYSTEM_PROMPT + planContext(plan);
  const messages = [
    { role: "system", content: system },
    { role: "user", content: prompt },
  ];

  if (modelSource === "openrouter") {
    return fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://njirlah.ai",
        "X-Title": "NJIRLAH AI Agent",
      },
      body: JSON.stringify({ model: modelId, stream: true, messages, max_tokens: 8192 }),
    });
  }

  return fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${modelId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stream: true, max_tokens: 4096, messages }),
    }
  );
}

function makeSupabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL as string) || "";
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY as string) || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const { prompt, modelSource, modelId, plan, sessionId, projectId } = (await req.json()) as {
    prompt: string;
    modelSource: string;
    modelId: string;
    plan?: unknown;
    sessionId?: string;
    projectId?: string;
  };

  const apiKey = req.headers.get("x-api-key") || "";
  const cfToken = req.headers.get("x-cf-token") || "";
  const cfAccountId = req.headers.get("x-cf-account-id") || "";

  if (!prompt || !modelId || !modelSource) {
    return new Response(sse("error", { message: "Missing prompt, modelId or modelSource" }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }
  if (modelSource === "openrouter" && !apiKey) {
    return new Response(sse("error", { message: "Missing OpenRouter API key" }), {
      status: 401,
      headers: { "Content-Type": "text/event-stream" },
    });
  }
  if (modelSource === "cloudflare" && (!cfToken || !cfAccountId)) {
    return new Response(sse("error", { message: "Missing Cloudflare credentials" }), {
      status: 401,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const sb = makeSupabase();
  let runId: string | null = null;
  if (sb) {
    const { data: runRow } = await sb
      .from("nj_project_runs")
      .insert({ project_id: projectId || null, session_id: sessionId || "", status: "running" })
      .select("id")
      .maybeSingle();
    runId = runRow?.id ?? null;
  }

  let upstream: Response;
  try {
    upstream = await callUpstream(modelSource, modelId, prompt, apiKey, cfToken, cfAccountId, plan);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "network error";
    if (sb && runId) await sb.from("nj_project_runs").update({ status: "error", ended_at: new Date().toISOString() }).eq("id", runId);
    return new Response(sse("error", { message: msg }), {
      status: 500,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text();
    if (sb && runId) await sb.from("nj_project_runs").update({ status: "error", ended_at: new Date().toISOString() }).eq("id", runId);
    return new Response(sse("error", { message: errText || "Upstream error" }), {
      status: upstream.status,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstreamBody = upstream.body;

  const outStream = new ReadableStream({
    async start(controller) {
      let eventSeq = 0;
      const emit = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)));
        if (sb && runId && event !== "file_chunk") {
          const seq = eventSeq++;
          sb.from("nj_run_events")
            .insert({ run_id: runId, event_type: event, payload: data as Record<string, unknown>, seq })
            .then(() => {});
        }
      };

      // Timeout guard before edge runtime severs the connection
      const timeout = setTimeout(() => {
        try {
          emit("error", { message: `Stream timeout after ${STREAM_TIMEOUT_MS / 1000}s. The model may be too slow. Try a faster model or a shorter prompt.` });
          controller.close();
        } catch { /* already closed */ }
      }, STREAM_TIMEOUT_MS);

      const reader = upstreamBody.getReader();
      let sseBuffer = "";
      let parseBuffer = "";
      let inFile = false;
      let currentPath = "";

      function feedText(text: string) {
        parseBuffer += text;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (!inFile) {
            const fileIdx = parseBuffer.indexOf("###FILE:");
            const doneIdx = parseBuffer.indexOf("###DONE");

            // Check for DONE before any file
            if (doneIdx !== -1 && (fileIdx === -1 || doneIdx < fileIdx)) {
              parseBuffer = parseBuffer.slice(doneIdx + 7);
              emit("done", {});
              return;
            }

            // Check for AGENT log line before FILE
            const agentIdx = parseBuffer.indexOf("AGENT:");
            if (agentIdx !== -1 && (fileIdx === -1 || agentIdx < fileIdx)) {
              const nlIdx = parseBuffer.indexOf("\n", agentIdx);
              if (nlIdx === -1) return; // wait for more
              const msg = parseBuffer.slice(agentIdx + 6, nlIdx).trim();
              emit("agent_log", { message: msg });
              parseBuffer = parseBuffer.slice(nlIdx + 1);
              continue;
            }

            if (fileIdx === -1) {
              // Keep last 20 chars as partial match buffer
              if (parseBuffer.length > 20) {
                parseBuffer = parseBuffer.slice(parseBuffer.length - 20);
              }
              return;
            }

            const nlIdx = parseBuffer.indexOf("\n", fileIdx);
            if (nlIdx === -1) return; // wait for newline
            currentPath = parseBuffer.slice(fileIdx + 8, nlIdx).trim();
            parseBuffer = parseBuffer.slice(nlIdx + 1);
            inFile = true;
            emit("file_start", { path: currentPath });
          } else {
            const endIdx = parseBuffer.indexOf("###END");
            if (endIdx === -1) {
              // Flush everything except last 10 chars (may be partial ###END)
              const safe = parseBuffer.length > 10 ? parseBuffer.slice(0, parseBuffer.length - 10) : "";
              if (safe) {
                emit("file_chunk", { path: currentPath, chunk: safe });
                parseBuffer = parseBuffer.slice(safe.length);
              }
              return;
            }
            let chunk = parseBuffer.slice(0, endIdx);
            // Strip trailing newline before ###END
            if (chunk.endsWith("\n")) chunk = chunk.slice(0, -1);
            if (chunk) emit("file_chunk", { path: currentPath, chunk });
            emit("file_end", { path: currentPath });
            parseBuffer = parseBuffer.slice(endIdx + 6);
            inFile = false;
            currentPath = "";
          }
        }
      }

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
              // OpenRouter / OpenAI format
              const orDelta = json?.choices?.[0]?.delta?.content;
              // Cloudflare format
              const cfDelta = json?.response;
              const delta = orDelta ?? cfDelta ?? "";
              if (delta) feedText(delta);
            } catch {
              // Cloudflare may send non-JSON in stream — try raw
              feedText(payload);
            }
          }
        }
        // Process any remaining buffer
        if (sseBuffer) {
          const payload = sseBuffer.replace(/^data:\s*/, "").trim();
          if (payload && payload !== "[DONE]") {
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content ?? json?.response ?? "";
              if (delta) feedText(delta);
            } catch {
              feedText(payload);
            }
          }
        }
        if (parseBuffer) feedText(parseBuffer + "\n###DONE\n");
        else emit("done", {});
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "stream error";
        emit("error", { message: msg });
        if (sb && runId) {
          await sb.from("nj_project_runs").update({ status: "error", ended_at: new Date().toISOString() }).eq("id", runId);
        }
      } finally {
        clearTimeout(timeout);
        if (sb && runId) {
          await sb.from("nj_project_runs").update({ status: "done", ended_at: new Date().toISOString() }).eq("id", runId).then(() => {});
        }
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
