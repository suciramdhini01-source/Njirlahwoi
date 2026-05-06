"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

const guides = [
  {
    title: "JavaScript/Node.js",
    id: "js",
    description: "Use NJIRLAH API in your Node.js or browser app",
    code: `import fetch from "node-fetch"; // or use native fetch in browser

async function generateCode(prompt) {
  const response = await fetch("https://njirlah.ai/api/public/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      modelSource: "anthropic"
    })
  });

  const reader = response.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = new TextDecoder().decode(value);
    process.stdout.write(text);
  }
}

generateCode("Create a React landing page");`,
  },
  {
    title: "Python",
    id: "python",
    description: "Integrate NJIRLAH with your Python projects",
    code: `import requests
import json

def generate_code(prompt, model="anthropic"):
    response = requests.post(
        "https://njirlah.ai/api/public/generate",
        json={
            "prompt": prompt,
            "modelSource": model
        },
        stream=True
    )

    for line in response.iter_lines():
        if line.startswith(b"data:"):
            data = json.loads(line[5:])
            if data.get("chunk"):
                print(data["chunk"], end="", flush=True)

# Usage
generate_code("Create FastAPI endpoint for user registration")`,
  },
  {
    title: "Go",
    id: "go",
    description: "Use NJIRLAH API in your Go applications",
    code: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func GenerateCode(prompt string) error {
    payload := map[string]string{
        "prompt": prompt,
        "modelSource": "anthropic",
    }

    body, _ := json.Marshal(payload)
    resp, err := http.Post(
        "https://njirlah.ai/api/public/generate",
        "application/json",
        bytes.NewBuffer(body),
    )
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    scanner := bufio.NewScanner(resp.Body)
    for scanner.Scan() {
        fmt.Println(scanner.Text())
    }
    return nil
}

func main() {
    GenerateCode("Create Go HTTP server with CORS")
}`,
  },
  {
    title: "cURL",
    id: "curl",
    description: "Quick testing with command-line curl",
    code: `curl -X POST "https://njirlah.ai/api/public/generate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Create a TypeScript utility for string manipulation",
    "modelSource": "anthropic",
    "modelId": "claude-sonnet-4-6"
  }'

# With authentication (API key)
curl -X POST "https://njirlah.ai/api/public/generate" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer nj_live_YOUR_KEY" \\
  -d '{
    "prompt": "Build a Next.js API route",
    "modelSource": "anthropic"
  }'`,
  },
];

const integrations = [
  {
    name: "CLI",
    desc: "Command-line interface for code generation",
    link: "/docs#cli",
    code: "npm install -g @njirlah/cli\nnjirlah build 'Create React component'",
  },
  {
    name: "VS Code Extension",
    desc: "Generate code directly in your editor",
    link: "https://marketplace.visualstudio.com",
    code: "Ctrl+Shift+G: Generate code",
  },
  {
    name: "GitHub Actions",
    desc: "Automate code generation in CI/CD",
    link: "/docs#github-actions",
    code: "uses: njirlah/generate@v1",
  },
];

export default function GuidesPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text cursor-pointer hover:opacity-80">
              Integration Guides
            </h1>
          </Link>
          <Link href="/docs" className="text-sm text-cyan-400 hover:underline">
            ← Back to Docs
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">SDK & Integration Guides</h2>
          <p className="text-lg text-gray-400">
            Use NJIRLAH API in your favorite programming language or tool
          </p>
        </motion.div>

        {/* Code Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <Tabs defaultValue="js" className="w-full">
            <TabsList className="mb-6 bg-white/5 border border-white/10 w-full justify-start">
              {guides.map((g) => (
                <TabsTrigger key={g.id} value={g.id} className="text-white">
                  {g.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {guides.map((guide) => (
              <TabsContent key={guide.id} value={guide.id}>
                <Card className="bg-white/5 border-white/10 p-6">
                  <p className="text-gray-400 mb-4">{guide.description}</p>

                  <div className="relative">
                    <pre className="bg-black/60 border border-white/10 rounded-lg p-4 text-sm text-cyan-300 font-mono overflow-x-auto max-h-96">
                      {guide.code}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(guide.code, guide.id)}
                      className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded transition flex items-center gap-1 text-xs text-gray-400"
                    >
                      {copiedCode === guide.id ? (
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
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-white mb-6">Popular Integrations</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {integrations.map((int, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/5 border-white/10 p-6 h-full flex flex-col">
                  <h4 className="text-lg font-semibold text-white mb-2">{int.name}</h4>
                  <p className="text-sm text-gray-400 mb-4 flex-1">{int.desc}</p>
                  <div className="bg-black/40 border border-white/10 rounded p-3 mb-4 font-mono text-xs text-gray-300 overflow-x-auto">
                    {int.code}
                  </div>
                  <a
                    href={int.link}
                    className="text-cyan-400 hover:underline text-sm font-semibold"
                  >
                    Learn More →
                  </a>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Best Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-white/5 border border-white/10 rounded-lg p-8"
        >
          <h3 className="text-2xl font-bold text-white mb-6">Best Practices</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Error Handling",
                tips: [
                  "Always check for 429 (rate limit) responses",
                  "Implement exponential backoff for retries",
                  "Log error messages for debugging",
                ],
              },
              {
                title: "Performance",
                tips: [
                  "Stream responses instead of buffering",
                  "Use connection pooling for multiple requests",
                  "Cache results when appropriate",
                ],
              },
              {
                title: "Security",
                tips: [
                  "Never hardcode API keys in source code",
                  "Use environment variables for secrets",
                  "Rotate keys regularly",
                ],
              },
              {
                title: "Monitoring",
                tips: [
                  "Track request latency and success rates",
                  "Set up alerts for rate limit approaching",
                  "Monitor error patterns",
                ],
              },
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold text-white mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.tips.map((tip, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <h4 className="text-2xl font-bold text-white mb-4">Ready to integrate?</h4>
          <Link href="/docs" className="text-cyan-400 hover:underline font-semibold">
            View Full API Documentation →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
