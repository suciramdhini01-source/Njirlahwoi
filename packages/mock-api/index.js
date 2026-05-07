const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || null; // Optional: set to require auth

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "1mb" }));

// Request logging
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ── Auth middleware (optional) ──────────────────────────────────────────────

function authCheck(req, res, next) {
  if (!API_KEY) return next(); // No key configured = open access

  const header = req.headers["authorization"] || "";
  const token = header.replace("Bearer ", "").trim();

  if (token !== API_KEY) {
    return res.status(401).json({
      error: {
        message: "Invalid API key provided.",
        type: "authentication_error",
        code: "invalid_api_key",
      },
    });
  }
  next();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  return "chatcmpl-" + crypto.randomBytes(16).toString("hex");
}

function createCompletion(payload, model) {
  const created = Math.floor(Date.now() / 1000);
  const id = generateId();

  return {
    id,
    object: "chat.completion",
    created,
    model: model || "njirlah-v1",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "Njirlah",
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 1,
      total_tokens: 1,
    },
  };
}

function createStreamingChunk(id, model, content, finishReason) {
  const created = Math.floor(Date.now() / 1000);
  return {
    id,
    object: "chat.completion.chunk",
    created,
    model: model || "njirlah-v1",
    choices: [
      {
        index: 0,
        delta: content ? { content } : {},
        finish_reason: finishReason || null,
      },
    ],
  };
}

// ── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get("/", (_req, res) => {
  res.json({
    service: "njirlah-mock-api",
    version: "1.0.0",
    status: "ok",
    endpoints: {
      chat: "/v1/chat/completions",
      models: "/v1/models",
    },
  });
});

// Models endpoint — mimics OpenAI's model list
app.get("/v1/models", authCheck, (_req, res) => {
  res.json({
    object: "list",
    data: [
      { id: "njirlah-v1", object: "model", created: 1700000000, owned_by: "njirlah" },
      { id: "njirlah-v1-turbo", object: "model", created: 1700000000, owned_by: "njirlah" },
      { id: "njirlah-v1-reasoning", object: "model", created: 1700000000, owned_by: "njirlah" },
    ],
  });
});

// Chat completions — the main endpoint
app.post("/v1/chat/completions", authCheck, (req, res) => {
  const { model, stream } = req.body;

  // Validate request body
  if (!req.body.messages || !Array.isArray(req.body.messages)) {
    return res.status(400).json({
      error: {
        message: "'messages' field is required and must be an array.",
        type: "invalid_request_error",
      },
    });
  }

  // ── Streaming response ──────────────────────────────────────────────────

  if (stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const id = generateId();

    // Send role delta first
    res.write(`data: ${JSON.stringify(createStreamingChunk(id, model, null, null, { role: "assistant" }))}\n\n`);

    // Send content
    res.write(`data: ${JSON.stringify(createStreamingChunk(id, model, "Njirlah"))}\n\n`);

    // Send finish
    res.write(`data: ${JSON.stringify(createStreamingChunk(id, model, null, "stop"))}\n\n`);

    // End stream
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  // ── Non-streaming response ──────────────────────────────────────────────

  return res.json(createCompletion(req.body, model));
});

// Catch-all for unsupported endpoints
app.use((_req, res) => {
  res.status(404).json({
    error: {
      message: "Endpoint not found. Available: GET /, GET /v1/models, POST /v1/chat/completions",
      type: "not_found",
    },
  });
});

// ── Start server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  Njirlah Mock API`);
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log(`  Auth: ${API_KEY ? "required (API_KEY set)" : "open (no API_KEY)"}\n`);
});
