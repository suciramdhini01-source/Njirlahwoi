# Edge Function Deployment Guide

## nj-file-builtin Edge Function

This edge function **securely proxies code generation requests** to Bolt-supplied AI providers (Anthropic, Gemini, OpenAI/Replit) without exposing API keys to the browser.

### Location
- **Source**: `supabase/functions/nj-file-builtin/index.ts`
- **Endpoint**: `https://<supabase-url>/functions/v1/nj-file-builtin`

### Required Environment Secrets

Set these in your Supabase project's Edge Function Secrets panel:

1. **ANTHROPIC_API_KEY** (optional)
   - Get from: https://console.anthropic.com/
   - Used by: Built-in Anthropic Claude models

2. **GEMINI_API_KEY** (optional)
   - Get from: https://ai.google.dev/
   - Used by: Built-in Google Gemini models

3. **OPENAI_API_KEY** (required for Replit/Bolt)
   - Get from: Bolt AI dashboard or your Replit workspace
   - Used by: OpenAI-compatible models on Replit

4. **OPENAI_BASE_URL** (required for Replit/Bolt)
   - Example: `https://api.openai.com/v1` or your Replit proxy URL
   - Used by: Replit OpenAI endpoint

### Deployment Steps

#### Option 1: Supabase Dashboard (Recommended)

1. Navigate to your Supabase project → **Edge Functions**
2. Click **Create new function**
3. Name: `nj-file-builtin`
4. Copy entire contents of `supabase/functions/nj-file-builtin/index.ts` into the editor
5. Click **Deploy**
6. Go to **Settings** → **Edge Function Secrets**
7. Add the required secrets above
8. Function is now live at: `https://<your-project>.supabase.co/functions/v1/nj-file-builtin`

#### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-id>

# Set secrets
supabase secrets set ANTHROPIC_API_KEY=<key>
supabase secrets set GEMINI_API_KEY=<key>
supabase secrets set OPENAI_API_KEY=<key>
supabase secrets set OPENAI_BASE_URL=<url>

# Deploy function
supabase functions deploy nj-file-builtin
```

### How It Works

1. **Request Flow**:
   ```
   Next.js Route (/api/agent/file)
         ↓ [delegates built-in sources]
   Edge Function (nj-file-builtin)
         ↓ [reads Supabase Secrets]
   Provider API (Anthropic/Gemini/OpenAI)
         ↓ [streams response]
   Client [no key exposure]
   ```

2. **Provider Detection**:
   - `modelSource === "anthropic"` → calls `callAnthropic()`
   - `modelSource === "gemini"` → calls `callGemini()`
   - `modelSource === "replit"` → calls `callReplit()`

3. **Stream Handling**:
   - Per-provider delta extraction (Anthropic SSE format differs from OpenAI)
   - Timeout guard: 55 seconds max per file
   - CORS headers: `*` (allows browser requests)

### Testing

Once deployed, verify with:

```bash
curl -X POST "https://<supabase-url>/functions/v1/nj-file-builtin" \
  -H "Content-Type: application/json" \
  -d '{
    "modelSource": "anthropic",
    "modelId": "claude-sonnet-4-6",
    "prompt": "Hello",
    "filePath": "test.ts",
    "filePurpose": "Test",
    "existingFiles": []
  }'
```

Expected response: SSE stream with `file_chunk` events.

### Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `ANTHROPIC_API_KEY not configured` | Secret not set | Add to Edge Function Secrets |
| `Gemini error 401` | Invalid key | Verify key at ai.google.dev |
| `Timeout: generation exceeded 55s` | Model too slow | Reduce max_tokens or use faster model |
| `No response body` | Provider unreachable | Check internet connectivity |

### Monitoring

Check function logs in Supabase Dashboard:
- **Functions** → **nj-file-builtin** → **Logs**

### Security Notes

- Secrets are **encrypted at rest** in Supabase
- Secrets are **never logged** to browser/client
- Edge function runs in isolated Deno runtime
- CORS allows only JSON requests from authorized clients (all origins via `*`)
- Request/response stream never persisted to logs

### Rollback

To disable without deleting:
1. Remove all secrets
2. Function will return 503 for all requests
3. Next.js route will fall back to inline handling (for BYOK sources)
