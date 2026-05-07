import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const PROVIDER_MODELS: Record<string, string> = {
  "meta-llama/llama-3.1-8b-instruct": "@cf/meta/llama-3.1-8b-instruct",
  "mistralai/mistral-7b-instruct-v0.1": "@cf/mistral/mistral-7b-instruct-v0.1",
};

function buildSystemPrompt(
  filePath: string,
  filePurpose: string,
  plan: { techStack?: string[]; designTokens?: { palette?: Record<string, string>; typography?: { heading: string; body: string }; radius?: string; vibe?: string } } | null,
  existingFiles: { path: string; content: string }[]
): string {
  const stack = plan?.techStack?.join(", ") || "React, Tailwind CSS";
  const tokens = plan?.designTokens;
  const peers = existingFiles.map((f) => `\n=== ${f.path} ===\n${f.content.slice(0, 300)}...`).join("\n");

  return `You are an expert ${stack} developer. Write ONLY the file \`${filePath}\`.

PURPOSE: ${filePurpose}
TECH STACK: ${stack}
${tokens ? `DESIGN: bg=${tokens.palette?.bg}, primary=${tokens.palette?.primary}, heading font=${tokens.typography?.heading}, vibe="${tokens.vibe}"` : ""}

RULES:
- Output ONLY valid code for ${filePath}. No markdown fences, no explanations.
- Use Tailwind CSS classes for styling.
- Import from React and other deps as needed.
- Make the code complete and production-ready.
${existingFiles.length ? `\nEXISTING FILES (for context):\n${peers}` : ""}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    prompt,
    modelSource,
    modelId,
    plan,
    filePath,
    filePurpose,
    existingFiles = [],
    preset,
  } = body;

  const systemPrompt = buildSystemPrompt(filePath, filePurpose, plan, existingFiles);
  const userMsg = `Write the complete contents of \`${filePath}\`.\n\nProject goal: ${prompt}\n${preset?.systemPrompt ? `\nAgent personality: ${preset.systemPrompt}` : ""}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMsg },
  ];

  const encoder = new TextEncoder();

  function sseChunk(event: string, data: unknown) {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(sseChunk("file_start", { path: filePath }));

      try {
        let response: Response;

        if (modelSource === "cloudflare") {
          const cfToken = req.headers.get("x-cf-token") || process.env.CLOUDFLARE_API_TOKEN;
          const cfAccountId = req.headers.get("x-cf-account-id") || process.env.CLOUDFLARE_ACCOUNT_ID;
          const cfModel = PROVIDER_MODELS[modelId] || "@cf/meta/llama-3.1-8b-instruct";

          response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${cfToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ messages, stream: true }),
            }
          );
        } else {
          const apiKey = req.headers.get("x-api-key") || "";
          response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ model: modelId, messages, stream: true }),
          });
        }

        if (!response.ok || !response.body) {
          const t = await response.text();
          controller.enqueue(sseChunk("error", { message: `API error ${response.status}: ${t.slice(0, 200)}` }));
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const data = JSON.parse(payload);
              const delta =
                data.choices?.[0]?.delta?.content ||
                data.result?.response ||
                "";
              if (delta) {
                accumulated += delta;
                controller.enqueue(sseChunk("file_chunk", { path: filePath, chunk: delta }));
              }
            } catch {}
          }
        }

        controller.enqueue(sseChunk("file_end", { path: filePath, content: accumulated }));
      } catch (err) {
        controller.enqueue(sseChunk("error", { message: (err as Error).message }));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  });
}
