---
name: unicorn-studio
description: Setup Unicorn Studio WebGL shaders for stunning visual effects. Use this skill when the user says "setup shaders", "add unicorn studio", "webgl effects", "shader effects", "visual effects", or "unicorn.studio".
author: "@mattwoodco"
version: 1.1.0
created: 2026-01-12
validated: 2026-02-17
---
# Unicorn Studio WebGL Shaders for Next.js

No-code WebGL shader effects with the unicornstudio-react package. Create stunning visual backgrounds, hero sections, and interactive effects.

## Installation

```bash
npm install unicornstudio-react
```

**Version Compatibility:**
- Next.js 15+ with React 19: `unicornstudio-react@1.4.26+`
- SDK version: `unicornstudio.js@2.0.1` (38kb gzipped)

## Configuration Schema

All Unicorn Studio scenes use a single JSON configuration object:

```typescript
type UnicornSceneConfig = {
  // Scene Source (required - choose ONE)
  projectId?: string;       // Unicorn Studio embed ID (cloud-hosted)
  jsonFilePath?: string;    // Path to self-hosted JSON file

  // Dimensions
  width?: number | string;  // Default: "100%"
  height?: number | string; // Default: "100%"

  // Performance
  scale?: number;           // 0.25-1.0, rendering scale (default: 1)
  dpi?: number;             // 1.0-2.0, pixel ratio (default: 1.5)
  fps?: 15 | 24 | 30 | 60 | 120; // Valid frame rates (default: 60)

  // Behavior
  lazyLoad?: boolean;       // Load when visible (default: true)
  production?: boolean;     // Use CDN (default: true)

  // Accessibility
  altText?: string;         // SEO alternative text
  ariaLabel?: string;       // Screen reader label

  // Placeholder
  placeholder?: string;                    // Image URL or React component
  showPlaceholderWhileLoading?: boolean;   // Default: true
  showPlaceholderOnError?: boolean;        // Default: true

  // Callbacks
  onLoad?: () => void;
  onError?: (error: Error) => void;
};
```

## Basic Usage

### 1. Client Component with Cloud-Hosted Scene

```tsx
// components/shader/unicorn-scene.tsx
"use client";
import UnicornScene from "unicornstudio-react/next";

type ShaderSceneProps = {
  projectId: string;
  className?: string;
};

export function ShaderScene({ projectId, className }: ShaderSceneProps) {
  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <UnicornScene
        projectId={projectId}
        width="100%"
        height="100%"
        scale={0.75}
        dpi={1.5}
        fps={60}
        lazyLoad={true}
        production={true}
        altText="Animated background effect"
        onLoad={() => console.log("Shader loaded")}
        onError={(err) => console.error("Shader error:", err)}
      />
    </div>
  );
}
```

### 2. Dynamic Import Wrapper (SSR-Safe)

```tsx
// components/shader/dynamic-shader.tsx
"use client";
import dynamic from "next/dynamic";

export const DynamicShader = dynamic(
  () => import("./unicorn-scene").then((mod) => mod.ShaderScene),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: "100%", height: "100%", background: "#05050A" }} />
    ),
  }
);
```

### 3. Use in Page

```tsx
// app/page.tsx
import { DynamicShader } from "@/components/shader/dynamic-shader";

export default function HomePage() {
  return (
    <main>
      {/* Hero with Shader Background */}
      <section style={{ position: "relative", height: "100vh" }}>
        <DynamicShader projectId="your-project-id" className="absolute inset-0" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1>Welcome</h1>
        </div>
      </section>
    </main>
  );
}
```

## Self-Hosted JSON (Legend Subscribers)

For self-hosting shaders via JSON export:

### 1. Export Scene from Unicorn Studio

1. Open your project in Unicorn Studio
2. Click Export > Code (JSON)
3. Download the `.json` file
4. Place in `public/shaders/` directory

### 2. Use with jsonFilePath

```tsx
"use client";
import UnicornScene from "unicornstudio-react/next";

export function SelfHostedShader() {
  return (
    <UnicornScene
      jsonFilePath="/shaders/hero-effect.json"
      width="100%"
      height="100%"
      scale={0.75}
      lazyLoad={true}
    />
  );
}
```

### Example JSON Structure

```json
{
  "version": "2.0.1",
  "name": "Hero Gradient",
  "width": 1920,
  "height": 1080,
  "fps": 60,
  "layers": [
    {
      "type": "gradient",
      "colors": ["#667eea", "#764ba2"],
      "angle": 45,
      "animated": true
    }
  ],
  "effects": [
    {
      "type": "noise",
      "intensity": 0.1,
      "scale": 2.0
    }
  ],
  "interactivity": {
    "mouse": {
      "enabled": true,
      "strength": 0.5
    }
  }
}
```

## Performance Configuration

### Performance Presets

```tsx
// High Performance (Mobile-friendly)
const mobileConfig = {
  scale: 0.5,
  dpi: 1,
  fps: 30,
  lazyLoad: true,
};

// Balanced (Default)
const balancedConfig = {
  scale: 0.75,
  dpi: 1.5,
  fps: 60,
  lazyLoad: true,
};

// High Quality (Desktop)
const highQualityConfig = {
  scale: 1,
  dpi: 2,
  fps: 60,
  lazyLoad: false,
};
```

### Adaptive Performance Component

```tsx
"use client";
import { useState, useEffect } from "react";
import UnicornScene from "unicornstudio-react/next";

type PerformanceLevel = "low" | "medium" | "high";

const PERFORMANCE_CONFIGS: Record<PerformanceLevel, { scale: number; dpi: number; fps: 15 | 24 | 30 | 60 | 120 }> = {
  low:    { scale: 0.5,  dpi: 1,   fps: 30 },
  medium: { scale: 0.75, dpi: 1.5, fps: 60 },
  high:   { scale: 1,    dpi: 2,   fps: 60 },
};

type AdaptiveShaderProps = {
  projectId: string;
  className?: string;
};

export function AdaptiveShader({ projectId, className }: AdaptiveShaderProps) {
  const [performanceLevel, setPerformanceLevel] = useState<PerformanceLevel>("medium");

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    if (hasReducedMotion || isMobile || hardwareConcurrency < 4) {
      setPerformanceLevel("low");
    } else if (hardwareConcurrency >= 8) {
      setPerformanceLevel("high");
    } else {
      setPerformanceLevel("medium");
    }
  }, []);

  const config = PERFORMANCE_CONFIGS[performanceLevel];

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <UnicornScene
        projectId={projectId}
        width="100%"
        height="100%"
        {...config}
        lazyLoad={true}
        production={true}
      />
    </div>
  );
}
```

## Common Patterns

### Hero Section with Overlay

```tsx
export function ShaderHero({
  projectId,
  title,
  subtitle,
}: {
  projectId: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center" }}>
      {/* Shader Background */}
      <div style={{ position: "absolute", inset: 0 }}>
        <AdaptiveShader projectId={projectId} />
      </div>

      {/* Gradient Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8))"
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 2rem" }}>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}
```

### Card with Shader Background

```tsx
export function ShaderCard({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", borderRadius: "1rem", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <AdaptiveShader projectId={projectId} />
      </div>
      <div style={{ position: "relative", zIndex: 1, padding: "2rem" }}>
        {children}
      </div>
    </div>
  );
}
```

### Interactive Mouse Effects

```tsx
"use client";
import { useRef, useCallback } from "react";
import UnicornScene from "unicornstudio-react/next";

export function InteractiveShader({ projectId }: { projectId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      // Use for custom effects
    }
  }, []);

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} style={{ width: "100%", height: "100%" }}>
      <UnicornScene projectId={projectId} width="100%" height="100%" />
    </div>
  );
}
```

## Best Practices

### 1. Always Use Dynamic Imports

```tsx
// Required for Next.js SSR compatibility
const Shader = dynamic(() => import("./shader"), { ssr: false });
```

### 2. Set Container Dimensions

```tsx
// Container MUST have explicit dimensions
<div style={{ width: "100%", height: "400px", position: "relative" }}>
  <DynamicShader projectId="..." />
</div>
```

### 3. Limit Scenes Per Page

- Maximum 16 WebGL contexts per page (browser limit)
- Recommend under 10 scenes for optimal performance
- Use lazy loading for below-fold scenes

### 4. Accessibility

```tsx
<UnicornScene
  projectId="..."
  altText="Animated gradient background"
  ariaLabel="Decorative animated background"
/>
```

### 5. Respect Reduced Motion

```tsx
"use client";
import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return reducedMotion;
}

export function AccessibleShader({ projectId }: { projectId: string }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1a1a2e, #16213e)" }} />
    );
  }

  return <AdaptiveShader projectId={projectId} />;
}
```

## Vercel Deployment

### Environment Considerations

1. **No API keys required** for cloud-hosted scenes (projectId)
2. **Self-hosted JSON** files go in `public/shaders/`
3. **CDN optimization** enabled via `production={true}`

### Edge Runtime Compatibility

Unicorn Studio scenes render client-side only. No server-side configuration needed.

### Cache Headers

For self-hosted JSON files, add cache headers in `next.config.js`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: "/shaders/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## Known Limitations

### FPS Values

The `fps` prop only accepts specific values: `15 | 24 | 30 | 60 | 120`. Arbitrary frame rates are not supported.

### No Pause Control

The `UnicornScene` component does not support a `paused` prop. To simulate pause:
- Hide/show the component conditionally
- Use a very low fps (15) when "paused"
- Access the scene instance via SDK directly for programmatic control

## Troubleshooting

### Scene Not Rendering

1. Verify container has explicit dimensions
2. Check projectId is correct
3. Ensure `ssr: false` in dynamic import
4. Check browser console for WebGL errors

### Performance Issues

1. Reduce `scale` (0.5-0.75 for mobile)
2. Lower `dpi` (1-1.5)
3. Reduce `fps` (30 for mobile)
4. Enable `lazyLoad`
5. Check layer count in Unicorn Studio editor

### Hydration Errors

Always use dynamic imports:

```tsx
const Shader = dynamic(() => import("./shader"), { ssr: false });
```

### Mobile Issues

```tsx
// Disable mouse interaction on mobile for better performance
<UnicornScene projectId="..." scale={0.5} dpi={1} fps={30} lazyLoad={true} />
```

## File Structure

```
components/
  shader/
    unicorn-scene.tsx       # Base scene component
    dynamic-shader.tsx      # Dynamic import wrapper
    adaptive-shader.tsx     # Performance-aware component
    shader-hero.tsx         # Hero section pattern
    shader-card.tsx         # Card pattern
public/
  shaders/                  # Self-hosted JSON files
    hero-effect.json
    card-background.json
app/
  shader-test/
    page.tsx                # Debug/test page
```

## Resources

- [Unicorn Studio](https://www.unicorn.studio/)
- [unicornstudio-react (npm)](https://www.npmjs.com/package/unicornstudio-react)
- [unicornstudio.js SDK](https://github.com/hiunicornstudio/unicornstudio.js)
- [Embed Documentation](https://www.unicorn.studio/docs/embed/)
- [Performance Guide](https://www.unicorn.studio/docs/performance/)
