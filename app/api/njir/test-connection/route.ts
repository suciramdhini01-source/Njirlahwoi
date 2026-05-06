import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/provider-configs";

export const runtime = "edge";

interface Body {
  slug: string;
  values: Record<string, string>;
}

async function testProvider(slug: string, values: Record<string, string>) {
  const cfg = getProvider(slug);
  if (!cfg) return { success: false, message: "Provider tidak dikenal" };
  const key = values.apiKey;
  if (!key) return { success: false, message: "API key kosong" };

  try {
    if (slug === "cloudflare") {
      const accountId = values.accountId;
      if (!accountId) return { success: false, message: "Account ID wajib" };
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search?task=text-generation&per_page=50`,
        { headers: { Authorization: `Bearer ${key}` } }
      );
      if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
      const j = await res.json();
      const models = (j.result || []).map((m: { name?: string; description?: string }) => ({
        id: m.name,
        name: (m.name || "").split("/").pop(),
      }));
      return { success: true, message: "Terhubung", modelCount: models.length, models };
    }

    if (slug === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      });
      if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
      const j = await res.json();
      const models = (j.data || []).map((m: { id: string; display_name?: string }) => ({
        id: m.id,
        name: m.display_name || m.id,
      }));
      return { success: true, message: "Terhubung", modelCount: models.length, models };
    }

    if (slug === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
      );
      if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
      const j = await res.json();
      const models = (j.models || [])
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          (m.supportedGenerationMethods || []).includes("generateContent")
        )
        .map((m: { name: string; displayName?: string }) => ({
          id: m.name.replace(/^models\//, ""),
          name: m.displayName || m.name,
        }));
      return { success: true, message: "Terhubung", modelCount: models.length, models };
    }

    // OpenAI-compatible /models endpoint
    const url = `${cfg.baseUrl.replace(/\/$/, "")}/models`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
    const j = await res.json();
    const list = j.data || j.models || j.result || [];
    const models = list.map((m: { id?: string; name?: string; context_length?: number }) => ({
      id: m.id || m.name || "",
      name: m.name || m.id || "",
      context: m.context_length,
    }));
    return { success: true, message: "Terhubung", modelCount: models.length, models };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const result = await testProvider(body.slug, body.values || {});
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ success: false, message: (e as Error).message }, { status: 400 });
  }
}
