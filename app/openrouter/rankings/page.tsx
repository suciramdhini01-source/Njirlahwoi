'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Star, Users, Zap, ExternalLink, ChevronRight, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const CATEGORIES = ['All', 'Chat', 'Coding', 'Reasoning', 'Multimodal', 'Long Context', 'Free'];

const TOP_MODELS = [
  {
    rank: 1,
    change: 'up',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    providerColor: '#c96442',
    score: 98.2,
    requests7d: '142M',
    tokens7d: '48B',
    category: 'Chat',
    badge: 'Top Ranked',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    rank: 2,
    change: 'same',
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerColor: '#10a37f',
    score: 96.8,
    requests7d: '128M',
    tokens7d: '41B',
    category: 'Chat',
    badge: 'Popular',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    rank: 3,
    change: 'up',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    providerColor: '#4285f4',
    score: 95.1,
    requests7d: '98M',
    tokens7d: '38B',
    category: 'Multimodal',
    badge: 'Rising',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    rank: 4,
    change: 'down',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    providerColor: '#10a37f',
    score: 93.5,
    requests7d: '210M',
    tokens7d: '52B',
    category: 'Chat',
    badge: '',
    badgeColor: '',
  },
  {
    rank: 5,
    change: 'up',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    providerColor: '#4d6bfe',
    score: 92.8,
    requests7d: '67M',
    tokens7d: '28B',
    category: 'Reasoning',
    badge: 'New',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    rank: 6,
    change: 'same',
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    providerColor: '#0866ff',
    score: 91.2,
    requests7d: '45M',
    tokens7d: '18B',
    category: 'Coding',
    badge: 'Open Source',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    rank: 7,
    change: 'up',
    name: 'Grok 2',
    provider: 'xAI',
    providerColor: '#1a1a1a',
    score: 90.5,
    requests7d: '38M',
    tokens7d: '15B',
    category: 'Chat',
    badge: 'New',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    rank: 8,
    change: 'down',
    name: 'Mistral Large',
    provider: 'Mistral',
    providerColor: '#f7a130',
    score: 89.3,
    requests7d: '32M',
    tokens7d: '12B',
    category: 'Coding',
    badge: '',
    badgeColor: '',
  },
  {
    rank: 9,
    change: 'same',
    name: 'Command R+',
    provider: 'Cohere',
    providerColor: '#39594d',
    score: 87.8,
    requests7d: '28M',
    tokens7d: '10B',
    category: 'Chat',
    badge: 'RAG',
    badgeColor: 'bg-teal-100 text-teal-700',
  },
  {
    rank: 10,
    change: 'up',
    name: 'Llama 3.1 8B (free)',
    provider: 'Meta',
    providerColor: '#0866ff',
    score: 86.2,
    requests7d: '320M',
    tokens7d: '98B',
    category: 'Free',
    badge: 'Free',
    badgeColor: 'bg-green-100 text-green-700',
  },
];

const TRENDING = [
  { name: 'DeepSeek R1', provider: 'DeepSeek', growth: '+312%', color: '#4d6bfe' },
  { name: 'Grok 2', provider: 'xAI', growth: '+187%', color: '#1a1a1a' },
  { name: 'Gemini 2.0 Flash', provider: 'Google', growth: '+145%', color: '#4285f4' },
  { name: 'Llama 3.1 70B', provider: 'Meta', growth: '+98%', color: '#0866ff' },
  { name: 'Mistral Large 2', provider: 'Mistral', growth: '+76%', color: '#f7a130' },
];

const TOP_APPS = [
  {
    rank: 1,
    name: 'ChatGPT Alternative',
    description: 'Multi-model chat interface with history',
    users: '2.1M',
    category: 'Chat',
    avatar: 'C',
    color: '#6467F2',
  },
  {
    rank: 2,
    name: 'DevAssist Pro',
    description: 'AI coding assistant for VS Code',
    users: '1.4M',
    category: 'Coding',
    avatar: 'D',
    color: '#10a37f',
  },
  {
    rank: 3,
    name: 'Aria AI Writer',
    description: 'Long-form content generation platform',
    users: '980K',
    category: 'Writing',
    avatar: 'A',
    color: '#c96442',
  },
  {
    rank: 4,
    name: 'SmartSearch AI',
    description: 'AI-powered research and summarization',
    users: '750K',
    category: 'Research',
    avatar: 'S',
    color: '#4285f4',
  },
  {
    rank: 5,
    name: 'LegalEagle AI',
    description: 'Contract analysis and legal research',
    users: '420K',
    category: 'Legal',
    avatar: 'L',
    color: '#1a1a1a',
  },
  {
    rank: 6,
    name: 'EduTutor',
    description: 'Personalized AI tutoring for students',
    users: '390K',
    category: 'Education',
    avatar: 'E',
    color: '#f7a130',
  },
];

const PROVIDER_STATS = [
  { name: 'Anthropic', share: 34, color: '#c96442', models: 8 },
  { name: 'OpenAI', share: 28, color: '#10a37f', models: 12 },
  { name: 'Google', share: 18, color: '#4285f4', models: 15 },
  { name: 'Meta', share: 10, color: '#0866ff', models: 20 },
  { name: 'Others', share: 10, color: '#9ca3af', models: 345 },
];

function ChangeIcon({ change }: { change: string }) {
  if (change === 'up') return <ArrowUp className="w-3 h-3 text-green-500" />;
  if (change === 'down') return <ArrowDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
}

export default function RankingsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [timePeriod, setTimePeriod] = useState('7d');

  const filteredModels = activeCategory === 'All'
    ? TOP_MODELS
    : TOP_MODELS.filter((m) => m.category === activeCategory);

  return (
    <div className="pt-14 min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900">Rankings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Most-used models and apps on OpenRouter, ranked by request volume and performance.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Trending section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#6467F2]" />
            <h2 className="text-base font-semibold text-gray-900">Trending this week</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TRENDING.map((t) => (
              <div
                key={t.name}
                className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold mb-2"
                  style={{ backgroundColor: t.color }}
                >
                  {t.provider[0]}
                </div>
                <div className="text-xs font-medium text-gray-900 group-hover:text-[#6467F2] transition-colors leading-tight mb-0.5">
                  {t.name}
                </div>
                <div className="text-[10px] text-gray-400">{t.provider}</div>
                <div className="text-xs font-semibold text-green-600 mt-1.5">{t.growth}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Models Leaderboard */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-semibold text-gray-900">Model leaderboard</h2>
            </div>
            <div className="flex items-center gap-2">
              {['7d', '30d', '90d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    timePeriod === p
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 ${
                  activeCategory === cat
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="w-8 text-center">#</div>
              <div className="flex-1">Model</div>
              <div className="hidden sm:block w-16 text-center">Score</div>
              <div className="hidden md:block w-20 text-center">Requests</div>
              <div className="hidden lg:block w-16 text-center">Tokens</div>
              <div className="w-5" />
            </div>

            {filteredModels.map((model, idx) => (
              <div
                key={model.name}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group ${
                  idx < filteredModels.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center gap-1">
                  <span className={`text-sm font-bold ${
                    model.rank === 1 ? 'text-amber-500' :
                    model.rank === 2 ? 'text-gray-500' :
                    model.rank === 3 ? 'text-amber-700' : 'text-gray-400'
                  }`}>
                    {model.rank}
                  </span>
                  <ChangeIcon change={model.change} />
                </div>

                {/* Provider icon + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: model.providerColor }}
                  >
                    {model.provider[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 group-hover:text-[#6467F2] transition-colors">
                        {model.name}
                      </span>
                      {model.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${model.badgeColor} shrink-0`}>
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{model.provider}</div>
                  </div>
                </div>

                {/* Score */}
                <div className="hidden sm:block w-16 text-center">
                  <span className="text-sm font-semibold text-gray-900">{model.score}</span>
                </div>

                {/* Requests */}
                <div className="hidden md:block w-20 text-center">
                  <span className="text-sm text-gray-600">{model.requests7d}</span>
                </div>

                {/* Tokens */}
                <div className="hidden lg:block w-16 text-center">
                  <span className="text-sm text-gray-600">{model.tokens7d}</span>
                </div>

                <div className="w-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Apps section */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#6467F2]" />
              <h2 className="text-base font-semibold text-gray-900">Top apps</h2>
            </div>
            <Link
              href="#"
              className="text-sm text-[#6467F2] hover:text-[#5558e8] font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOP_APPS.map((app) => (
              <div
                key={app.name}
                className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: app.color }}
                >
                  {app.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-[#6467F2] transition-colors">
                        {app.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-snug">{app.description}</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0 ml-2">
                      {app.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{app.users} users</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Provider market share */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#6467F2]" />
            <h2 className="text-base font-semibold text-gray-900">Provider market share</h2>
            <span className="text-xs text-gray-400">(by request volume, last 7 days)</span>
          </div>
          <div className="p-5 rounded-xl border border-gray-100">
            {/* Bar chart */}
            <div className="space-y-3">
              {PROVIDER_STATS.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-700 text-right shrink-0">{p.name}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center pl-2 transition-all duration-500"
                      style={{ width: `${p.share}%`, backgroundColor: p.color }}
                    >
                      <span className="text-[10px] text-white font-medium whitespace-nowrap">{p.share}%</span>
                    </div>
                  </div>
                  <div className="w-16 text-xs text-gray-400 shrink-0">{p.models} models</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
