'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Globe, ChevronRight, Star, TrendingUp, Users } from 'lucide-react';

const STATS = [
  { value: '400+', label: 'Model tersedia' },
  { value: '55+', label: 'AI provider' },
  { value: '100%', label: 'BYOK — kunci milikmu' },
  { value: 'Gratis', label: 'Untuk memulai' },
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
    title: 'Satu Antarmuka',
    description: 'Akses semua provider AI besar lewat satu platform yang seragam. Tidak perlu ganti-ganti SDK atau API key.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'BYOK — Kunci Milikmu',
    description: 'Bawa API key milikmu sendiri. Data tidak pernah disimpan di server. Privasi terjaga 100%.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Enkripsi Client-Side',
    description: 'Kunci API dienkripsi langsung di browser menggunakan Web Crypto API. Server tidak pernah melihat key kamu.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Agent Code Builder',
    description: 'Bangun proyek web lengkap dengan AI. Kode dihasilkan streaming, langsung bisa dipreview di browser.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
];

const FEATURED_MODELS = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    providerColor: '#c96442',
    description: 'Model terkuat Anthropic untuk reasoning dan coding dengan 200K context.',
    context: '200K',
    inputPriceLabel: '$3/M',
    badge: 'Populer',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerColor: '#10a37f',
    description: 'Model multimodal flagship OpenAI dengan kemampuan vision dan audio.',
    context: '128K',
    inputPriceLabel: '$5/M',
    badge: 'Multimodal',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    providerColor: '#4285f4',
    description: 'Model Google dengan context window 1 juta token untuk dokumen panjang.',
    context: '1M',
    inputPriceLabel: '$3.5/M',
    badge: 'Context Panjang',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    providerColor: '#0866ff',
    description: 'Model open-source terkuat Meta, tersedia gratis via berbagai provider.',
    context: '128K',
    inputPriceLabel: '$0.35/M',
    badge: 'Open Source',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
];

const FREE_MODELS = [
  'Llama 3.1 8B (gratis)',
  'Gemma 2 9B (gratis)',
  'Mistral 7B (gratis)',
  'Phi-3 Mini (gratis)',
];

const ANNOUNCEMENTS = [
  {
    date: 'Mei 2026',
    title: 'DeepSeek R1 kini tersedia dengan performa setara o1',
    description: 'Model reasoning terbaru DeepSeek menandingi GPT-o1 di berbagai benchmark coding.',
    tag: 'Model Baru',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    date: 'Apr 2026',
    title: 'Enkripsi AES-GCM kini lebih kuat dengan PIN 6 digit',
    description: 'Update keamanan: kunci API kamu kini dilindungi enkripsi berlapis di sisi klien.',
    tag: 'Keamanan',
    tagColor: 'bg-green-100 text-green-700',
  },
  {
    date: 'Apr 2026',
    title: 'Agent Code Builder kini support download ZIP proyek',
    description: 'Setelah agent selesai generate, unduh seluruh proyek dalam satu file ZIP.',
    tag: 'Fitur Baru',
    tagColor: 'bg-amber-100 text-amber-700',
  },
];

const STEPS = [
  {
    step: '1',
    title: 'Daftar akun gratis',
    description: 'Buat akun dengan email kamu. Tidak perlu kartu kredit. Langsung akses model gratis.',
  },
  {
    step: '2',
    title: 'Masukkan API key',
    description: 'Bawa key OpenRouter atau Cloudflare Workers AI milikmu. Disimpan terenkripsi di browser.',
  },
  {
    step: '3',
    title: 'Mulai chat & build',
    description: 'Pilih model, mulai ngobrol, atau gunakan Agent Builder untuk membangun aplikasi web.',
  },
];

export default function HomePage() {
  return (
    <div className="pt-14">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6467F2]/5 via-white to-[#818DF8]/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 pt-20 pb-16 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6467F2]/10 text-[#6467F2] text-xs font-medium mb-6">
              <Star className="w-3 h-3" />
              Platform AI multi-model bebas batasan
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
              Semua AI model,{' '}
              <span className="text-[#6467F2]">satu platform</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
              Akses ratusan model AI dari semua provider terkemuka. BYOK — bawa kunci API milikmu sendiri. Tidak ada lock-in, tidak ada biaya tersembunyi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/chat"
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#6467F2] hover:bg-[#5558e8] rounded-full transition-colors duration-150 flex items-center gap-2"
              >
                Mulai chat sekarang
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/models"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full transition-colors duration-150 flex items-center gap-2"
              >
                Jelajahi model
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

        {/* Provider strip */}
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <p className="text-center text-xs text-gray-400 uppercase tracking-wider mb-5 font-medium">
              Didukung oleh provider AI terkemuka di dunia
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
              {PROVIDER_LOGOS.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-gray-100 shadow-sm"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-medium text-gray-700">{p.name}</span>
                </div>
              ))}
              <div className="px-3 py-1.5 text-sm text-gray-400">+47 lainnya</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Dibangun untuk kebebasan penuh
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Tidak ada model bawaan server, tidak ada API key tersembunyi. Semua dari tanganmu sendiri.
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
              <h2 className="text-2xl font-bold text-gray-900">Model unggulan</h2>
              <p className="text-sm text-gray-500 mt-1">Model paling populer dari semua provider</p>
            </div>
            <Link
              href="/models"
              className="text-sm text-[#6467F2] hover:text-[#5558e8] font-medium flex items-center gap-1 transition-colors"
            >
              Lihat semua
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_MODELS.map((model) => (
              <Link
                key={model.id}
                href="/models"
                className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#6467F2]/30 hover:shadow-md transition-all duration-150 cursor-pointer group block"
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
                  <span>{model.inputPriceLabel} input</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Free models callout */}
          <div className="mt-6 p-4 rounded-xl bg-[#6467F2]/5 border border-[#6467F2]/10">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[#6467F2]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Star className="w-3.5 h-3.5 text-[#6467F2]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Model gratis tersedia</p>
                <p className="text-xs text-gray-500 mb-2">
                  Mulai tanpa kartu kredit menggunakan model gratis yang didukung komunitas.
                </p>
                <div className="flex flex-wrap gap-2">
                  {FREE_MODELS.map((m) => (
                    <span key={m} className="text-xs px-2.5 py-1 bg-white border border-[#6467F2]/10 rounded-full text-gray-600">
                      {m}
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
              Mulai dalam hitungan menit
            </h2>
            <p className="text-gray-500">Tiga langkah untuk akses semua model AI yang ada.</p>
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
                <span className="text-xs text-gray-400 ml-2">contoh.ts</span>
              </div>
              <div className="bg-gray-950 p-5 overflow-x-auto">
                <pre className="text-sm leading-relaxed">
                  <code>
                    <span className="text-gray-400">{'// Kompatibel dengan OpenAI SDK\n'}</span>
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
                    <span className="text-green-300">{'"Halo!"'}</span>
                    <span className="text-yellow-300">{' }'}</span>
                    <span className="text-white">{'],\n'}</span>
                    <span className="text-yellow-300">{'}'}</span>
                    <span className="text-white">{');\n\n'}</span>
                    <span className="text-gray-400">{'// Arahkan baseURL ke OpenRouter\n'}</span>
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
              <h2 className="text-2xl font-bold text-gray-900">Update terbaru</h2>
              <p className="text-sm text-gray-500 mt-1">Model baru, fitur, dan peningkatan</p>
            </div>
            <Link
              href="#"
              className="text-sm text-[#6467F2] hover:text-[#5558e8] font-medium flex items-center gap-1 transition-colors"
            >
              Lihat semua
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
              Mulai sekarang, gratis
            </h2>
            <p className="text-[#c5c7fb] mb-7">
              Tidak perlu kartu kredit. Akses langsung ke semua model gratis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/chat"
                className="px-6 py-2.5 text-sm font-medium text-[#6467F2] bg-white hover:bg-gray-50 rounded-full transition-colors duration-150"
              >
                Buka chat sekarang
              </Link>
              <Link
                href="/agent"
                className="px-6 py-2.5 text-sm font-medium text-white border border-white/30 hover:bg-white/10 rounded-full transition-colors duration-150 flex items-center gap-2"
              >
                Coba Agent Builder
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
