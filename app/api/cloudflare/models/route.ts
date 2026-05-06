import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface CfRawModel {
  name?: string;
  description?: string;
  task?: { name?: string };
}

const FALLBACK_MODELS = [
  { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct' },
  { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B Instruct' },
  { id: '@cf/meta/llama-3.2-3b-instruct', name: 'Llama 3.2 3B Instruct' },
  { id: '@cf/meta/llama-3.2-1b-instruct', name: 'Llama 3.2 1B Instruct' },
  { id: '@cf/mistral/mistral-7b-instruct-v0.1', name: 'Mistral 7B Instruct' },
  { id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill 32B' },
  { id: '@cf/qwen/qwen2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B' },
  { id: '@cf/google/gemma-7b-it-lora', name: 'Gemma 7B IT' },
  { id: '@cf/microsoft/phi-2', name: 'Phi-2' },
  { id: '@cf/tiiuae/falcon-7b-instruct', name: 'Falcon 7B Instruct' },
];

export async function GET() {
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!cfToken || !cfAccountId) {
    return NextResponse.json({ models: FALLBACK_MODELS, fallback: true });
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/models?task=text-generation`,
      { headers: { Authorization: `Bearer ${cfToken}` } }
    );
    if (!res.ok) throw new Error(`CF models fetch failed: ${res.status}`);
    const data = (await res.json()) as { result?: CfRawModel[] };
    const models = (data.result ?? [])
      .filter((m) => m.task?.name === 'Text Generation' || !m.task)
      .map((m) => ({
        id: m.name ?? '',
        name:
          (m.name ?? '').replace('@cf/', '').split('/').pop()?.replace(/-/g, ' ') ??
          m.name ??
          '',
      }));
    return NextResponse.json({
      models: models.length ? models : FALLBACK_MODELS,
      fallback: false,
    });
  } catch {
    return NextResponse.json({ models: FALLBACK_MODELS, fallback: true });
  }
}

// POST kept for backward-compat with store/model.ts that uses POST with headers
export async function POST() {
  return GET();
}
