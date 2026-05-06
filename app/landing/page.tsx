"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Code2, Zap, Shield, BarChart3, Users, Play } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text">
              NJIRLAH
            </h1>
            <p className="text-xs text-gray-500">AI Code Generation Platform</p>
          </div>

          <nav className="hidden sm:flex gap-6 text-sm">
            <Link href="/docs" className="text-gray-400 hover:text-white transition">
              Docs
            </Link>
            <Link href="/playground" className="text-gray-400 hover:text-white transition">
              Playground
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-white transition">
              Pricing
            </Link>
          </nav>

          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/">
              <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-blue-600">
                Start Building
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Generate Code with <span className="text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text">AI</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Turn natural language prompts into production-ready code. Lightning-fast, powerful, and free to start.
          </p>

          <div className="flex gap-3 justify-center mb-12">
            <Link href="/">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 px-8">
                Start Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/playground">
              <Button size="lg" variant="outline" className="px-8">
                <Play className="mr-2 w-4 h-4" /> Try Playground
              </Button>
            </Link>
          </div>

          <div className="text-sm text-gray-500">
            No credit card required • All models included • Deploy instantly
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-white text-center mb-12">Powerful Features</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Code2,
              title: "Multiple Models",
              desc: "Anthropic, Google Gemini, OpenAI, and more. Choose the best for your needs.",
            },
            {
              icon: Zap,
              title: "Lightning Fast",
              desc: "Streaming responses in milliseconds. See results as they're generated.",
            },
            {
              icon: Shield,
              title: "Secure & Private",
              desc: "API keys stored safely. Your code, your data. No tracking.",
            },
            {
              icon: BarChart3,
              title: "Usage Analytics",
              desc: "Track requests, latency, and costs in real-time dashboard.",
            },
            {
              icon: Users,
              title: "Team Ready",
              desc: "Share projects, collaborate, and fork code from the community.",
            },
            {
              icon: Code2,
              title: "SDKs & CLIs",
              desc: "Use via Web, API, CLI, or integrate with your workflow.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/5 border-white/10 p-6 hover:border-cyan-500/50 transition h-full">
                <f.icon className="w-8 h-8 text-cyan-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">{f.title}</h4>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* API Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="text-3xl font-bold text-white mb-6">Public API for Everyone</h3>
            <p className="text-gray-400 mb-4">
              Access NJIRLAH from your backend, CLI, or any application. No authentication required to get started.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "RESTful API with streaming",
                "Rate-limited for fair use",
                "Optional API keys for higher limits",
                "SDKs for JavaScript, Python, Go",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/docs">
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600">
                View API Docs <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-black/40 border border-white/10 rounded-lg p-6 font-mono text-sm"
          >
            <pre className="text-cyan-300 whitespace-pre-wrap break-words text-xs">
              {`curl -X POST https://njirlah.ai/api/public/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "React button component",
    "modelSource": "anthropic"
  }'

event: file_chunk
data: {"chunk":"export default..."}

event: done
data: {}`}
            </pre>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-white text-center mb-12">Simple Pricing</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              tier: "Free",
              price: "$0",
              requests: "10/min",
              features: ["Basic models", "Public projects", "Community support"],
            },
            {
              tier: "Pro",
              price: "$29/mo",
              requests: "1000/min",
              features: ["All models", "Private projects", "Priority support", "Usage analytics"],
              popular: true,
            },
            {
              tier: "Enterprise",
              price: "Custom",
              requests: "Unlimited",
              features: ["Dedicated support", "Custom deployments", "SLA guarantee"],
            },
          ].map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card
                className={`p-8 h-full flex flex-col ${
                  p.popular
                    ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/50 scale-105"
                    : "bg-white/5 border-white/10"
                }`}
              >
                {p.popular && (
                  <span className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h4 className="text-2xl font-bold text-white mb-1">{p.tier}</h4>
                <div className="text-3xl font-bold text-cyan-400 mb-2">{p.price}</div>
                <p className="text-sm text-gray-500 mb-6">{p.requests} API requests</p>

                <ul className="space-y-2 flex-1 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button className={p.popular ? "w-full bg-gradient-to-r from-cyan-600 to-blue-600" : "w-full border border-white/20"}>
                  Get Started
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h3 className="text-4xl font-bold text-white mb-6">Ready to build with AI?</h3>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 px-8">
              Start Free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="/docs">
            <Button size="lg" variant="outline" className="px-8">
              Documentation
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md mt-20 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p className="mb-4">
            Built with love by <span className="text-pink-400">Andikaa Saputraa</span>
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/docs" className="hover:text-white transition">
              Docs
            </Link>
            <Link href="/playground" className="hover:text-white transition">
              Playground
            </Link>
            <a href="https://github.com/njirlah" className="hover:text-white transition">
              GitHub
            </a>
            <a href="https://twitter.com/njirlah" className="hover:text-white transition">
              Twitter
            </a>
          </div>
          <p className="mt-6">© {new Date().getFullYear()} NJIRLAH. Free and open to all.</p>
        </div>
      </footer>
    </div>
  );
}
