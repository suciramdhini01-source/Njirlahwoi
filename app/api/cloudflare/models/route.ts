import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-cf-token");
  const accountId = req.headers.get("x-cf-account-id");
  if (!token || !accountId) {
    return new Response(
      JSON.stringify({ error: "Missing Cloudflare credentials" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search?task=Text+Generation&per_page=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
