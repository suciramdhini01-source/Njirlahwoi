'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Cloud, Server, Plus, Trash2, Cpu, ChevronLeft,
  Sparkles, Globe, ExternalLink, Settings, Search,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAllApiKeysStore } from '@/store/all-api-keys-store';
import ProviderCard from '@/components/api-njir/ProviderCard';
import CustomProviderForm from '@/components/api-njir/CustomProviderForm';

const CustomCursor = dynamic(() => import('@/components/ui/CustomCursor'), { ssr: false });

/* ─── BYOK providers ────────────────────────────────────────────── */
const BYOK_PROVIDERS = [
  { slug: 'ai21', name: 'AI21', url: 'https://www.ai21.com/' },
  { slug: 'aionlabs', name: 'AionLabs', url: 'https://aionlabs.ai/' },
  { slug: 'akashml', name: 'AkashML', url: 'https://akash.network/' },
  { slug: 'alibaba-cloud-int', name: 'Alibaba Cloud Int.', url: 'https://www.alibabacloud.com/' },
  { slug: 'amazon-bedrock', name: 'Amazon Bedrock', url: 'https://aws.amazon.com/bedrock/' },
  { slug: 'anthropic', name: 'Anthropic', url: 'https://console.anthropic.com/' },
  { slug: 'arcee-ai', name: 'Arcee AI', url: 'https://www.arcee.ai/' },
  { slug: 'atlascloud', name: 'AtlasCloud', url: 'https://atlascloud.ai/' },
  { slug: 'azure', name: 'Azure OpenAI', url: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service' },
  { slug: 'baidu-qianfan', name: 'Baidu Qianfan', url: 'https://qianfan.cloud.baidu.com/' },
  { slug: 'baseten', name: 'Baseten', url: 'https://www.baseten.co/' },
  { slug: 'cerebras', name: 'Cerebras', url: 'https://cloud.cerebras.ai/' },
  { slug: 'chutes', name: 'Chutes', url: 'https://chutes.ai/' },
  { slug: 'clarifai', name: 'Clarifai', url: 'https://www.clarifai.com/' },
  { slug: 'cloudflare-byok', name: 'Cloudflare (BYOK)', url: 'https://developers.cloudflare.com/workers-ai/' },
  { slug: 'cohere', name: 'Cohere', url: 'https://dashboard.cohere.com/' },
  { slug: 'deepinfra', name: 'DeepInfra', url: 'https://deepinfra.com/' },
  { slug: 'deepseek', name: 'DeepSeek', url: 'https://platform.deepseek.com/' },
  { slug: 'featherless', name: 'Featherless', url: 'https://featherless.ai/' },
  { slug: 'fireworks', name: 'Fireworks AI', url: 'https://fireworks.ai/' },
  { slug: 'friendli', name: 'Friendli', url: 'https://friendli.ai/' },
  { slug: 'gmicloud', name: 'GMICloud', url: 'https://gmicloud.ai/' },
  { slug: 'google-ai-studio', name: 'Google AI Studio', url: 'https://aistudio.google.com/' },
  { slug: 'google-vertex', name: 'Google Vertex', url: 'https://cloud.google.com/vertex-ai' },
  { slug: 'groq', name: 'Groq', url: 'https://console.groq.com/' },
  { slug: 'inception', name: 'Inception', url: 'https://inception.ai/' },
  { slug: 'inceptron', name: 'Inceptron', url: 'https://inceptron.ai/' },
  { slug: 'infermatic', name: 'Infermatic', url: 'https://infermatic.ai/' },
  { slug: 'inflection', name: 'Inflection', url: 'https://inflection.ai/' },
  { slug: 'ionet', name: 'io.net', url: 'https://io.net/' },
  { slug: 'liquid', name: 'Liquid AI', url: 'https://liquid.ai/' },
  { slug: 'mancer', name: 'Mancer', url: 'https://mancer.tech/' },
  { slug: 'minimax', name: 'MiniMax', url: 'https://www.minimax.io/' },
  { slug: 'mistral', name: 'Mistral', url: 'https://console.mistral.ai/' },
  { slug: 'moonshot', name: 'Moonshot AI', url: 'https://platform.moonshot.cn/' },
  { slug: 'morph', name: 'Morph', url: 'https://morph.so/' },
  { slug: 'nebius', name: 'Nebius Token Factory', url: 'https://nebius.ai/' },
  { slug: 'nextbit', name: 'NextBit', url: 'https://nextbit.ai/' },
  { slug: 'novitaai', name: 'NovitaAI', url: 'https://novita.ai/' },
  { slug: 'openai', name: 'OpenAI', url: 'https://platform.openai.com/api-keys' },
  { slug: 'openinference', name: 'OpenInference', url: 'https://openinference.ai/' },
  { slug: 'parasail', name: 'Parasail', url: 'https://parasail.io/' },
  { slug: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/settings/api' },
  { slug: 'phala', name: 'Phala', url: 'https://phala.network/' },
  { slug: 'reka-ai', name: 'Reka AI', url: 'https://www.reka.ai/' },
  { slug: 'relace', name: 'Relace', url: 'https://relace.ai/' },
  { slug: 'sambanova', name: 'SambaNova', url: 'https://cloud.sambanova.ai/' },
  { slug: 'siliconflow', name: 'SiliconFlow', url: 'https://siliconflow.cn/' },
  { slug: 'stepfun', name: 'StepFun', url: 'https://platform.stepfun.com/' },
  { slug: 'switchpoint', name: 'Switchpoint', url: 'https://switchpoint.ai/' },
  { slug: 'together', name: 'Together AI', url: 'https://api.together.xyz/' },
  { slug: 'venice', name: 'Venice', url: 'https://venice.ai/' },
  { slug: 'weightsbiases', name: 'Weights & Biases', url: 'https://wandb.ai/' },
  { slug: 'xai', name: 'xAI (Grok)', url: 'https://console.x.ai/' },
  { slug: 'xiaomi', name: 'Xiaomi', url: 'https://ai.xiaomi.com/' },
  { slug: 'zai', name: 'Z.ai', url: 'https://z.ai/' },
];

const TABS = [
  { key: 'openrouter', label: 'OpenRouter', icon: <Key size={14} />, color: 'text-neon-purple' },
  { key: 'cloudflare', label: 'Cloudflare', icon: <Cloud size={14} />, color: 'text-neon-cyan' },
  { key: 'bailian', label: 'Alibaba Bailian', icon: <Server size={14} />, color: 'text-yellow-400' },
  { key: 'custom', label: 'Custom (Cline)', icon: <Cpu size={14} />, color: 'text-pink-400' },
];

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="glass border border-white/10 rounded-2xl p-4 flex flex-col gap-1 cursor-default"
    >
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-black font-heading ${color}`}>{value}</span>
    </motion.div>
  );
}

export default function ApiNjirPage() {
  const [tab, setTab] = useState('openrouter');
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [byokSearch, setByokSearch] = useState('');

  const store = useAllApiKeysStore();

  useEffect(() => {
    store.loadAllKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const configuredCount = [
    store.openrouterKey,
    store.cfAccountId && store.cfApiToken,
    store.bailianApiKey,
  ].filter(Boolean).length + store.customProviders.length;

  const byokCount = Object.values(store.byokKeys).filter(Boolean).length;

  const filteredByok = BYOK_PROVIDERS.filter((p) =>
    p.name.toLowerCase().includes(byokSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#05050A] text-white relative overflow-x-hidden">
      <CustomCursor />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-neon-purple/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-neon-cyan/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-pink-500/4 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">

        {/* ── Breadcrumb ── */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors mb-6 group"
        >
          <ChevronLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Chat
        </Link>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="text-4xl select-none"
            >
              🔑
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-black gradient-text leading-none">API NJIR</h1>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mt-1"
              >
                <p className="text-gray-500 text-sm">Kendalikan Semua Kunci API di Satu Tempat</p>
                <span className="px-1.5 py-0.5 bg-neon-purple/20 border border-neon-purple/30 rounded-full text-[9px] text-neon-purple font-bold tracking-wider">
                  AES-GCM ENCRYPTED
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          <StatCard label="Provider Aktif" value={configuredCount} color="text-neon-purple" />
          <StatCard label="BYOK Keys" value={byokCount} color="text-neon-cyan" />
          <StatCard label="Custom Endpoints" value={store.customProviders.length} color="text-pink-400" />
          <StatCard label="Total Dukungan" value="300+" color="text-yellow-400" />
        </motion.div>

        {/* ── Tab bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 bg-white/[0.03] border border-white/10 rounded-2xl p-1 mb-6 overflow-x-auto"
        >
          {TABS.map((t) => (
            <motion.button
              key={t.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                tab === t.key
                  ? `${t.color} font-medium`
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab === t.key && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-white/[0.06] border border-white/10 rounded-xl"
                />
              )}
              <span className="relative">{t.icon}</span>
              <span className="relative">{t.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">

          {/* ═══ OpenRouter ═══ */}
          {tab === 'openrouter' && (
            <motion.div
              key="openrouter"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.16 }}
              className="space-y-8"
            >
              {/* Main key */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-neon-purple" />
                  <h2 className="text-sm font-bold text-white font-heading">OpenRouter — API Key Utama</h2>
                  <a
                    href="https://openrouter.ai/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-[11px] text-gray-600 hover:text-neon-cyan flex items-center gap-1 transition-colors"
                  >
                    Dapatkan Key <ExternalLink size={10} />
                  </a>
                </div>
                <ProviderCard
                  name="OpenRouter"
                  description="Satu key ini membuka 300+ model dari 60+ provider — GPT-4o, Claude Sonnet, Gemini Pro, DeepSeek R1, Llama 3, dan masih banyak lagi."
                  placeholder="sk-or-v1-..."
                  docsUrl="https://openrouter.ai/docs"
                  value={store.openrouterKey}
                  status={store.openrouterStatus}
                  onSave={store.setOpenrouterKey}
                  onTest={store.testOpenrouterKey}
                />
              </section>

              {/* BYOK sub-providers */}
              <section>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Settings size={14} className="text-gray-500" />
                    <h2 className="text-sm font-bold text-white font-heading">
                      BYOK Sub-Providers
                      <span className="ml-2 text-[10px] text-gray-600 font-normal">({BYOK_PROVIDERS.length} tersedia)</span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 ml-auto">
                    <Search size={11} className="text-gray-600" />
                    <input
                      value={byokSearch}
                      onChange={(e) => setByokSearch(e.target.value)}
                      placeholder="Cari provider..."
                      className="bg-transparent text-xs text-white/70 placeholder-gray-700 outline-none w-32"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 mb-4 -mt-2">
                  Opsional — daftarkan kunci provider langsung di sini untuk routing bypass OpenRouter.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredByok.map((p, i) => (
                    <motion.div
                      key={p.slug}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.015, 0.3), type: 'spring', damping: 24 }}
                    >
                      <ProviderCard
                        name={p.name}
                        placeholder="API Key..."
                        docsUrl={p.url}
                        value={store.byokKeys[p.slug] ?? null}
                        onSave={(key) => store.setBYOKKey(p.slug, key)}
                        onTest={async (key) => {
                          try {
                            const res = await fetch('https://openrouter.ai/api/v1/models', {
                              headers: { Authorization: `Bearer ${key}` },
                            });
                            return res.ok;
                          } catch { return false; }
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* ═══ Cloudflare ═══ */}
          {tab === 'cloudflare' && (
            <motion.div
              key="cloudflare"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.16 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2">
                <Cloud size={14} className="text-neon-cyan" />
                <h2 className="text-sm font-bold text-white font-heading">Cloudflare Workers AI</h2>
                <a
                  href="https://developers.cloudflare.com/workers-ai/get-started/rest-api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[11px] text-gray-600 hover:text-neon-cyan flex items-center gap-1 transition-colors"
                >
                  Panduan <ExternalLink size={10} />
                </a>
              </div>

              <div className="glass border border-neon-cyan/15 rounded-2xl p-4 bg-neon-cyan/[0.03] text-xs text-gray-500 leading-relaxed space-y-1.5">
                <p><strong className="text-gray-300">Cara mendapatkan credentials:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Buka <a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">Dashboard Cloudflare</a></li>
                  <li>Menu kiri → Workers AI → <strong className="text-gray-400">Use REST API</strong></li>
                  <li>Klik <strong className="text-gray-400">Create API Token</strong> → pilih template <em>Workers AI</em></li>
                  <li>Copy <strong className="text-gray-400">Account ID</strong> dari sidebar kanan dashboard</li>
                </ol>
              </div>

              <ProviderCard
                name="Cloudflare Workers AI"
                description="Akses 50+ model text generation dari edge Cloudflare — Llama 3.3 70B, DeepSeek R1, Mistral, Qwen, Phi, dan lainnya."
                placeholder="Masukkan Cloudflare API Token di sini..."
                docsUrl="https://developers.cloudflare.com/workers-ai/"
                value={store.cfApiToken}
                status={store.cfStatus}
                extraFields={[
                  {
                    label: 'Account ID',
                    placeholder: 'Account ID (32-char hex dari dashboard)',
                    value: store.cfAccountId,
                    key: 'accountId',
                  },
                ]}
                onSave={async () => {}}
                onSaveExtra={async (values) => {
                  await store.setCloudflareCreds(
                    values['accountId'] ?? '',
                    values['mainKey'] ?? ''
                  );
                }}
                onTest={async (token) => {
                  const accountId = store.cfAccountId ?? '';
                  if (!accountId) return false;
                  return store.testCloudflareCreds(accountId, token);
                }}
              />

              <div className="glass border border-neon-cyan/20 rounded-2xl p-4">
                <p className="text-[11px] text-neon-cyan font-semibold mb-2">Model yang tersedia</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '@cf/meta/llama-3.1-8b-instruct',
                    '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
                    '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
                    '@cf/mistral/mistral-7b-instruct-v0.1',
                    '@cf/qwen/qwen2.5-coder-32b-instruct',
                    '@cf/google/gemma-7b-it-lora',
                    '@cf/microsoft/phi-2',
                  ].map((m) => (
                    <span key={m} className="px-2 py-0.5 text-[10px] bg-neon-cyan/10 border border-neon-cyan/20 rounded-lg text-neon-cyan/80 font-mono">
                      {m}
                    </span>
                  ))}
                  <span className="text-[10px] text-gray-600 self-center">+ 40 lainnya</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ Bailian ═══ */}
          {tab === 'bailian' && (
            <motion.div
              key="bailian"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.16 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2">
                <Server size={14} className="text-yellow-400" />
                <h2 className="text-sm font-bold text-white font-heading">Alibaba Cloud Bailian (DashScope)</h2>
                <a
                  href="https://bailian.console.aliyun.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[11px] text-gray-600 hover:text-yellow-400 flex items-center gap-1 transition-colors"
                >
                  Konsol <ExternalLink size={10} />
                </a>
              </div>

              <div className="glass border border-yellow-400/15 rounded-2xl p-4 bg-yellow-400/[0.03] text-xs text-gray-500 leading-relaxed space-y-1.5">
                <p><strong className="text-gray-300">Cara mendapatkan API Key:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Buka <a href="https://bailian.console.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">Konsol Bailian</a></li>
                  <li>Klik avatar → <strong className="text-gray-400">API Key Center</strong></li>
                  <li>Klik <strong className="text-gray-400">Buat API Key Baru</strong></li>
                  <li>Salin dan simpan key (hanya ditampilkan sekali)</li>
                </ol>
              </div>

              <ProviderCard
                name="Alibaba Cloud Bailian"
                description="Qwen-Turbo, Qwen-Plus, Qwen-Max, Llama-3, DeepSeek-V3/R1, dan ratusan model dari ekosistem Alibaba Cloud."
                placeholder="sk-..."
                docsUrl="https://developer.aliyun.com/article/1697678"
                value={store.bailianApiKey}
                status={store.bailianStatus}
                onSave={store.setBailianKey}
                onTest={store.testBailianKey}
              />

              <div className="glass border border-yellow-400/20 rounded-2xl p-4">
                <p className="text-[11px] text-yellow-400 font-semibold mb-2">Model tersedia</p>
                <div className="flex flex-wrap gap-1.5">
                  {['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-long', 'llama3-8b-instruct', 'llama3-70b-instruct', 'deepseek-v3', 'deepseek-r1'].map((m) => (
                    <span key={m} className="px-2 py-0.5 text-[10px] bg-yellow-400/10 border border-yellow-400/20 rounded-lg text-yellow-400/80 font-mono">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ Custom ═══ */}
          {tab === 'custom' && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.16 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-pink-400" />
                  <h2 className="text-sm font-bold text-white font-heading">
                    Custom Providers
                    <span className="ml-2 text-[10px] text-gray-600 font-normal">OpenAI-compatible</span>
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setCustomFormOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-400/10 border border-pink-400/30 text-pink-400 text-xs hover:bg-pink-400/20 transition-all"
                >
                  <Plus size={12} /> Add Provider
                </motion.button>
              </div>

              <p className="text-xs text-gray-600">
                Tambahkan endpoint kompatibel OpenAI apa pun — SiliconFlow, Ollama lokal, LM Studio, Groq langsung, RouterPark, dan lainnya. Key disimpan terenkripsi.
              </p>

              {store.customProviders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 glass border border-white/10 rounded-2xl"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-5xl mb-4 select-none"
                  >
                    🔌
                  </motion.div>
                  <p className="text-sm text-gray-500 mb-1.5">Belum ada custom provider</p>
                  <p className="text-xs text-gray-700 mb-4">Sambungkan endpoint lokal atau cloud kamu</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCustomFormOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-400/10 border border-pink-400/30 text-pink-400 text-xs hover:bg-pink-400/20 transition-all"
                  >
                    <Plus size={12} /> Tambah Provider Pertama
                  </motion.button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatePresence>
                    {store.customProviders.map((cp, i) => (
                      <motion.div
                        key={cp.id}
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                        transition={{ delay: i * 0.05, type: 'spring', damping: 22, stiffness: 300 }}
                        className="relative glass border border-white/10 rounded-2xl p-4 group hover:border-pink-400/20 transition-colors"
                      >
                        <button
                          onClick={() => store.removeCustomProvider(cp.id)}
                          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>

                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-xl bg-pink-400/10 border border-pink-400/20 flex items-center justify-center flex-shrink-0">
                            <Globe size={14} className="text-pink-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white/90 truncate">{cp.name}</p>
                            <p className="text-[10px] text-gray-600 font-mono truncate">{cp.baseUrl}</p>
                          </div>
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div className="flex gap-2">
                            <span className="text-gray-700 w-14 flex-shrink-0">Model:</span>
                            <span className="text-white/50 font-mono truncate">{cp.modelId || '—'}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-gray-700 w-14 flex-shrink-0">API Key:</span>
                            <span className="text-white/50">{cp.apiKey ? '••••••••' : 'Tidak ada'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => store.testCustomProvider(cp.id, cp.baseUrl, cp.apiKey, cp.modelId)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-gray-500 hover:border-pink-400/30 hover:text-pink-400 transition-all"
                          >
                            Test Koneksi
                          </motion.button>
                          <AnimatePresence>
                            {store.customStatus[cp.id] === 'testing' && (
                              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-yellow-400">Testing...</motion.span>
                            )}
                            {store.customStatus[cp.id] === 'valid' && (
                              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-emerald-400">Online ✓</motion.span>
                            )}
                            {store.customStatus[cp.id] === 'invalid' && (
                              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-red-400">Gagal ✗</motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-10 pt-6 border-t border-white/5 mt-8">
        <p className="text-xs text-gray-700">
          Dibuat dengan <span className="text-red-400">❤️</span> oleh{' '}
          <span className="text-gray-500 hover:text-white transition-colors cursor-default">Andikaa Saputraa</span>
        </p>
      </div>

      <CustomProviderForm
        open={customFormOpen}
        onClose={() => setCustomFormOpen(false)}
        onAdd={store.addCustomProvider}
      />
    </div>
  );
}
