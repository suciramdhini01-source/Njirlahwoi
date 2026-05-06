// Handles 4 SSE formats in one helper:
// 1. OpenAI:           data: {"choices":[{"delta":{"content":"..."}}]}
// 2. Cloudflare:       data: {"result":"..."}   OR   {"response":"..."}
// 3. Anthropic/Gemini: data: {"content":"..."} + data: {"done":true}
// 4. Terminator:       data: [DONE]

export async function readSSEStream(
  res: Response,
  onDelta: (delta: string) => void,
  onDone?: () => void
): Promise<void> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() || "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      if (payload === "[DONE]") {
        onDone?.();
        return;
      }
      try {
        const json = JSON.parse(payload);
        // OpenAI
        const openai = json?.choices?.[0]?.delta?.content;
        if (typeof openai === "string") {
          onDelta(openai);
          continue;
        }
        // Cloudflare
        if (typeof json?.response === "string") {
          onDelta(json.response);
          continue;
        }
        if (typeof json?.result === "string") {
          onDelta(json.result);
          continue;
        }
        if (typeof json?.result?.response === "string") {
          onDelta(json.result.response);
          continue;
        }
        // Anthropic / Gemini
        if (typeof json?.content === "string") {
          onDelta(json.content);
          continue;
        }
        if (json?.done === true) {
          onDone?.();
          return;
        }
      } catch {
        // ignore malformed chunk
      }
    }
  }
  onDone?.();
}
