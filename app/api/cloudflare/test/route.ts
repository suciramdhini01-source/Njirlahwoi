import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { accountId?: string; apiToken?: string };
    const { accountId, apiToken } = body;

    // If no body creds, fall back to env (server-side test)
    const token = apiToken ?? process.env.CLOUDFLARE_API_TOKEN;
    const account = accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!token || !account) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/ai/models?task=text-generation&per_page=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.ok) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, status: res.status }, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
