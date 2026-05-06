"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const codeExamples = {
  curl: `curl -X POST "https://njirlah.ai/api/public/generate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Create a React landing page",
    "modelSource": "anthropic",
    "modelId": "claude-sonnet-4-6"
  }'`,

  javascript: `const response = await fetch("https://njirlah.ai/api/public/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "Create a React landing page",
    modelSource: "anthropic"
  })
});

const reader = response.body.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  const text = new TextDecoder().decode(value);
  console.log(text);
}`,

  python: `import requests
import json

response = requests.post(
  "https://njirlah.ai/api/public/generate",
  json={
    "prompt": "Create a React landing page",
    "modelSource": "anthropic"
  },
  stream=True
)

for line in response.iter_lines():
  if line.startswith(b"data:"):
    data = json.loads(line[5:])
    print(data.get("chunk", ""), end="")`,

  typescript: `interface GenerateRequest {
  prompt: string;
  modelSource?: "anthropic" | "gemini" | "replit" | "openrouter" | "cloudflare";
  modelId?: string;
  apiKey?: string; // for BYOK
}

async function generate(req: GenerateRequest) {
  const response = await fetch("https://njirlah.ai/api/public/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req)
  });

  for await (const chunk of response.body!) {
    console.log(new TextDecoder().decode(chunk));
  }
}`,
};

const models = [
  { source: "anthropic", name: "Claude Opus", id: "claude-opus-4-7", tier: "built-in" },
  { source: "anthropic", name: "Claude Sonnet", id: "claude-sonnet-4-6", tier: "built-in" },
  { source: "anthropic", name: "Claude Haiku", id: "claude-haiku-4-5", tier: "built-in" },
  { source: "gemini", name: "Gemini 3.1 Pro", id: "gemini-3.1-pro-preview", tier: "built-in" },
  { source: "gemini", name: "Gemini 2.5 Flash", id: "gemini-2.5-flash", tier: "built-in" },
  { source: "replit", name: "GPT-5.4", id: "gpt-5.4", tier: "built-in" },
  { source: "openrouter", name: "Meta Llama 2", id: "meta-llama/llama-2-70b-chat", tier: "byok" },
  { source: "cloudflare", name: "Llama 2 7B", id: "@cf/meta/llama-2-7b-chat-fp16", tier: "byok" },
];

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text cursor-pointer hover:opacity-80">
              NJIRLAH API
            </h1>
          </Link>
          <div className="flex gap-3">
            <Link href="/playground">
              <Button variant="outline" size="sm">
                Try It Now
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-blue-600">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            AI Code Generation API
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Turn natural language into production-ready code. Fast, reliable, and easy to use.
          </p>
        </motion.div>

        {/* Quick Start */}
        <Card className="bg-white/5 border-white/10 p-8 mb-16">
          <h3 className="text-2xl font-bold text-white mb-6">Quick Start</h3>

          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="mb-4 bg-white/5 border border-white/10">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            </TabsList>

            {Object.entries(codeExamples).map(([key, code]) => (
              <TabsContent key={key} value={key}>
                <div className="relative">
                  <pre className="bg-black/60 border border-white/10 rounded-lg p-4 text-sm text-cyan-300 font-mono overflow-x-auto max-h-64">
                    {code}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(code, key)}
                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded transition flex items-center gap-1 text-xs text-gray-400"
                  >
                    {copiedCode === key ? (
                      <>
                        <Check className="w-4 h-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>

        {/* Models Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-6">Available Models</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {models.map((model, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-white/5 border-white/10 hover:border-cyan-500/50 p-4 cursor-pointer transition h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{model.name}</p>
                      <p className="text-xs text-gray-500">{model.source}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-mono ${
                        model.tier === "built-in"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {model.tier}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono truncate">{model.id}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* API Reference */}
        <Card className="bg-white/5 border-white/10 p-8 mb-16">
          <h3 className="text-2xl font-bold text-white mb-6">API Reference</h3>

          <div className="space-y-8">
            {/* POST /api/public/generate */}
            <div>
              <h4 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-sm font-mono">
                  POST
                </span>
                /api/public/generate
              </h4>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-300 font-semibold mb-2">Request Body</p>
                  <pre className="bg-black/40 border border-white/10 rounded p-3 text-gray-400 font-mono text-xs overflow-x-auto">
                    {`{
  "prompt": "string",                    // Required
  "modelSource": "anthropic|gemini|...", // Optional (default: anthropic)
  "modelId": "string",                   // Optional
  "filePath": "string",                  // Optional
  "apiKey": "string"                     // For BYOK providers
}`}
                  </pre>
                </div>

                <div>
                  <p className="text-gray-300 font-semibold mb-2">Response (SSE Stream)</p>
                  <pre className="bg-black/40 border border-white/10 rounded p-3 text-gray-400 font-mono text-xs overflow-x-auto">
                    {`event: file_chunk
data: {"chunk":"export default function..."}

event: file_end
data: {"path":"app.tsx"}

event: done
data: {}`}
                  </pre>
                </div>

                <div>
                  <p className="text-gray-300 font-semibold mb-2">Rate Limits</p>
                  <div className="bg-black/40 border border-white/10 rounded p-3 space-y-1 text-gray-400 text-xs">
                    <p>• Public API: 10 requests/minute per IP</p>
                    <p>• With API key: 100+ requests/minute (upgradeable)</p>
                    <p>• Rate limit headers: X-RateLimit-Remaining, X-RateLimit-Reset</p>
                  </div>
                </div>
              </div>
            </div>

            {/* POST /api/public/share */}
            <div>
              <h4 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-sm font-mono">
                  POST
                </span>
                /api/public/share
              </h4>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-300 font-semibold mb-2">Create Shareable Links</p>
                  <pre className="bg-black/40 border border-white/10 rounded p-3 text-gray-400 font-mono text-xs overflow-x-auto">
                    {`Request:
{ "projectId": "550e8400-..." }

Response:
{
  "shareUrl": "https://njirlah.ai/share/token",
  "embedUrl": "https://njirlah.ai/embed/token",
  "forkUrl": "https://njirlah.ai/workspace/new?fork=..."
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Auth & API Keys */}
        <Card className="bg-white/5 border-white/10 p-8">
          <h3 className="text-2xl font-bold text-white mb-4">Authentication</h3>

          <div className="space-y-4 text-sm text-gray-400">
            <p>
              <strong className="text-white">Built-in Models</strong> (Anthropic, Gemini, Replit):
              No authentication required. Rate limit: 10 req/min per IP.
            </p>
            <p>
              <strong className="text-white">BYOK Models</strong> (OpenRouter, Cloudflare): Pass
              credentials in request body.
            </p>
            <p>
              <strong className="text-white">API Keys</strong>: Generate keys in{" "}
              <Link href="/dashboard" className="text-cyan-400 hover:underline">
                dashboard
              </Link>{" "}
              for higher limits and usage tracking.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <Link href="/playground">
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                Try API Now <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Get API Key</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
