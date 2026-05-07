import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message } = (await req.json()) as { message?: string };
    if (!message?.trim()) {
      return NextResponse.json({ title: 'New Chat' });
    }

    const token = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!token || !accountId) {
      const fallback = message.slice(0, 40) + (message.length > 40 ? '…' : '');
      return NextResponse.json({ title: fallback });
    }

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content:
                'Kamu adalah asisten penamaan chat. Tugasmu: buat judul singkat 3-5 kata dalam bahasa Indonesia untuk percakapan berdasarkan pesan pertama user. Hanya jawab dengan judulnya saja, tanpa tanda kutip, tanpa tanda baca di akhir, tanpa penjelasan tambahan.',
            },
            { role: 'user', content: message.slice(0, 200) },
          ],
          max_tokens: 20,
          stream: false,
        }),
      }
    );

    if (res.ok) {
      const data = (await res.json()) as { result?: { response?: string } };
      const raw = data?.result?.response?.trim() ?? '';
      const title = raw.replace(/^["']|["']$/g, '').slice(0, 50) || message.slice(0, 40);
      return NextResponse.json({ title });
    }

    return NextResponse.json({ title: message.slice(0, 40) });
  } catch {
    return NextResponse.json({ title: 'New Chat' });
  }
}
