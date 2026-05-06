import type { ModelInfo } from "@/types/model-types";

export interface CloudflareModel {
  id: string;
  name: string;
  description?: string;
}

export const DEFAULT_CLOUDFLARE_MODELS: CloudflareModel[] = [
  { id: "@cf/meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B Instruct" },
  { id: "@cf/meta/llama-3.2-3b-instruct", name: "Llama 3.2 3B Instruct" },
  { id: "@cf/meta/llama-3.2-1b-instruct", name: "Llama 3.2 1B Instruct" },
  { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", name: "Llama 3.3 70B Instruct" },
  { id: "@cf/mistral/mistral-7b-instruct-v0.1", name: "Mistral 7B Instruct" },
  { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", name: "DeepSeek R1 Distill 32B" },
  { id: "@cf/qwen/qwen2.5-coder-32b-instruct", name: "Qwen 2.5 Coder 32B" },
  { id: "@cf/google/gemma-7b-it-lora", name: "Gemma 7B IT LoRA" },
  { id: "@cf/microsoft/phi-2", name: "Phi-2" },
  { id: "@cf/tiiuae/falcon-7b-instruct", name: "Falcon 7B Instruct" },
];

interface CfRawModel {
  name?: string;
  description?: string;
  task?: { name?: string };
}

export async function fetchCloudflareModels(
  accountId: string,
  apiToken: string
): Promise<ModelInfo[]> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models?task=text-generation`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Cloudflare model fetch gagal: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { result?: CfRawModel[] };
  return (data.result ?? []).map((m) => ({
    id: m.name ?? "",
    name: (m.name ?? "").replace("@cf/", "").split("/").pop()?.replace(/-/g, " ") ?? m.name ?? "",
    provider: "Cloudflare",
    free: true,
    source: "cloudflare" as const,
  }));
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface CloudflareChatOptions {
  accountId: string;
  apiToken: string;
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}

export async function cloudflareChat(opts: CloudflareChatOptions): Promise<Response> {
  const { accountId, apiToken, model, messages, stream = true } = opts;
  const modelId = model || "@cf/meta/llama-3.1-8b-instruct";
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, stream }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudflare chat error ${res.status}: ${errText}`);
  }
  return res;
}
