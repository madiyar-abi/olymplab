# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

OlympLab is a competitive-programming training platform: a custom in-browser IDE, problem catalog, algorithm visualizers, a graph editor / whiteboard, and an AI mentor. Stack: Next.js 16 (App Router) + React 19 + TypeScript, Supabase (Postgres/auth/realtime), Tailwind v4, next-intl.

## Commands

```bash
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (flat config in eslint.config.mjs)
```

There is **no test runner** configured. The many `lint*.log` / `run*.log` files in the repo root are throwaway debug artifacts, not tracked tooling.

### Data / ingestion scripts (`scripts/`)
Standalone Node scripts that seed and scrape problem data. They are **not** wired into Next.js: they load `.env.local` manually and talk to Supabase with the **service-role key** (bypassing RLS). Most exist as both a `.ts` source and a compiled `.js`; run the `.js` with plain `node`:

```bash
node scripts/ingest_cf.js 71A 158A ...      # ingest Codeforces problems
node scripts/seed_roadmap.js                 # seed roadmap_topics
node scripts/ingest_article.js <topicId> <url>
```

### Required env vars (`.env.local`)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `CF_HANDLE` / `CF_PASSWORD` (for the Codeforces submission bot).

## Next.js 16 gotchas (read AGENTS.md first)

This is a newer Next.js than most training data. Concretely, in this repo:
- **Middleware lives in `src/proxy.ts` and exports `proxy()`**, not `middleware.ts`/`middleware()`. It chains Supabase session refresh → next-intl routing.
- `params` and `searchParams` are **Promises** — always `await params` (see route handlers and pages).
- `cookies()` from `next/headers` is **async** — `await cookies()`.
- Before writing framework code, consult `node_modules/next/dist/docs/` as AGENTS.md instructs.

## Architecture

### Internationalization (next-intl)
Every user-facing route is nested under `src/app/[locale]/`. Locales are `en` and `ru` (default `en`), defined in `src/i18n/routing.ts`; messages live in `messages/{en,ru}.json`. **Always navigate with the wrappers from `@/i18n/routing`** (`Link`, `redirect`, `useRouter`, `usePathname`) rather than `next/navigation`, so the locale prefix is preserved. `src/i18n/request.ts` loads the right message bundle per request.

### Auth & Supabase clients
Three client factories, do not mix them up:
- `@/lib/supabase/server` — server components / route handlers (async, reads cookies).
- `@/lib/supabase/client` — browser/client components.
- `@/lib/supabase/middleware` (`updateSession`) — used only by `proxy.ts`; refreshes the session and redirects unauthenticated users away from `/dashboard`.

RLS is enabled on all tables (`supabase/migrations/`). **API routes that write submissions deliberately bypass RLS** by constructing a second admin client with `SUPABASE_SERVICE_ROLE_KEY` (`createAdminClient`), then manually enforce ownership in code (e.g. the submission-polling route checks `submission.user_id === user.id`). Follow this existing pattern rather than loosening RLS policies. Despite `@clerk/nextjs` being a dependency, auth is Supabase (`supabase.auth.getUser()`).

### The judging pipeline (the core of the app)
Submissions are routed by the problem's `external_id` prefix. The whole flow is: `IDEClient` → `POST /api/submit` → poll `GET /api/submissions/[id]` (and/or Supabase realtime via `useSubmissionRealtime`) until `status === 'COMPLETED'`.

`POST /api/submit` (`src/app/api/submit/route.ts`) branches three ways:
1. **`cf-…`** → `CodeforcesJudge` (`src/lib/judges/codeforces.ts`): logs into real Codeforces by scraping the CSRF token (fetch first, **Puppeteer + stealth plugin** as a Cloudflare fallback), submits via multipart form, then resolves the submission id from the CF API. Inserts a `PENDING` row.
2. **`cses-…`** → `CSESJudge` (`src/lib/judges/cses.ts`), same bot pattern. Inserts a `PENDING` row.
3. **Everything else** → **synchronous evaluation against the sample I/O via the Wandbox API** (`wandbox.org/api/compile.json`), diffing trimmed stdout to produce an immediate verdict (`COMPLETED`).

`GET /api/submissions/[id]` is the poller: for `cf-`/`cses-` problems it calls the judge's `getStatus`, maps the external verdict into our `Verdict` enum, and writes the result back. Once `status === 'COMPLETED'` it short-circuits.

`@/api/execute` is the separate "Run" (not submit) path — runs code against custom stdin through Wandbox, no DB writes.

Note the Puppeteer/cheerio/jsdom packages are listed in `serverExternalPackages` in `next.config.ts` so they aren't bundled.

### Verdicts
`src/types/verdict.ts` is the single source of truth: the `Verdict` enum, per-verdict UI metadata (labels/colors), and `mapRawVerdict()` for normalizing arbitrary judge strings. Use these instead of hardcoding verdict strings/colors.

### AI features (Google Gemini)
- `POST /api/ai/mentor` — a Socratic "AI mentor" (`gemini-2.5-flash`, low temperature) with a large Russian system prompt implementing Pólya's *How to Solve It* as a graduated hint ladder. It receives the problem, the student's code, and chat history.
- `POST /api/ai/recommend` — despite the `ai/` path this is **not** an LLM call. It uses the local **adaptive matching engine** in `src/lib/adaptive/matching.ts`: a weighted-distance "flow state" score between the user's 9 skill axes (`SkillAxes` in `src/types/database.ts`) and each problem's `requirements`, filtering out problems that are too easy/hard, excluding already-solved ones.

### Data model
Hand-maintained types in `src/types/database.ts` (keep in sync with `supabase/migrations/`). Core tables: `profiles` (skills JSON, settings, code template), `problems` (description, difficulty, `requirements`, sample I/O, `external_id`), `submissions` (verdict/status/timing), `roadmap_topics` + `topic_problems` (the learning roadmap), and `revealed_problems` (persists which spoiler-protected tags/difficulties a user has unlocked).

### Frontend structure
- `src/app/[locale]/dashboard/**` — the authed app: `problems/[id]` (the Monaco-based IDE, split panels via `react-resizable-panels`), `learning` (roadmap + articles), `graph-editor` (XYFlow/`@xyflow/react`), `whiteboard` (canvas), `random`, `progress`, `profile`.
- `src/components/learning/visualizers/**` — ~25 self-contained algorithm visualizers (sorting, Dijkstra, segment tree, etc.), one component each.
- `src/components/ui/**` — shared primitives; `src/components/shared/**` — navbar/footer/theme/language switcher.
- Markdown problem statements render through react-markdown + KaTeX; there is custom sanitization for Codeforces-style math delimiters and non-standard operators (e.g. U+2217).

### Theming
Dark mode is the default. A blocking inline script in `src/app/[locale]/layout.tsx` `<head>` reads `localStorage.theme` and sets the `dark`/`light` class before first paint to avoid flash; `ThemeProvider` manages it thereafter. Tailwind v4 (config-less, via `@tailwindcss/postcss`); design tokens live in `src/app/globals.css`.
