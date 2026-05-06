# NJIRLAH AI — Multi-Model AI Chat Platform

Platform chat AI premium dengan glassmorphism neon, animasi 60fps, BYOK OpenRouter, dan Cloudflare Workers AI server-side gratis.

## Run & Operate

- **Dev**: `npm run dev -- -p 5000` (via Replit workflow)
- **Build**: `npm run build`
- **Start**: `npm run start`
- **Typecheck**: `npm run typecheck`

Required env vars:
- `CLOUDFLARE_API_TOKEN` — Token server-side untuk Cloudflare Workers AI
- `CLOUDFLARE_ACCOUNT_ID` — Account ID Cloudflare

## Stack

- **Framework**: Next.js 13.5.1 (App Router), TypeScript strict
- **Styling**: Tailwind CSS 3.3.3 + custom neon theme (purple/cyan/pink)
- **UI**: Radix UI + shadcn/ui, Space Grotesk heading font
- **Animation**: Framer Motion v12 + GSAP v3 + @react-spring/web v10 + anime.js v4 + react-transition-group
- **Gestures**: @use-gesture/react (iOS drag slider)
- **State**: Zustand (persisted localStorage)
- **AI**: OpenRouter API (BYOK) + Cloudflare Workers AI (server-side)
- **Crypto**: Web Crypto API AES-GCM for key encryption

## Where things live

- `app/` — Next.js App Router (layout.tsx, page.tsx, globals.css)
- `app/api/openrouter/chat/` — Streaming BYOK proxy
- `app/api/cloudflare/chat/` — Server-side CF streaming proxy
- `app/api/cloudflare/models/` — Server-side CF model list
- `components/chat/` — ChatBubble, ChatInput (temperature slider), ChatArea, TypingIndicator
- `components/layout/` — Sidebar (hold-to-delete, swipe, search), Header (anime.js path draw, split text), Footer (anime.js unicorn walk), UnicornBackground (canvas + react-spring glow)
- `components/ui/` — ApiKeyModal, ModelSelector (tilt card, magnetic chips, ProviderFolder), CustomCursor, CommandPalette, ProgressBar, ToastStack, TemperatureSlider, HoldToDelete, MultiStateBadge, ProviderFolder, ScrollReveal, ImageReveal
- `store/chat-store.ts` — Chat state (messages, streaming, model, temperature)
- `store/api-key-store.ts` — BYOK key (AES-GCM encrypted in localStorage)
- `lib/openrouter.ts` — FREE_MODELS list + fetchOpenRouterModels + SUPPORTED_PROVIDERS
- `lib/cloudflare.ts` — CF default models + fetchCloudflareModels
- `lib/encryption.ts` — AES-GCM encrypt/decrypt
- `hooks/useFollowPointer.ts` — react-spring pointer tracking
- `hooks/useGSAPParallax.ts` — GSAP ScrollTrigger parallax + scroll zoom

## Architecture decisions

- **OpenRouter = strict BYOK**: No server key. Key encrypted client-side with AES-GCM (Web Crypto). Proxy only reads `x-api-key` header and forwards.
- **Cloudflare = server-side**: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` used only in Edge routes, never exposed to client.
- **Default provider is Cloudflare** (`selectedProvider: 'cloudflare'`) so app works immediately without any key.
- **Temperature** is stored in Zustand and sent to OpenRouter; Cloudflare ignores it (CF API doesn't support it in same way).
- **UnicornBackground** uses canvas + requestAnimationFrame (SSR disabled via dynamic import).
- **Zustand stores**: `njirlah-chats-v2` (chats + temperature) and `njirlah-apikey-v2` (encrypted key only).

## Product

- **Cloudflare tab** (default): 10+ CF models, server-side token, no key needed
- **OpenRouter tab**: 55+ providers, BYOK, full model list fetched dynamically
- **Temperature slider** (iOS-style, react-spring drag): controls AI creativity 0–2
- **Command palette** (Ctrl+K): searchable commands with keyboard navigation
- **Custom cursor**: neon ring spring + color trail by velocity
- **Sidebar**: collapse, search chat, swipe-left to reveal delete, hold 2s to confirm delete
- **Model selector**: tilt card, magnetic chips, iOS App Folder provider grouping
- **Chat**: streaming SSE, stop button, regenerate, like/dislike, stagger word animation
- **Animations**: 49 spec items implemented across FM/GSAP/react-spring/anime.js/react-transition-group
- **Footer**: anime.js unicorn walking along track + animated heart

## User preferences

- Language: Indonesian (Bahasa Indonesia) UI text
- Branding: edgy, playful, premium — neon purple/cyan/pink, Space Grotesk heading
- Footer: "Dibuat dengan ❤️ oleh Andikaa Saputraa"

## Gotchas

- Run port 5000 for Replit preview pane
- ESLint disabled during build (`ignoreDuringBuilds: true`)
- `UnicornBackground` must be `dynamic` with `ssr: false` (uses canvas/window)
- `TemperatureSlider` guards against `undefined` value (Zustand hydration delay)
- GSAP ScrollTrigger imported lazily in `useEffect` to avoid SSR
- anime.js v4 import: `const anime = (await import('animejs')).default ?? animeModule`
- `@use-gesture/react` must be installed for TemperatureSlider drag

## Pointers

- OpenRouter docs: https://openrouter.ai/docs
- Cloudflare AI docs: https://developers.cloudflare.com/workers-ai/
