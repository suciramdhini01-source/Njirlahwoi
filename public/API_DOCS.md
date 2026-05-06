# NJIRLAH AI - Public API Documentation

Generate code from prompts using NJIRLAH AI. Works from anywhere — web, CLI, server, mobile.

## Base URL

```
https://njirlah.ai
```

## Endpoints

### POST `/api/public/generate`

Generate code from a natural language prompt. Returns Server-Sent Events (SSE) stream.

#### Request

```json
{
  "prompt": "Create a React landing page with hero section",
  "modelSource": "anthropic",
  "modelId": "claude-sonnet-4-6",
  "filePath": "app/page.tsx",
  "apiKey": "sk_or_...",
  "cfToken": "Bearer ...",
  "cfAccountId": "abc123"
}
```

**Required Fields:**
- `prompt` (string) - Description of what you want to generate

**Optional Fields:**
- `modelSource` (string) - Default: `"anthropic"`
  - `"anthropic"` - Anthropic Claude (built-in)
  - `"gemini"` - Google Gemini (built-in)
  - `"replit"` - OpenAI via Replit (built-in)
  - `"openrouter"` - OpenRouter (requires `apiKey`)
  - `"cloudflare"` - Cloudflare Workers AI (requires `cfToken` + `cfAccountId`)

- `modelId` (string) - Specific model to use
  - Anthropic: `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`
  - Gemini: `gemini-3.1-pro-preview`, `gemini-2.5-flash`
  - Replit: `gpt-5.4`, `gpt-5-mini`, `o3`
  - Default: First available model for the source

- `filePath` (string) - Output file path. Default: `"generated.ts"`
- `apiKey` (string) - For BYOK (OpenRouter)
- `cfToken`, `cfAccountId` (string) - For BYOK (Cloudflare)

#### Response

Server-Sent Events stream:

```
event: file_chunk
data: {"path":"app/page.tsx","chunk":"export default function Page() {"}

event: file_chunk
data: {"path":"app/page.tsx","chunk":"\n  return ("}

event: file_end
data: {"path":"app/page.tsx"}

event: done
data: {}
```

**Events:**
- `file_start` - Code generation started
- `file_chunk` - Chunk of generated code
- `file_end` - Generation complete for file
- `file_rewrite` - Full rewrite of file (fence cleanup)
- `agent_log` - Debug log message
- `error` - Error occurred
- `done` - Request complete

#### Rate Limits

- **10 requests per 60 seconds** per IP
- No API key required for built-in providers
- BYOK providers subject to their own limits

Response headers include:
```
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1609459200
```

#### Error Responses

**400 Bad Request** - Missing required fields:
```json
{
  "error": "Missing 'prompt' field"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "error": "Rate limit exceeded"
}
```

**503 Service Unavailable** - Provider not configured:
```json
{
  "error": "Anthropic integration not configured"
}
```

---

### POST `/api/public/share`

Create shareable link for a workspace project.

#### Request

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response

```json
{
  "shareUrl": "https://njirlah.ai/share/a1b2c3?projectId=...",
  "embedUrl": "https://njirlah.ai/embed/a1b2c3?projectId=...&mode=view",
  "forkUrl": "https://njirlah.ai/workspace/new?fork=..."
}
```

---

## Examples

### cURL

```bash
curl -X POST "https://njirlah.ai/api/public/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "TypeScript function to fetch data from API and cache it",
    "modelSource": "anthropic",
    "modelId": "claude-sonnet-4-6"
  }'
```

### JavaScript/Node.js

```javascript
const response = await fetch("https://njirlah.ai/api/public/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "Create a Next.js API route for user authentication",
    modelSource: "gemini",
  }),
});

const reader = response.body.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  const text = new TextDecoder().decode(value);
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("data:")) {
      const data = JSON.parse(line.slice(5));
      console.log(data.chunk);
    }
  }
}
```

### Python

```python
import requests
import json

url = "https://njirlah.ai/api/public/generate"
payload = {
    "prompt": "Python FastAPI endpoint for WebSocket chat",
    "modelSource": "anthropic"
}

response = requests.post(url, json=payload, stream=True)

for line in response.iter_lines():
    if line.startswith(b"data:"):
        data = json.loads(line[5:])
        print(data.get("chunk", ""), end="")
```

### CLI (via @njirlah/cli)

```bash
npm install -g @njirlah/cli

njirlah build "Create a React hook for managing form state" --model gemini
```

---

## Best Practices

1. **Use Streaming**: Always consume SSE stream to get real-time output
2. **Error Handling**: Check for `error` events in stream
3. **Rate Limiting**: Implement exponential backoff for 429 responses
4. **Large Prompts**: Keep prompts concise for faster generation
5. **Model Selection**: Use `anthropic` for quality, `gemini` for speed

## Authentication

Public API does not require authentication for built-in providers.

For BYOK (OpenRouter / Cloudflare), provide credentials in request body:
```json
{
  "prompt": "...",
  "modelSource": "openrouter",
  "apiKey": "sk_or_YOUR_KEY"
}
```

Credentials are **never stored or logged**.

## Support

- Docs: https://njirlah.ai/docs
- Issues: https://github.com/njirlah/njirlah-ai/issues
- Discord: https://discord.gg/njirlah
