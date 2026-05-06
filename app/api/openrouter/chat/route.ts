import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userApiKey = req.headers.get('x-api-key');
    const apiKey = userApiKey || process.env.OPENROUTER_FREE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key available' }, { status: 401 });
    }

    const { messages, model, stream = true } = body;

    const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://njirlah.ai',
        'X-Title': 'NJIRLAH AI',
      },
      body: JSON.stringify({
        model: model || 'meta-llama/llama-3.1-8b-instruct:free',
        messages,
        stream,
      }),
    });

    if (!openrouterRes.ok) {
      const err = await openrouterRes.text();
      return NextResponse.json({ error: err }, { status: openrouterRes.status });
    }

    if (stream) {
      return new Response(openrouterRes.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const data = await openrouterRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
