"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text cursor-pointer hover:opacity-80">
              NJIRLAH Pricing
            </h1>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm">
              Back Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">Transparent Pricing</h2>
          <p className="text-xl text-gray-400">Pay only for what you use. Scale as you grow.</p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              tier: "Free",
              price: "$0",
              monthly: "Forever free",
              requests: "10 requests/min",
              features: [
                "Built-in models (Anthropic, Gemini, Replit)",
                "Basic code generation",
                "Public project sharing",
                "Community support via Discord",
                "1 day project retention",
              ],
            },
            {
              tier: "Pro",
              price: "$29",
              monthly: "per month",
              requests: "1000 requests/min",
              features: [
                "Everything in Free",
                "Higher rate limits",
                "Private projects",
                "Usage analytics dashboard",
                "Email support (24h response)",
                "API key management",
                "90 day project retention",
                "Team collaboration (5 seats)",
              ],
              popular: true,
            },
            {
              tier: "Enterprise",
              price: "Custom",
              monthly: "Contact sales",
              requests: "Unlimited",
              features: [
                "Everything in Pro",
                "Dedicated support",
                "Custom rate limits",
                "SSO / SAML",
                "Unlimited team seats",
                "SLA guarantee (99.9%)",
                "On-premise deployment option",
                "Custom integrations",
              ],
            },
          ].map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card
                className={`p-8 h-full flex flex-col ${
                  plan.popular
                    ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/50 ring-1 ring-cyan-500/20"
                    : "bg-white/5 border-white/10"
                }`}
              >
                {plan.popular && (
                  <span className="text-xs font-bold text-cyan-400 mb-4 uppercase tracking-widest">
                    ★ Most Popular
                  </span>
                )}

                <h3 className="text-3xl font-bold text-white mb-2">{plan.tier}</h3>
                <div className="text-4xl font-bold text-cyan-400 mb-1">{plan.price}</div>
                <p className="text-sm text-gray-500 mb-6">{plan.monthly}</p>

                <div className="bg-white/5 border border-white/10 rounded px-4 py-2 mb-6 text-center">
                  <p className="text-sm font-semibold text-cyan-400">{plan.requests}</p>
                </div>

                <Button
                  className={`w-full mb-8 ${
                    plan.popular ? "bg-gradient-to-r from-cyan-600 to-blue-600" : ""
                  }`}
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                <div className="space-y-3 flex-1">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h3>

          <div className="space-y-4">
            {[
              {
                q: "Can I try for free?",
                a: "Yes! Free plan includes 10 requests/min with all built-in models. No credit card required.",
              },
              {
                q: "How are requests counted?",
                a: "Each API call counts as 1 request, regardless of size or complexity.",
              },
              {
                q: "What happens if I exceed my limit?",
                a: "We'll return a 429 error. You can upgrade instantly or wait for the next minute.",
              },
              {
                q: "Can I upgrade or downgrade anytime?",
                a: "Yes, any time. Pro features activate immediately. No long-term contracts.",
              },
              {
                q: "Do you offer discounts for annual billing?",
                a: "Yes! Annual plans get 20% off. Contact us for details.",
              },
              {
                q: "What about privacy?",
                a: "We don't store prompts or generated code. Data is encrypted in transit and at rest.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <p className="font-semibold text-white mb-2">{item.q}</p>
                <p className="text-sm text-gray-400">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <h4 className="text-2xl font-bold text-white mb-4">Start building today</h4>
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600">
                Start Free
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline">View Docs</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
