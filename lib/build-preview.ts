import { AgentFile } from "@/types";

export function buildPreviewHtml(files: AgentFile[]): string {
  const index = files.find((f) => /index\.html$/i.test(f.path));
  if (!index) {
    const firstHtml = files.find((f) => /\.html$/i.test(f.path));
    if (firstHtml) return inlineAssets(firstHtml.content, files);
    return fallbackHtml(files);
  }
  return inlineAssets(index.content, files);
}

function inlineAssets(html: string, files: AgentFile[]): string {
  let out = html;
  out = out.replace(
    /<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi,
    (_m, href) => {
      const f = files.find((x) => x.path.endsWith(href.replace(/^\.?\//, "")));
      return f ? `<style>\n${f.content}\n</style>` : "";
    }
  );
  out = out.replace(
    /<script[^>]*src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi,
    (_m, src) => {
      const f = files.find((x) => x.path.endsWith(src.replace(/^\.?\//, "")));
      return f ? `<script>\n${f.content}\n</script>` : "";
    }
  );
  return out;
}

function fallbackHtml(files: AgentFile[]): string {
  return `<!doctype html><html><body style="background:#05050A;color:#fff;font-family:sans-serif;padding:24px"><h1>Pratinjau</h1><p>Menunggu file index.html dari agent...</p><pre style="color:#9ca3af;white-space:pre-wrap">${files
    .map((f) => f.path)
    .join("\n")}</pre></body></html>`;
}
