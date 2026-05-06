# @njirlah/cli

Generate code from prompts using NJIRLAH AI from your terminal.

## Installation

```bash
npm install -g @njirlah/cli
```

## Usage

### Generate Code

```bash
njirlah build "Create a React landing page component"
```

Options:
- `-m, --model <model>` - AI model (default: anthropic)
  - `anthropic` - Anthropic Claude
  - `gemini` - Google Gemini
  - `replit` - OpenAI via Replit
  - `openrouter` - OpenRouter (requires API key)
  - `cloudflare` - Cloudflare Workers AI (requires token)

- `-o, --output <path>` - Output directory (default: ./generated)

- `--api-key <key>` - API key for BYOK providers

- `--base-url <url>` - NJIRLAH API base URL (default: https://njirlah.ai)

### Examples

**Generate with default Anthropic:**
```bash
njirlah build "TypeScript utility to parse JSON"
```

**Generate with Gemini:**
```bash
njirlah build "React hooks for form validation" --model gemini
```

**Generate with OpenRouter (BYOK):**
```bash
njirlah build "Python CLI tool" --model openrouter --api-key sk_or_...
```

**Custom output:**
```bash
njirlah build "Next.js API route" --output ./src/api
```

## Output

Generated code is saved to `<output>/generated.ts` by default.

## Rate Limiting

Public API has rate limits:
- 10 requests per 60 seconds per IP

Use a personal API key or host your own NJIRLAH instance for higher limits.

## API

Use the public API directly:

```bash
curl -X POST "https://njirlah.ai/api/public/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "React counter component",
    "modelSource": "anthropic",
    "modelId": "claude-sonnet-4-6"
  }'
```

Response: SSE stream with `file_chunk` events.

## License

MIT
