import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReqBody {
  prompt: string;
  modelSource: "anthropic" | "gemini" | "replit";
  modelId: string;
  plan: any;
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
  presetSystem?: string
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

  return `You are the CODER sub-agent of NJIRLAH AI. Output ONLY the full content of a single file. No markdown fences. No "###FILE" markers. No prose before or after.

TARGET FILE: ${filePath}
PURPOSE: ${filePurpose}

Stack: ${(plan?.techStack || []).join(", ")}
Palette: ${palette}
Typography: ${tokens?.typography?.heading || ""} / ${tokens?.typography?.body || ""}
${presetLine}
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

async function callAnthropic(
  modelId: string,
  system: string
): Promise<Response> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      stream: true,
      max_tokens: 6000,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: "Output the full content now." }],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Anthropic error ${resp.status}: ${text}`);
  }

  return resp;
}

async function callGemini(
  modelId: string,
  system: string
): Promise<Response> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: "Output the full content now." }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 6000 },
      }),
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini error ${resp.status}: ${text}`);
  }

  return resp;
}

async function callReplit(
  modelId: string,
  system: string
): Promise<Response> {
  const baseUrl = Deno.env.get("OPENAI_BASE_URL");
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!baseUrl || !apiKey) {
    throw new Error("OpenAI (Replit) credentials not configured");
  }

  const resp = await fetch(
    `${baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        stream: true,
        max_tokens: 6000,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: "Output the full content now." },
        ],
      }),
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${text}`);
  }

  return resp;
}

function extractDelta(source: string, json: unknown): string {
  const j = json as Record<string, unknown>;

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

  // replit (OpenAI shape)
  const choices = j.choices as Array<{ delta?: { content?: string } }> | undefined;
  return choices?.[0]?.delta?.content || "";
}

async function proxyStream(
  upstream: Response,
  source: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstreamBody = upstream.body;

  if (!upstreamBody) {
    throw new Error("No response body from upstream");
  }

  const STREAM_TIMEOUT_MS = 55_000;

  return new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      const timeout = setTimeout(() => {
        try {
          emit("error", { message: `Timeout: generation exceeded ${STREAM_TIMEOUT_MS / 1000}s` });
          controller.close();
        } catch {
          /* already closed */
        }
      }, STREAM_TIMEOUT_MS);

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
              const delta = extractDelta(source, json);

              if (delta) {
                accumulated += delta;
                let outChunk = delta;

                if (firstChunk) {
                  accumulated = accumulated.replace(/^\s*```[a-zA-Z0-9]*\s*\n?/, "");
                  outChunk = accumulated;
                  firstChunk = false;
                  if (outChunk) {
                    emit("file_chunk", { path: "", chunk: outChunk });
                  }
                } else {
                  emit("file_chunk", { path: "", chunk: outChunk });
                }
              }
            } catch {
              /* ignore parse errors */
            }
          }
        }

        // Cleanup trailing fences
        if (accumulated.includes("```")) {
          accumulated = accumulated
            .replace(/```[a-zA-Z0-9]*\s*$/, "")
            .replace(/```\s*$/, "");
          emit("file_rewrite", { path: "", content: accumulated });
        }

        emit("file_end", { path: "" });
        emit("done", {});
      } catch (e) {
        emit("error", { message: (e as Error).message });
      } finally {
        clearTimeout(timeout);
        controller.close();
      }
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = (await req.json()) as ReqBody;

    if (!body.filePath || !body.modelId || !body.modelSource) {
      return new Response(sse("error", { message: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "text/event-stream", ...corsHeaders },
      });
    }

    const system = buildSystemPrompt(
      body.prompt,
      body.plan,
      body.filePath,
      body.filePurpose,
      body.existingFiles || [],
      body.preset?.systemPrompt
    );

    let upstream: Response;

    try {
      if (body.modelSource === "anthropic") {
        upstream = await callAnthropic(body.modelId, system);
      } else if (body.modelSource === "gemini") {
        upstream = await callGemini(body.modelId, system);
      } else if (body.modelSource === "replit") {
        upstream = await callReplit(body.modelId, system);
      } else {
        throw new Error(`Unsupported source: ${body.modelSource}`);
      }
    } catch (e) {
      return new Response(sse("error", { message: (e as Error).message }), {
        status: 503,
        headers: { "Content-Type": "text/event-stream", ...corsHeaders },
      });
    }

    const stream = await proxyStream(upstream, body.modelSource);

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        ...corsHeaders,
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
