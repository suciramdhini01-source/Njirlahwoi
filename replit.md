# NJIRLAH AI — Chat AI Multi-Model Platform

Platform chat AI multi-model dengan mode tamu gratis dan BYOK (Bring Your Own Key) untuk 55+ provider OpenRouter + Cloudflare Workers AI.

## Run & Operate

- **Dev**: `npm run dev -- -p 5000`
- **Build**: `npm run build`
- **Start**: `npm run start`
- **Typecheck**: `npm run typecheck`

Required env vars:
- `OPENROUTER_FREE_API_KEY` — API key gratis untuk mode tamu (server-side only)
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase (opsional)

## Stack

- **Framework**: Next.js 13.5.1 (App Router)
- **Language**: TypeScript 5.2.2
- **Styling**: Tailwind CSS 3.3.3 + custom neon theme
- **UI Components**: Radix UI + shadcn/ui + Framer Motion
- **State**: Zustand (persisted via localStorage)
- **AI**: OpenRouter API + Cloudflare Workers AI via proxy routes

## Where things live

- `app/` — Next.js app router (layout.tsx, page.tsx, globals.css)
- `app/api/openrouter/chat/` — Streaming proxy for OpenRouter
- `app/api/cloudflare/chat/` — Streaming proxy for Cloudflare Workers AI
- `components/chat/` — ChatBubble, ChatInput, ChatArea, TypingIndicator
- `components/layout/` — Sidebar, Header, Footer, UnicornBackground
- `components/ui/` — ApiKeyModal, ModelSelector
- `store/chat-store.ts` — Chat state (messages, streaming, model selection)
- `store/api-key-store.ts` — BYOK key storage (localStorage only, never server)
- `lib/openrouter.ts` — Free models list + fetchOpenRouterModels
- `lib/cloudflare.ts` — Default CF models + fetchCloudflareModels
- `lib/encryption.ts` — AES-GCM encryption for localStorage keys

## Architecture decisions

- API keys NEVER leave the client — proxy routes read `x-api-key` header and forward without storing
- Mode tamu: uses `OPENROUTER_FREE_API_KEY` env var (server-side), 16 hardcoded free models
- BYOK mode: fetches full model list from OpenRouter API dynamically
- Zustand stores use key `njirlah-chats-v2` and `njirlah-api-keys-v1` for localStorage
- `UnicornBackground` uses canvas particle animation (SSR disabled via dynamic import)

## Product

- Multi-model AI chat (guest mode free, BYOK for all providers)
- Sidebar with chat history, New Chat, API Key settings
- ModelSelector with tabbed Free / OpenRouter / Cloudflare model picker
- Streaming responses with stop button
- Copy, regenerate, like/dislike on messages
- Unicorn Easter Egg: click logo 3x for dancing unicorn animation
- Footer: "Dibuat dengan ❤️ oleh Andikaa Saputraa"

## User preferences

- Language: Indonesian (Bahasa Indonesia) in UI text
- Branding: edgy, playful, premium — neon purple/cyan/pink

## Gotchas

- Jalankan di port 5000 agar muncul di Replit preview pane
- ESLint dinonaktifkan saat build (`ignoreDuringBuilds: true`)
- `UnicornBackground` must be `dynamic` with `ssr: false` (uses canvas/window)
- Zustand hydration: use `_hasHydrated` check before auto-creating first chat

## Pointers

- Skill workflows: `.local/skills/workflows/SKILL.md`
- OpenRouter API docs: https://openrouter.ai/docs
