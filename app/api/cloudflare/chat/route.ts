import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cfToken = req.headers.get('x-cf-token');
    const cfAccountId = req.headers.get('x-cf-account-id');

    if (!cfToken || !cfAccountId) {
      return NextResponse.json(
        { error: 'Cloudflare token and account ID required' },
        { status: 401 }
      );
    }

    const { messages, model, stream = true } = body;
    const modelId = model || '@cf/meta/llama-3.1-8b-instruct';

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${modelId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, stream }),
      }
    );

    if (!cfRes.ok) {
      const err = await cfRes.text();
      return NextResponse.json({ error: err }, { status: cfRes.status });
    }

    if (stream) {
      return new Response(cfRes.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const data = await cfRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
