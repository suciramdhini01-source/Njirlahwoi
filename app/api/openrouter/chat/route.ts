import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const userApiKey = req.headers.get('x-api-key');
    if (!userApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key wajib diisi. Masukkan key kamu di settings.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { messages, model, stream = true } = body;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://njirlah.ai',
        'X-Title': 'NJIRLAH AI',
      },
      body: JSON.stringify({ model: model || 'meta-llama/llama-3.1-8b-instruct:free', messages, stream }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    if (stream) {
      return new Response(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return NextResponse.json(await res.json());
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
