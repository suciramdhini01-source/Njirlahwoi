'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Globe, ChevronRight, Star, TrendingUp, Users } from 'lucide-react';

const STATS = [
  { value: '400+', label: 'Models available' },
  { value: '55+', label: 'AI providers' },
  { value: '1M+', label: 'Developers' },
  { value: '$0', label: 'To start' },
];

const PROVIDER_LOGOS = [
  { name: 'OpenAI', color: '#10a37f' },
  { name: 'Anthropic', color: '#c96442' },
  { name: 'Google', color: '#4285f4' },
  { name: 'Meta', color: '#0866ff' },
  { name: 'Mistral', color: '#f7a130' },
  { name: 'Cohere', color: '#39594d' },
  { name: 'DeepSeek', color: '#4d6bfe' },
  { name: 'xAI', color: '#1a1a1a' },
];

const FEATURES = [
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Unified API',
    description: 'Access every major AI provider through a single, OpenAI-compatible API endpoint. No more juggling multiple SDKs.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Automatic Fallbacks',
    description: 'Route requests to the best available provider. If one fails, another takes over automatically without downtime.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Cost Optimization',
    description: 'Compare real-time pricing across providers and route to the cheapest option that meets your quality requirements.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Performance Analytics',
    description: 'Detailed token usage, latency tracking, and cost breakdowns. Understand exactly what your AI is spending.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
];

const FEATURED_MODELS = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Fast, capable model for complex reasoning and coding tasks with a 200K context window.',
    context: '200K',
    inputPrice: '$3/M',
    outputPrice: '$15/M',
    badge: 'Popular',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'OpenAI flagship multimodal model with vision, audio, and advanced reasoning capabilities.',
    context: '128K',
    inputPrice: '$5/M',
    outputPrice: '$15/M',
    badge: 'Multimodal',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: 'Google\'s most capable model with a 1 million token context window for long documents.',
    context: '1M',
    inputPrice: '$3.5/M',
    outputPrice: '$10.5/M',
    badge: 'Long Context',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    description: 'Meta\'s open-source flagship model available through multiple high-performance providers.',
    context: '128K',
    inputPrice: '$0.35/M',
    outputPrice: '$0.40/M',
    badge: 'Open Source',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
];

const FREE_MODELS = [
  { name: 'Llama 3.1 8B (free)', provider: 'Meta · via various' },
  { name: 'Gemma 2 9B (free)', provider: 'Google · via various' },
  { name: 'Mistral 7B (free)', provider: 'Mistral · via various' },
  { name: 'Phi-3 Mini (free)', provider: 'Microsoft · via various' },
];

const ANNOUNCEMENTS = [
  {
    date: 'May 2026',
    title: 'Gemini 2.0 Flash now available with 1M context',
    description: 'Google\'s latest flash model brings significant speed improvements and expanded context.',
    tag: 'New Model',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    date: 'Apr 2026',
    title: 'DeepSeek R2 achieves top scores on coding benchmarks',
    description: 'The latest reasoning model from DeepSeek surpasses GPT-4 on several coding tasks.',
    tag: 'Benchmark',
    tagColor: 'bg-green-100 text-green-700',
  },
  {
    date: 'Apr 2026',
    title: 'Automatic provider fallback now supports 40+ providers',
    description: 'Improved routing logic ensures your requests always find the fastest available provider.',
    tag: 'Feature',
    tagColor: 'bg-amber-100 text-amber-700',
  },
];

const STEPS = [
  {
    step: '1',
    title: 'Create a free account',
    description: 'Sign up with your email or GitHub. No credit card required to get started with free models.',
  },
  {
    step: '2',
    title: 'Get your API key',
    description: 'Generate an API key in your dashboard. Use it anywhere you\'d use an OpenAI API key.',
  },
  {
    step: '3',
    title: 'Start building',
    description: 'Point your existing app at OpenRouter. Access any model with one consistent interface.',
  },
];

export default function OpenRouterHomePage() {
  return (
    <div className="pt-14">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6467F2]/5 via-white to-[#818DF8]/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 pt-20 pb-16 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6467F2]/10 text-[#6467F2] text-xs font-medium mb-6">
              <Star className="w-3 h-3" />
              The unified AI gateway
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
              Every AI model,{' '}
              <span className="text-[#6467F2]">one API</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
              Access hundreds of language models from the world's leading AI providers through a single, unified API. Compare, switch, and scale with zero lock-in.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="#"
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#6467F2] hover:bg-[#5558e8] rounded-full transition-colors duration-150 flex items-center gap-2"
              >
                Get started for free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/openrouter/models"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full transition-colors duration-150 flex items-center gap-2"
              >
                Browse models
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider logos strip */}
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <p className="text-center text-xs text-gray-400 uppercase tracking-wider mb-5 font-medium">
              Powered by the world's leading AI providers
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              {PROVIDER_LOGOS.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-gray-100 shadow-sm"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{p.name}</span>
                </div>
              ))}
              <div className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400">
                +47 more
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Built for developers who move fast
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Stop rebuilding integrations every time a new model drops. OpenRouter handles routing, fallbacks, and billing.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-150 group"
              >
                <div className={`w-9 h-9 rounded-lg ${f.bg} ${f.color} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Models */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured models</h2>
              <p className="text-sm text-gray-500 mt-1">Top-ranked models across all providers</p>
            </div>
            <Link
              href="/openrouter/models"
              className="text-sm text-[#6467F2] hover:text-[#5558e8] font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_MODELS.map((model) => (
              <div
                key={model.id}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#6467F2]/30 hover:shadow-md transition-all duration-150 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${model.badgeColor}`}>
                    {model.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#6467F2] transition-colors">
                  {model.name}
                </h3>
                <p className="text-xs text-gray-400 mb-2">{model.provider}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{model.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs text-gray-400">
                  <span>{model.context} ctx</span>
                  <span>{model.inputPrice} in</span>
                </div>
              </div>
            ))}
          </div>

          {/* Free models callout */}
          <div className="mt-6 p-4 rounded-xl bg-[#6467F2]/5 border border-[#6467F2]/10">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[#6467F2]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Star className="w-3.5 h-3.5 text-[#6467F2]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Free models available</p>
                <p className="text-xs text-gray-500 mb-2">
                  Get started without a credit card using community-supported free models.
                </p>
                <div className="flex flex-wrap gap-2">
                  {FREE_MODELS.map((m) => (
                    <span key={m.name} className="text-xs px-2.5 py-1 bg-white border border-[#6467F2]/10 rounded-full text-gray-600">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Up and running in minutes
            </h2>
            <p className="text-gray-500">Three steps to access every AI model on the market.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(50%+28px)] right-[-calc(50%-28px)] h-px bg-gray-200" />
                )}
                <div className="w-10 h-10 rounded-full bg-[#6467F2] text-white font-bold text-sm flex items-center justify-center mx-auto mb-4 relative z-10">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>

          {/* Code snippet */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 border-b border-gray-700">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-xs text-gray-400 ml-2">example.ts</span>
              </div>
              <div className="bg-gray-950 p-5 overflow-x-auto">
                <pre className="text-sm leading-relaxed">
                  <code>
                    <span className="text-gray-400">{'// Works with any OpenAI-compatible SDK\n'}</span>
                    <span className="text-blue-400">{'const '}</span>
                    <span className="text-white">{'response = await openai.chat.completions.create'}</span>
                    <span className="text-yellow-300">{'({'}</span>
                    <span className="text-white">{'\n  '}</span>
                    <span className="text-red-300">{'model'}</span>
                    <span className="text-white">{': '}</span>
                    <span className="text-green-300">{'"anthropic/claude-3.5-sonnet"'}</span>
                    <span className="text-white">{',\n  '}</span>
                    <span className="text-red-300">{'messages'}</span>
                    <span className="text-white">{': ['}</span>
                    <span className="text-yellow-300">{'{'}</span>
                    <span className="text-red-300">{' role'}</span>
                    <span className="text-white">{': '}</span>
                    <span className="text-green-300">{'"user"'}</span>
                    <span className="text-white">{', '}</span>
                    <span className="text-red-300">{'content'}</span>
                    <span className="text-white">{': '}</span>
                    <span className="text-green-300">{'"Hello!"'}</span>
                    <span className="text-yellow-300">{' }'}</span>
                    <span className="text-white">{'],\n'}</span>
                    <span className="text-yellow-300">{'}'}</span>
                    <span className="text-white">{');\n\n'}</span>
                    <span className="text-gray-400">{'// Point baseURL at OpenRouter\n'}</span>
                    <span className="text-blue-400">{'const '}</span>
                    <span className="text-white">{'openai = new OpenAI'}</span>
                    <span className="text-yellow-300">{'({'}</span>
                    <span className="text-white">{'\n  '}</span>
                    <span className="text-red-300">{'baseURL'}</span>
                    <span className="text-white">{': '}</span>
                    <span className="text-green-300">{'"https://openrouter.ai/api/v1"'}</span>
                    <span className="text-white">{',\n  '}</span>
                    <span className="text-red-300">{'apiKey'}</span>
                    <span className="text-white">{': process.env.OPENROUTER_API_KEY,\n'}</span>
                    <span className="text-yellow-300">{'}'}</span>
                    <span className="text-white">{')'}</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent announcements</h2>
              <p className="text-sm text-gray-500 mt-1">Latest models, features, and updates</p>
            </div>
            <Link
              href="#"
              className="text-sm text-[#6467F2] hover:text-[#5558e8] font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {ANNOUNCEMENTS.map((a) => (
              <div
                key={a.title}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-150 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.tagColor}`}>
                    {a.tag}
                  </span>
                  <span className="text-xs text-gray-400">{a.date}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#6467F2] transition-colors mb-2 leading-snug">
                  {a.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-[#6467F2] to-[#818DF8] rounded-2xl p-10 shadow-xl shadow-[#6467F2]/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Start building today
            </h2>
            <p className="text-[#c5c7fb] mb-7">
              Free tier available. No credit card required. Access to all free models immediately.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="#"
                className="px-6 py-2.5 text-sm font-medium text-[#6467F2] bg-white hover:bg-gray-50 rounded-full transition-colors duration-150"
              >
                Create free account
              </Link>
              <Link
                href="#"
                className="px-6 py-2.5 text-sm font-medium text-white border border-white/30 hover:bg-white/10 rounded-full transition-colors duration-150 flex items-center gap-2"
              >
                Read the docs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
