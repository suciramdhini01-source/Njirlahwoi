import type { ModelInfo } from "@/types/model-types";

export const FREE_MODELS: ModelInfo[] = [
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B", provider: "Google", free: true, source: "openrouter" },
  { id: "google/learnlm-1.5-pro-experimental:free", name: "LearnLM 1.5 Pro", provider: "Google", free: true, source: "openrouter" },
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B", provider: "Meta", free: true, source: "openrouter" },
  { id: "meta-llama/llama-3.1-70b-instruct:free", name: "Llama 3.1 70B", provider: "Meta", free: true, source: "openrouter" },
  { id: "meta-llama/llama-3.2-1b-instruct:free", name: "Llama 3.2 1B", provider: "Meta", free: true, source: "openrouter" },
  { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B", provider: "Meta", free: true, source: "openrouter" },
  { id: "mistralai/pixtral-12b:free", name: "Pixtral 12B", provider: "Mistral", free: true, source: "openrouter" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B", provider: "Mistral", free: true, source: "openrouter" },
  { id: "qwen/qwen-2-7b-instruct:free", name: "Qwen 2 7B", provider: "Qwen", free: true, source: "openrouter" },
  { id: "qwen/qwen-2.5-7b-instruct:free", name: "Qwen 2.5 7B", provider: "Qwen", free: true, source: "openrouter" },
  { id: "qwen/qwen-2.5-coder-32b-instruct:free", name: "Qwen 2.5 Coder 32B", provider: "Qwen", free: true, source: "openrouter" },
  { id: "nvidia/llama-3.1-nemotron-70b-instruct:free", name: "Nemotron 70B", provider: "NVIDIA", free: true, source: "openrouter" },
  { id: "microsoft/phi-3-medium-128k-instruct:free", name: "Phi-3 Medium 128K", provider: "Microsoft", free: true, source: "openrouter" },
  { id: "microsoft/phi-3-mini-128k-instruct:free", name: "Phi-3 Mini 128K", provider: "Microsoft", free: true, source: "openrouter" },
  { id: "gryphe/mythomax-l2-13b:free", name: "MythoMax L2 13B", provider: "Gryphe", free: true, source: "openrouter" },
  { id: "openrouter/auto:free", name: "Auto (Best Free)", provider: "OpenRouter", free: true, source: "openrouter" },
];

export const SUPPORTED_PROVIDERS = [
  "AI21", "AionLabs", "AkashML", "Alibaba Cloud", "Amazon Bedrock", "Anthropic",
  "Arcee AI", "AtlasCloud", "Azure", "Baidu Qianfan", "Baseten", "Cerebras",
  "Chutes", "Clarifai", "Cohere", "DeepInfra", "DeepSeek", "Featherless",
  "Fireworks", "Friendli", "GMICloud", "Google AI Studio", "Google Vertex",
  "Groq", "Inception", "Inceptron", "Infermatic", "Inflection", "io.net",
  "Liquid", "Mancer", "MiniMax", "Mistral", "Moonshot AI", "Morph",
  "Nebius", "NextBit", "NovitaAI", "OpenAI", "OpenInference", "Parasail",
  "Perplexity", "Phala", "Reka AI", "Relace", "SambaNova", "Scaleway",
  "Stealth", "Together AI", "UbiCloud", "Venice", "xAI", "Zhipu AI",
  "Meta", "NVIDIA", "Qwen", "Microsoft",
];

interface OpenRouterRawModel {
  id: string;
  name?: string;
  owned_by?: string;
  pricing?: { prompt?: string; completion?: string };
  context_length?: number;
}

export async function fetchOpenRouterModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`OpenRouter model fetch gagal: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { data: OpenRouterRawModel[] };
  return data.data.map((m) => {
    const isFree =
      m.id.endsWith(":free") ||
      (m.pricing?.prompt === "0" && m.pricing?.completion === "0");
    const providerPart = m.id.split("/")[0] ?? "Unknown";
    return {
      id: m.id,
      name: m.name ?? m.id,
      provider: m.owned_by ?? providerPart,
      free: isFree,
      pricing: m.pricing
        ? {
            prompt: m.pricing.prompt ?? "0",
            completion: m.pricing.completion ?? "0",
          }
        : undefined,
      source: "openrouter" as const,
    };
  });
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterChatOptions {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export async function openRouterChat(opts: OpenRouterChatOptions): Promise<Response> {
  const { apiKey, model, messages, stream = true, temperature, max_tokens } = opts;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://njirlah.ai",
      "X-Title": "NJIRLAH AI",
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      ...(temperature !== undefined && { temperature }),
      ...(max_tokens !== undefined && { max_tokens }),
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter chat error ${res.status}: ${errText}`);
  }
  return res;
}
