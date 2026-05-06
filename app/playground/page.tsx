"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Copy, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const models = [
  { value: "anthropic|claude-sonnet-4-6", label: "Claude Sonnet (Built-in)" },
  { value: "anthropic|claude-haiku-4-5", label: "Claude Haiku (Built-in)" },
  { value: "gemini|gemini-2.5-flash", label: "Gemini 2.5 Flash (Built-in)" },
  { value: "replit|gpt-5-mini", label: "GPT-5 Mini (Built-in)" },
];

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("Create a React landing page component with hero section");
  const [selectedModel, setSelectedModel] = useState("anthropic|claude-sonnet-4-6");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Enter a prompt");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      const [modelSource, modelId] = selectedModel.split("|");

      const response = await fetch("/api/public/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          modelSource,
          modelId,
          filePath: "generated.tsx",
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data:")) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.chunk) {
                setOutput((prev) => prev + data.chunk);
                if (outputRef.current) {
                  outputRef.current.scrollTop = outputRef.current.scrollHeight;
                }
              }
              if (data.error) {
                toast.error(data.error.message || "Generation failed");
                setLoading(false);
                return;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      toast.success("Generation complete!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  const downloadOutput = () => {
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(output));
    element.setAttribute("download", "generated.tsx");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text cursor-pointer hover:opacity-80">
              NJIRLAH Playground
            </h1>
          </Link>
          <div className="flex gap-2">
            <Link href="/docs">
              <Button variant="outline" size="sm">
                Docs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-200px)]">
          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <Card className="bg-white/5 border-white/10 flex-1 flex flex-col p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Prompt</h3>

              {/* Model Selector */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-400 mb-2 block">MODEL</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {models.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-white">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prompt Input */}
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-600 resize-none mb-4 p-3"
              />

              {/* Action Buttons */}
              <div className="flex gap-2">
                <motion.button
                  onClick={handleGenerate}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Generate
                    </>
                  )}
                </motion.button>

                <button
                  onClick={() => setOutput("")}
                  disabled={!output}
                  className="px-4 py-2.5 border border-white/20 hover:border-white/40 text-white rounded-lg transition disabled:opacity-30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
                <p className="font-semibold mb-1">Rate Limit Info</p>
                <p>Public API: 10 requests/minute per IP</p>
                <p className="mt-1">
                  <Link href="/dashboard" className="text-cyan-400 hover:underline">
                    Get an API key
                  </Link>{" "}
                  for higher limits
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Output Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <Card className="bg-white/5 border-white/10 flex-1 flex flex-col p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Generated Code</h3>
                {output && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyOutput}
                      className="p-2 hover:bg-white/10 rounded transition text-gray-400 hover:text-white"
                      title="Copy"
                    >
                      {copiedOutput ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={downloadOutput}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-gray-300 transition"
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>

              <div
                ref={outputRef}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg p-4 overflow-auto font-mono text-sm text-cyan-300"
              >
                {!output ? (
                  <div className="text-gray-600 text-center py-12">
                    Generated code will appear here...
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap break-words">{output}</pre>
                )}
              </div>

              {/* Stats */}
              {output && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded p-3 text-center">
                    <p className="text-xs text-gray-500">Characters</p>
                    <p className="text-lg font-semibold text-cyan-400">{output.length}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded p-3 text-center">
                    <p className="text-xs text-gray-500">Lines</p>
                    <p className="text-lg font-semibold text-cyan-400">{output.split("\n").length}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded p-3 text-center">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-lg font-semibold text-green-400">Ready</p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-lg text-center">
          <p className="text-gray-400 mb-3">
            Want to integrate with your app? Check out the{" "}
            <Link href="/docs" className="text-cyan-400 hover:underline">
              API documentation
            </Link>
          </p>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600">
              Get Started with API Keys
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
