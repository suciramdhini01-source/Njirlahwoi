/**
 * Njirlah Mock API — Client SDK Example
 *
 * Demonstrates how to call the mock API using the official OpenAI SDK.
 * Works with any OpenAI-compatible client — just change the baseURL.
 *
 * Usage:
 *   1. Install:  npm install openai
 *   2. Run:      node client.js
 *   3. Or set:   NJIRLAH_API_URL=https://your-deployed-url.com node client.js
 */

const { OpenAI } = require("openai");

// ── Configuration ────────────────────────────────────────────────────────────
// Replace this URL with your deployed server URL (e.g. Render, Railway, Fly.io)
const BASE_URL = process.env.NJIRLAH_API_URL || "http://localhost:3001/v1";

// Optional: set if your server has API_KEY configured
const API_KEY = process.env.NJIRLAH_API_KEY || "sk-njirlah-mock";

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: BASE_URL,
});

// ── Example 1: Non-streaming chat completion ────────────────────────────────

async function chatBasic() {
  console.log("\n── Example 1: Basic chat completion ──\n");

  const response = await client.chat.completions.create({
    model: "njirlah-v1",
    messages: [
      { role: "user", content: "Hello, who are you?" },
    ],
  });

  console.log("Response ID:", response.id);
  console.log("Model:", response.model);
  console.log("Content:", response.choices[0].message.content);
  console.log("Finish reason:", response.choices[0].finish_reason);
}

// ── Example 2: Streaming chat completion ────────────────────────────────────

async function chatStreaming() {
  console.log("\n── Example 2: Streaming chat completion ──\n");

  const stream = await client.chat.completions.create({
    model: "njirlah-v1",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Tell me something cool." },
    ],
    stream: true,
  });

  process.stdout.write("Streamed content: ");
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    process.stdout.write(content);
  }
  console.log("\n");
}

// ── Example 3: List available models ────────────────────────────────────────

async function listModels() {
  console.log("\n── Example 3: List models ──\n");

  const models = await client.models.list();
  for (const model of models.data) {
    console.log(`  ${model.id} (owned by: ${model.owned_by})`);
  }
}

// ── Example 4: Multi-turn conversation ──────────────────────────────────────

async function chatMultiTurn() {
  console.log("\n── Example 4: Multi-turn conversation ──\n");

  const messages = [
    { role: "user", content: "What is 2+2?" },
    { role: "assistant", content: "4" },
    { role: "user", content: "And what is that plus 3?" },
  ];

  const response = await client.chat.completions.create({
    model: "njirlah-v1-turbo",
    messages,
  });

  console.log("Assistant:", response.choices[0].message.content);
}

// ── Run all examples ────────────────────────────────────────────────────────

async function main() {
  try {
    await chatBasic();
    await chatStreaming();
    await listModels();
    await chatMultiTurn();
  } catch (err) {
    console.error("Error:", err.message);
    if (err.status) console.error("Status:", err.status);
    process.exit(1);
  }
}

main();
