import type { FileSystemTree, DirectoryNode, FileNode } from '@webcontainer/api';

export function buildFilesystemTree(files: Record<string, string>): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const [rawPath, contents] of Object.entries(files)) {
    const parts = rawPath.replace(/^\//, '').split('/');
    let node: FileSystemTree = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      if (!node[dir]) {
        (node[dir] as DirectoryNode) = { directory: {} };
      }
      node = (node[dir] as DirectoryNode).directory;
    }

    const filename = parts[parts.length - 1];
    (node[filename] as FileNode) = {
      file: { contents },
    };
  }

  return tree;
}

export function agentFilesToRecord(
  files: { path: string; content: string }[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of files) {
    if (f.path && f.content) {
      out[f.path] = f.content;
    }
  }
  return out;
}

export function detectProjectType(files: Record<string, string>): 'vite-react' | 'next' | 'html' | 'unknown' {
  const paths = Object.keys(files);
  const hasPkg = paths.some((p) => p === 'package.json' || p.endsWith('/package.json'));

  if (!hasPkg) {
    if (paths.some((p) => /index\.html$/i.test(p))) return 'html';
    return 'unknown';
  }

  const pkgPath = paths.find((p) => p === 'package.json' || p.endsWith('/package.json'));
  if (pkgPath) {
    try {
      const pkg = JSON.parse(files[pkgPath]);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['next']) return 'next';
      if (deps['vite'] || deps['@vitejs/plugin-react']) return 'vite-react';
    } catch {}
  }

  return 'unknown';
}

export function injectViteTemplate(files: Record<string, string>): Record<string, string> {
  const hasPackageJson = 'package.json' in files;
  const hasSrcMain = 'src/main.tsx' in files || 'src/main.jsx' in files;
  const hasIndexHtml = 'index.html' in files;

  const out = { ...files };

  if (!hasPackageJson) {
    const srcEntry = Object.keys(files).find((p) => /\.(tsx|jsx)$/.test(p));
    const entryFile = srcEntry ? srcEntry.replace(/^src\//, '') : 'App.tsx';

    out['package.json'] = JSON.stringify({
      name: 'agent-preview',
      private: true,
      version: '0.0.1',
      type: 'module',
      scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
      dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.0.0',
        typescript: '^5.0.0',
        vite: '^4.4.0',
      },
    }, null, 2);
  }

  if (!hasIndexHtml) {
    const entry = hasSrcMain ? '/src/main.tsx' : '/src/App.tsx';
    out['index.html'] = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${entry}"></script>
  </body>
</html>`;
  }

  if (!hasSrcMain) {
    const appFile = Object.keys(files).find((p) => /App\.(tsx|jsx)$/.test(p)) || 'src/App.tsx';
    out['src/main.tsx'] = `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './${appFile.replace(/^src\//, '').replace(/\.(tsx|jsx)$/, '')}';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`;
  }

  if (!('vite.config.ts' in files) && !('vite.config.js' in files)) {
    out['vite.config.ts'] = `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { host: true },\n});\n`;
  }

  return out;
}
