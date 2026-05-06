import { LucideIcon, Cloud, Bot, Sparkles, Zap, Brain, Cpu, Rocket, Flame, Star, Layers, Waves, Globe, Atom, Compass, Radar, Anchor, Orbit, Plug, Gauge, Satellite } from "lucide-react";

export interface ProviderField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "password";
  required?: boolean;
}

export interface ProviderConfig {
  slug: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  accent: string;
  baseUrl: string;
  docsUrl: string;
  modelCountLabel: string;
  fields: ProviderField[];
  instructions: string[];
  modelsEndpoint?: string;
  openAICompatible?: boolean;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    slug: "openrouter",
    name: "OpenRouter",
    tagline: "300+ model agregator OpenAI-compatible",
    icon: Globe,
    accent: "#06B6D4",
    baseUrl: "https://openrouter.ai/api/v1",
    docsUrl: "https://openrouter.ai/keys",
    modelCountLabel: "300+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-or-v1-...", type: "password", required: true },
    ],
    instructions: [
      "Buat akun di openrouter.ai dan masuk ke halaman Keys.",
      "Generate API key baru (gratis, bisa pakai model *:free tanpa saldo).",
      "Tempel key di atas dan klik Save & Test.",
    ],
    openAICompatible: true,
  },
  {
    slug: "cloudflare",
    name: "Cloudflare Workers AI",
    tagline: "50+ model di jaringan global Cloudflare",
    icon: Cloud,
    accent: "#F38020",
    baseUrl: "https://api.cloudflare.com/client/v4",
    docsUrl: "https://developers.cloudflare.com/workers-ai/",
    modelCountLabel: "50+ model",
    fields: [
      { key: "apiKey", label: "API Token", placeholder: "cf-...", type: "password", required: true },
      { key: "accountId", label: "Account ID", placeholder: "32 karakter hex", type: "text", required: true },
    ],
    instructions: [
      "Login Cloudflare Dashboard, salin Account ID dari sidebar kanan.",
      "Profile → API Tokens → Create Token → Workers AI (Edit) template.",
      "Tempel kedua nilai dan klik Save & Test.",
    ],
  },
  {
    slug: "openai",
    name: "OpenAI",
    tagline: "GPT-4, GPT-5, o-series reasoning",
    icon: Sparkles,
    accent: "#10A37F",
    baseUrl: "https://api.openai.com/v1",
    docsUrl: "https://platform.openai.com/api-keys",
    modelCountLabel: "40+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-proj-...", type: "password", required: true },
    ],
    instructions: [
      "Buka platform.openai.com/api-keys dan login.",
      "Klik Create new secret key, beri nama, copy.",
      "Pastikan akun punya saldo usage sebelum testing.",
    ],
    openAICompatible: true,
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    tagline: "Claude Opus, Sonnet, Haiku",
    icon: Brain,
    accent: "#D97757",
    baseUrl: "https://api.anthropic.com/v1",
    docsUrl: "https://console.anthropic.com/settings/keys",
    modelCountLabel: "8+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-ant-...", type: "password", required: true },
    ],
    instructions: [
      "Buka console.anthropic.com, masuk Settings → API Keys.",
      "Create Key, salin token yang diberikan.",
      "Top up saldo credits sebelum memakai API.",
    ],
  },
  {
    slug: "gemini",
    name: "Google Gemini",
    tagline: "Gemini 2.5 Pro, 3 Flash Preview",
    icon: Star,
    accent: "#4285F4",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    docsUrl: "https://aistudio.google.com/app/apikey",
    modelCountLabel: "10+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "AIza...", type: "password", required: true },
    ],
    instructions: [
      "Buka aistudio.google.com/app/apikey.",
      "Klik Create API Key, pilih project atau buat baru.",
      "Tersedia kuota gratis harian untuk Flash models.",
    ],
  },
  {
    slug: "groq",
    name: "Groq",
    tagline: "Inference LPU super cepat",
    icon: Zap,
    accent: "#F55036",
    baseUrl: "https://api.groq.com/openai/v1",
    docsUrl: "https://console.groq.com/keys",
    modelCountLabel: "15+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "gsk_...", type: "password", required: true },
    ],
    instructions: [
      "Daftar di console.groq.com.",
      "Masuk API Keys → Create API Key.",
      "Free tier generous, cocok untuk testing latency.",
    ],
    openAICompatible: true,
  },
  {
    slug: "cohere",
    name: "Cohere",
    tagline: "Command R+, enterprise RAG",
    icon: Compass,
    accent: "#39D4C4",
    baseUrl: "https://api.cohere.ai/v1",
    docsUrl: "https://dashboard.cohere.com/api-keys",
    modelCountLabel: "12+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "co-...", type: "password", required: true },
    ],
    instructions: [
      "Masuk dashboard.cohere.com, buka API Keys.",
      "Generate trial key (gratis untuk development).",
      "Upgrade ke production key untuk kuota lebih besar.",
    ],
  },
  {
    slug: "mistral",
    name: "Mistral AI",
    tagline: "Mistral Large, Codestral, Pixtral",
    icon: Waves,
    accent: "#FF7000",
    baseUrl: "https://api.mistral.ai/v1",
    docsUrl: "https://console.mistral.ai/api-keys/",
    modelCountLabel: "10+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "...", type: "password", required: true },
    ],
    instructions: [
      "Buka console.mistral.ai dan login.",
      "API Keys → Create new key.",
      "Subscription required sebelum request production.",
    ],
    openAICompatible: true,
  },
  {
    slug: "deepseek",
    name: "DeepSeek",
    tagline: "DeepSeek V3, Reasoner R1",
    icon: Radar,
    accent: "#4D6BFE",
    baseUrl: "https://api.deepseek.com/v1",
    docsUrl: "https://platform.deepseek.com/api_keys",
    modelCountLabel: "5+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-...", type: "password", required: true },
    ],
    instructions: [
      "Daftar di platform.deepseek.com.",
      "API Keys → Create new API key.",
      "Topup saldo USD via crypto/stripe.",
    ],
    openAICompatible: true,
  },
  {
    slug: "xai",
    name: "xAI (Grok)",
    tagline: "Grok 3, Grok Vision",
    icon: Atom,
    accent: "#000000",
    baseUrl: "https://api.x.ai/v1",
    docsUrl: "https://console.x.ai/",
    modelCountLabel: "5+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "xai-...", type: "password", required: true },
    ],
    instructions: [
      "Masuk ke console.x.ai.",
      "Buat API Key baru dari dashboard.",
      "Butuh subscription X Premium+ untuk akses penuh.",
    ],
    openAICompatible: true,
  },
  {
    slug: "perplexity",
    name: "Perplexity",
    tagline: "Sonar Online, web-grounded",
    icon: Orbit,
    accent: "#20B8CD",
    baseUrl: "https://api.perplexity.ai",
    docsUrl: "https://www.perplexity.ai/settings/api",
    modelCountLabel: "8+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "pplx-...", type: "password", required: true },
    ],
    instructions: [
      "Login ke perplexity.ai dan buka Settings → API.",
      "Generate API key, butuh credit balance.",
      "Subscription Pro mendapat credit bulanan gratis.",
    ],
    openAICompatible: true,
  },
  {
    slug: "together",
    name: "Together AI",
    tagline: "Llama, Qwen, DeepSeek hosted",
    icon: Layers,
    accent: "#0F6FFF",
    baseUrl: "https://api.together.xyz/v1",
    docsUrl: "https://api.together.xyz/settings/api-keys",
    modelCountLabel: "100+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "...", type: "password", required: true },
    ],
    instructions: [
      "Daftar di api.together.xyz.",
      "Settings → API Keys → Create.",
      "Signup bonus $1 gratis untuk percobaan.",
    ],
    openAICompatible: true,
  },
  {
    slug: "fireworks",
    name: "Fireworks AI",
    tagline: "FireFunction, serverless Llama",
    icon: Flame,
    accent: "#FF3366",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    docsUrl: "https://fireworks.ai/api-keys",
    modelCountLabel: "60+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "fw_...", type: "password", required: true },
    ],
    instructions: [
      "Buat akun di fireworks.ai.",
      "Dashboard → API Keys → Create.",
      "Free credits saat pendaftaran.",
    ],
    openAICompatible: true,
  },
  {
    slug: "novita",
    name: "NovitaAI",
    tagline: "Open-source LLM hosting",
    icon: Rocket,
    accent: "#00D9FF",
    baseUrl: "https://api.novita.ai/v3/openai",
    docsUrl: "https://novita.ai/settings/key-management",
    modelCountLabel: "40+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk_...", type: "password", required: true },
    ],
    instructions: [
      "Login novita.ai.",
      "Settings → Key Management → Generate.",
      "Free trial credit tersedia.",
    ],
    openAICompatible: true,
  },
  {
    slug: "deepinfra",
    name: "DeepInfra",
    tagline: "Serverless GPU LLM",
    icon: Cpu,
    accent: "#1B998B",
    baseUrl: "https://api.deepinfra.com/v1/openai",
    docsUrl: "https://deepinfra.com/dash/api_keys",
    modelCountLabel: "80+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "...", type: "password", required: true },
    ],
    instructions: [
      "Sign up deepinfra.com.",
      "Dashboard → API Keys.",
      "Pay-as-you-go pricing, low cost.",
    ],
    openAICompatible: true,
  },
  {
    slug: "siliconflow",
    name: "SiliconFlow",
    tagline: "Model hosting Tiongkok",
    icon: Satellite,
    accent: "#5A6FFF",
    baseUrl: "https://api.siliconflow.cn/v1",
    docsUrl: "https://cloud.siliconflow.cn/account/ak",
    modelCountLabel: "30+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-...", type: "password", required: true },
    ],
    instructions: [
      "Daftar di cloud.siliconflow.cn.",
      "Account → API Keys.",
      "Banyak model Qwen / DeepSeek tersedia gratis.",
    ],
    openAICompatible: true,
  },
  {
    slug: "reka",
    name: "Reka AI",
    tagline: "Reka Core, Flash, Edge",
    icon: Gauge,
    accent: "#7C3AED",
    baseUrl: "https://api.reka.ai/v1",
    docsUrl: "https://platform.reka.ai/apikeys",
    modelCountLabel: "5+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "...", type: "password", required: true },
    ],
    instructions: [
      "Platform.reka.ai → sign in.",
      "API Keys → Create new.",
      "Dapat trial credits saat pendaftaran.",
    ],
    openAICompatible: true,
  },
  {
    slug: "moonshot",
    name: "Moonshot (Kimi)",
    tagline: "Kimi K2, long-context 200K",
    icon: Anchor,
    accent: "#FF5E5B",
    baseUrl: "https://api.moonshot.cn/v1",
    docsUrl: "https://platform.moonshot.cn/console/api-keys",
    modelCountLabel: "6+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-...", type: "password", required: true },
    ],
    instructions: [
      "Daftar di platform.moonshot.cn (butuh nomor Tiongkok).",
      "API Keys → Create.",
      "Topup saldo CNY untuk production.",
    ],
    openAICompatible: true,
  },
  {
    slug: "alibaba",
    name: "Alibaba DashScope",
    tagline: "Qwen Max, Qwen VL",
    icon: Bot,
    accent: "#FF6A00",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    docsUrl: "https://dashscope.console.aliyun.com/apiKey",
    modelCountLabel: "40+ model",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk-...", type: "password", required: true },
    ],
    instructions: [
      "Daftar Alibaba Cloud, aktifkan DashScope.",
      "Console → API Keys → Create.",
      "Free tier tersedia untuk beberapa model Qwen.",
    ],
    openAICompatible: true,
  },
  {
    slug: "cline",
    name: "Cline",
    tagline: "Autonomous coding agent API",
    icon: Plug,
    accent: "#22C55E",
    baseUrl: "https://api.cline.bot/v1",
    docsUrl: "https://app.cline.bot/settings/api-keys",
    modelCountLabel: "Custom",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "cline-...", type: "password", required: true },
    ],
    instructions: [
      "Login ke app.cline.bot.",
      "Settings → API Keys → Create key.",
      "Integrasi untuk agent otonom di luar VSCode extension.",
    ],
    openAICompatible: true,
  },
];

export function getProvider(slug: string): ProviderConfig | undefined {
  return PROVIDERS.find((p) => p.slug === slug);
}
