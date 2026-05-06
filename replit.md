# NJIRLAH — AI Code Generation Platform

Platform berbasis Next.js untuk menghasilkan kode siap produksi dari prompt bahasa alami.

## Run & Operate

- **Dev**: `npm run dev -- -p 5000`
- **Build**: `npm run build`
- **Start**: `npm run start`
- **Typecheck**: `npm run typecheck`
- **Lint**: `npm run lint`

Required env vars: lihat `.env`

## Stack

- **Framework**: Next.js 13.5.1 (App Router)
- **Language**: TypeScript 5.2.2
- **Styling**: Tailwind CSS 3.3.3
- **UI Components**: Radix UI + shadcn/ui
- **State**: Zustand, React Query (TanStack)
- **Forms**: React Hook Form + Zod
- **AI SDKs**: Anthropic, Google GenAI, OpenAI
- **Database**: Supabase

## Where things live

- `app/` — Next.js app router pages & layouts
- `components/` — shared UI components
- `lib/` — utilities & helpers
- `store/` — Zustand state stores
- `hooks/` — custom React hooks
- `types/` — TypeScript type definitions
- `supabase/` — Supabase config & migrations
- `public/` — static assets

## Architecture decisions

- App Router (Next.js 13) dipilih untuk server components & streaming
- Supabase digunakan sebagai backend auth + database
- Middleware (`middleware.ts`) menangani auth routing
- `images.unoptimized: true` agar kompatibel dengan Netlify deployment

## Product

- Generate kode dari prompt bahasa alami
- Playground interaktif untuk mencoba AI code generation
- Pricing plans dengan tier berbeda
- Auth (Sign In / Start Building)

## User preferences

_Populate as you build_

## Gotchas

- Jalankan di port 5000 agar muncul di Replit preview pane
- ESLint dinonaktifkan saat build (`ignoreDuringBuilds: true`)

## Pointers

- Skill workflows: `.local/skills/workflows/SKILL.md`
- Skill database: `.local/skills/database/SKILL.md`
