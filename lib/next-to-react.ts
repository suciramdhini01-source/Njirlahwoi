import { AgentFile } from "@/types";

/**
 * Convert a Next.js App Router project into a Sandpack-compatible pure React project.
 * Sandpack cannot run Next.js (no bundler + no server). We approximate by:
 *  - stripping "use client" directives
 *  - rewriting next/navigation, next/link, next/image, next/font imports to shims
 *  - remapping app/page.tsx → /src/App.tsx as the entry
 *  - collecting components under /src/components/*
 *  - building /src/index.tsx bootstrap + /index.html + minimal /package.json deps
 */

const DEFAULT_DEPS: Record<string, string> = {
  react: "18.2.0",
  "react-dom": "18.2.0",
  "framer-motion": "11.3.19",
  "lucide-react": "0.446.0",
  clsx: "2.1.1",
  "tailwind-merge": "2.5.2",
};

const NEXT_SHIMS = `/* next/* shims — replace Next primitives with plain React/DOM equivalents */
import React from "react";

export const Link = ({ href, children, ...rest }) =>
  React.createElement("a", { href: typeof href === "string" ? href : "#", ...rest }, children);

export const Image = ({ src, alt = "", width, height, ...rest }) =>
  React.createElement("img", { src, alt, width, height, ...rest });

export const useRouter = () => ({
  push: (url) => { try { window.history.pushState({}, "", url); } catch(e){} },
  replace: (url) => { try { window.history.replaceState({}, "", url); } catch(e){} },
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => {},
  prefetch: () => Promise.resolve(),
});
export const usePathname = () => (typeof window !== "undefined" ? window.location.pathname : "/");
export const useSearchParams = () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
export const useParams = () => ({});
export const redirect = (url) => { try { window.location.href = url; } catch(e){} };
export const notFound = () => {};

export const Inter = () => ({ className: "font-inter", variable: "--font-inter" });
export const Space_Grotesk = () => ({ className: "font-space", variable: "--font-space" });
export const Geist = () => ({ className: "font-geist", variable: "--font-geist" });
export const Geist_Mono = () => ({ className: "font-geist-mono", variable: "--font-geist-mono" });

const dynamicImport = (loader) => {
  const Lazy = React.lazy(loader);
  const Wrapped = (props) => React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy, props));
  return Wrapped;
};
export default dynamicImport;
`;

const TAILWIND_CDN_INJECT = `<script src="https://cdn.tailwindcss.com"></script>`;

function stripUseClient(src: string): string {
  return src.replace(/^\s*["']use client["'];?\s*\n?/m, "");
}

function stripUseServer(src: string): string {
  return src.replace(/^\s*["']use server["'];?\s*\n?/m, "");
}

function rewriteNextImports(src: string): string {
  let out = src;
  // next/navigation, next/link, next/image, next/font/google, next/dynamic → all shimmed
  out = out.replace(
    /from\s+["']next\/(navigation|router|link|image|font\/google|dynamic|headers|font\/local)["']/g,
    `from "./_next-shims"`
  );
  // import Image from "next/image"; import Link from "next/link";
  out = out.replace(
    /from\s+["']next\/(link|image|dynamic)["']/g,
    `from "./_next-shims"`
  );
  return out;
}

function rewriteServerActions(src: string): string {
  // very light — we just convert `async function action()` exports to no-ops if they have "use server"
  return src.replace(/"use server";?\s*/g, "");
}

function detectNextProject(files: AgentFile[]): boolean {
  return files.some(
    (f) =>
      f.path === "app/page.tsx" ||
      f.path === "app/page.jsx" ||
      f.path === "app/layout.tsx" ||
      f.path === "pages/index.tsx" ||
      /^app\/.+\/page\.(t|j)sx$/.test(f.path) ||
      f.path === "next.config.js" ||
      f.path === "next.config.ts"
  );
}

function transformFileContent(src: string, path: string): string {
  let out = src;
  if (/\.(tsx|ts|jsx|js)$/.test(path)) {
    out = stripUseClient(out);
    out = stripUseServer(out);
    out = rewriteNextImports(out);
    out = rewriteServerActions(out);
  }
  return out;
}

function collectDependencies(files: AgentFile[]): Record<string, string> {
  const deps: Record<string, string> = { ...DEFAULT_DEPS };
  const importRe = /from\s+["']([^"'./][^"']*)["']/g;
  for (const f of files) {
    if (!/\.(tsx|ts|jsx|js)$/.test(f.path)) continue;
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(f.content))) {
      const pkg = m[1];
      if (pkg.startsWith("next/") || pkg.startsWith("@/") || pkg === "next") continue;
      const scoped = pkg.startsWith("@")
        ? pkg.split("/").slice(0, 2).join("/")
        : pkg.split("/")[0];
      if (!deps[scoped]) {
        deps[scoped] = "latest";
      }
    }
  }
  // Try to honor explicit package.json from agent
  const pkgFile = files.find((f) => f.path === "package.json");
  if (pkgFile) {
    try {
      const pkg = JSON.parse(pkgFile.content);
      for (const [k, v] of Object.entries(pkg.dependencies || {})) {
        if (k.startsWith("next")) continue;
        deps[k] = (v as string).replace(/^[\^~]/, "");
      }
    } catch {
      /* ignore */
    }
  }
  return deps;
}

function remapPath(original: string): string {
  if (original === "app/page.tsx" || original === "app/page.jsx") return "/src/App.tsx";
  if (original === "app/layout.tsx" || original === "app/layout.jsx") return "/src/RootLayout.tsx";
  if (original === "app/globals.css") return "/src/globals.css";
  if (original === "pages/index.tsx" || original === "pages/index.jsx") return "/src/App.tsx";
  if (original === "pages/_app.tsx") return "/src/RootLayout.tsx";
  if (/^app\/(.+)\/page\.(t|j)sx$/.test(original)) {
    const seg = original.replace(/^app\/(.+)\/page\.(t|j)sx$/, "$1").replace(/[\[\]]/g, "_");
    return `/src/routes/${seg}.tsx`;
  }
  // Ensure leading slash
  return original.startsWith("/") ? original : `/${original}`;
}

function buildBootstrap(hasLayout: boolean): string {
  if (hasLayout) {
    return `import React from "react";
import { createRoot } from "react-dom/client";
import RootLayout from "./RootLayout";
import App from "./App";
import "./globals.css";

const el = document.getElementById("root");
createRoot(el).render(
  <React.StrictMode>
    <RootLayout>
      <App />
    </RootLayout>
  </React.StrictMode>
);
`;
  }
  return `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const el = document.getElementById("root");
createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
}

function buildIndexHtml(title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
${TAILWIND_CDN_INJECT}
<style>html,body,#root{height:100%;margin:0;background:#05050A;color:#fff;font-family:Inter,system-ui,sans-serif}</style>
</head>
<body>
<div id="root"></div>
</body>
</html>`;
}

function ensureGlobalsCss(files: AgentFile[]): string {
  const existing = files.find((f) => f.path === "app/globals.css" || f.path === "src/globals.css" || f.path === "globals.css");
  if (existing) return existing.content;
  return `/* generated globals.css */
html, body { margin: 0; padding: 0; }
* { box-sizing: border-box; }
`;
}

export interface SandpackBundle {
  template: "react-ts" | "react" | "static" | "vanilla";
  files: Record<string, string>;
  dependencies: Record<string, string>;
  entry: string;
  isNext: boolean;
}

export function buildSandpackBundle(agentFiles: AgentFile[]): SandpackBundle {
  const isNext = detectNextProject(agentFiles);

  if (!isNext) {
    const hasTsx = agentFiles.some((f) => f.path.endsWith(".tsx") || f.path.endsWith(".ts"));
    const hasJsx = agentFiles.some((f) => f.path.endsWith(".jsx"));
    const hasReact =
      hasTsx ||
      hasJsx ||
      agentFiles.some((f) => /from\s+["']react["']/.test(f.content));

    if (hasReact) {
      const out: Record<string, string> = {};
      for (const f of agentFiles) {
        const path = f.path.startsWith("/") ? f.path : `/${f.path}`;
        out[path] = transformFileContent(f.content, f.path);
      }
      // entry
      if (!out["/index.html"]) {
        out["/index.html"] = buildIndexHtml("Preview");
      }
      const deps = collectDependencies(agentFiles);
      return {
        template: hasTsx ? "react-ts" : "react",
        files: out,
        dependencies: deps,
        entry: out["/App.tsx"] ? "/App.tsx" : out["/src/App.tsx"] ? "/src/App.tsx" : "/index.html",
        isNext: false,
      };
    }

    // Static HTML project
    const out: Record<string, string> = {};
    for (const f of agentFiles) {
      const path = f.path.startsWith("/") ? f.path : `/${f.path}`;
      out[path] = f.content;
    }
    if (!out["/index.html"]) {
      out["/index.html"] = buildIndexHtml("Preview");
    }
    return {
      template: "static",
      files: out,
      dependencies: {},
      entry: "/index.html",
      isNext: false,
    };
  }

  // Next.js → pure React remapping
  const out: Record<string, string> = {};
  const hasLayout = agentFiles.some(
    (f) => f.path === "app/layout.tsx" || f.path === "app/layout.jsx"
  );

  for (const f of agentFiles) {
    if (
      f.path === "next.config.js" ||
      f.path === "next.config.ts" ||
      f.path === "next-env.d.ts" ||
      f.path === "package-lock.json"
    )
      continue;

    // Keep package.json for dep resolution but don't ship it to Sandpack
    if (f.path === "package.json") continue;

    const newPath = remapPath(f.path);
    const transformed = transformFileContent(f.content, f.path);
    out[newPath] = transformed;
  }

  out["/src/_next-shims.tsx"] = NEXT_SHIMS;
  out["/src/globals.css"] = ensureGlobalsCss(agentFiles);
  out["/src/index.tsx"] = buildBootstrap(hasLayout);
  out["/index.html"] = buildIndexHtml("NJIRLAH AI Preview");

  if (!out["/src/App.tsx"]) {
    out["/src/App.tsx"] = `export default function App() {
  return <div style={{padding:24,color:"#fff"}}><h1>Menunggu app/page.tsx...</h1></div>;
}`;
  }

  const deps = collectDependencies(agentFiles);
  // Ensure Tailwind directive works via CDN — no tailwindcss dep needed
  delete deps["tailwindcss"];
  delete deps["postcss"];
  delete deps["autoprefixer"];
  delete deps["next"];
  delete deps["@next/swc-wasm-nodejs"];

  return {
    template: "react-ts",
    files: out,
    dependencies: deps,
    entry: "/src/index.tsx",
    isNext: true,
  };
}
