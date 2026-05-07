# Njirlah Mock API

A custom OpenAI-compatible API server that always returns **"Njirlah"**. Deploy anywhere, use with any OpenAI SDK.

## Quick Start

```bash
cd packages/mock-api
npm install
npm start
```

Server runs at `http://localhost:3001`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/v1/models` | List available models |
| POST | `/v1/chat/completions` | Chat completion (streaming + non-streaming) |

## Client Usage

### With OpenAI SDK (Node.js)

```bash
npm install openai
```

```js
const { OpenAI } = require("openai");

const client = new OpenAI({
  apiKey: "sk-njirlah-mock",
  baseURL: "http://localhost:3001/v1",  // ← your deployed URL here
});

const response = await client.chat.completions.create({
  model: "njirlah-v1",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content); // "Njirlah"
```

### With curl

```bash
curl http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "njirlah-v1",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Streaming

```bash
curl http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "njirlah-v1",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `API_KEY` | (none) | If set, requires `Authorization: Bearer <key>` header |

## Deployment

### Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your repo or use **Deploy from CLI**
3. Set:
   - **Build Command:** `cd packages/mock-api && npm install`
   - **Start Command:** `cd packages/mock-api && npm start`
4. Add environment variable `API_KEY` if you want auth
5. Deploy — your URL will be `https://your-app.onrender.com/v1`

### Railway

1. Create a new project on [railway.app](https://railway.app)
2. Add a **Node** service from your repo
3. Set **Root Directory** to `packages/mock-api`
4. Add `API_KEY` env var if needed
5. Deploy — Railway auto-detects `npm start`

### Fly.io

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/)
2. From `packages/mock-api/`, run:

```bash
fly launch
fly deploy
```

3. Set secrets: `fly secrets set API_KEY=your-secret-key`

### Docker

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY index.js ./
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t njirlah-mock-api .
docker run -p 3001:3001 -e API_KEY=your-secret njirlah-mock-api
```

## Testing

After deploying, verify with:

```bash
# Health check
curl https://your-url.onrender.com/

# Chat completion
curl https://your-url.onrender.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"njirlah-v1","messages":[{"role":"user","content":"test"}]}'

# Expected response:
# {
#   "id": "chatcmpl-...",
#   "object": "chat.completion",
#   "created": 1700000000,
#   "model": "njirlah-v1",
#   "choices": [{
#     "index": 0,
#     "message": { "role": "assistant", "content": "Njirlah" },
#     "finish_reason": "stop"
#   }],
#   "usage": { "prompt_tokens": 0, "completion_tokens": 1, "total_tokens": 1 }
# }
```

## Integration with NJIRLAH AI

To use this mock API in the NJIRLAH AI chat app, set the OpenRouter base URL to your deployed mock API URL in the proxy route:

```ts
// app/api/openrouter/chat/route.ts
const BASE_URL = process.env.MOCK_API_URL || "https://openrouter.ai/api/v1";
```

Then set `MOCK_API_URL=https://your-deployed-url.com/v1` in your environment.
