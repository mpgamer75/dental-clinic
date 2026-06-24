# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bilingual (Spanish/English) marketing site + admin panel for a dental clinic ("Orthoprotesis Dental Clinic", Dr. Francis Valerio). Next.js 15 App Router, React 18, TypeScript (strict), Supabase (Postgres + Auth), Tailwind + shadcn/ui. Deployed on Vercel. Primary site language is Spanish; the admin UI is Spanish-only.

## Commands

```bash
npm run dev          # dev server on http://localhost:9003 (NOT 3000), host 0.0.0.0
npm run dev:turbo    # same, with Turbopack
npm run build        # next build
npm run start        # serve production build
npm run lint         # next lint (eslint-config-next)
npm run typecheck    # tsc --noEmit  — faster standalone check; `next build` also type-checks and lints, and fails on errors

# Admin bootstrap (need .env.local with SUPABASE_SERVICE_ROLE_KEY). See docs/ADMIN_SETUP.md.
npm run setup-admin <email>   # mark an existing auth user as admin (inserts into admin_users)
npm run quick-admin           # promote the first/only user found
npm run diagnose-admin        # inspect users + admin status
```

- **No test framework is configured** — there are no tests and no test runner. Don't assume `npm test` exists.
- **Broken/vestigial scripts:** `genkit:dev`, `genkit:watch` (point at `src/ai/dev.ts`, which does not exist) and `cleanup:test-data` (`scripts/cleanup-test-data.ts`, missing). These are leftover scaffolding — don't try to run them. The app uses no Genkit/AI runtime.

## Architecture

### Content is data, not markup
`src/lib/data.ts` is the single source of truth for **all** static bilingual content: services, FAQ, diplomas, seed testimonials, every section's copy, navigation, form labels, and Zod validation messages. Everything is keyed `{ es, en }`. **To change site copy, edit `data.ts`** — not the components. Strings contain `{{clinicName}}`, `{{doctorName}}`, `{{year}}` tokens that are replaced inline at render time via `.replace()` (search the page/section components). There is an `app_settings` DB table meant for editable settings, but the public site reads from `data.ts`, not from it.

### Internationalization (hand-rolled, no i18n library)
- URL-prefix based: `/es/...` and `/en/...`, default `es`. Routes live under `src/app/[lang]/`.
- `src/middleware.ts` redirects `/` → `/es` and prefixes any unprefixed public path. It **explicitly skips `/admin`, `/api`, and static paths.**
- `src/contexts/language-context.tsx` (`LanguageProvider` / `useLanguage`) holds the active lang and rewrites the path on toggle. Server components read `lang` from `params`; client components read it from `useLanguage()`.

### Supabase client layer — pick the right one for the context
Four distinct clients (all typed with `Database` from `src/lib/types_db.ts`):
- `src/lib/supabase.ts` → `supabase` (anon, module singleton). Used in **server actions** (`src/app/actions.ts`).
- `src/lib/supabase-client.ts` → `createClient()` (browser SSR client). Used in **client components** (e.g. the `/admin` page).
- `src/lib/supabase-server.ts` → `createServerClient()` (cookie-bound SSR client). Used in **server components / RSC** (e.g. the homepage, `/admin-dashboard`).
- `src/lib/supabase-admin.ts` → `createAdminClient()` (service-role key, **bypasses RLS**; verifies the caller is in `admin_users` before returning). For privileged server-side work only.

`src/lib/firebase.ts` is a dead stub — the project migrated off Firebase to Supabase. Ignore it.

### Two `Database` types exist — use `types_db.ts`
`src/lib/types_db.ts` is the **canonical** DB schema type (5 tables: `appointments`, `contact_messages`, `testimonials`, `admin_users`, `app_settings`). `src/lib/types.ts` *also* declares a `Database` interface but it is **stale** (only 3 tables) — that file's real job is app/content types (`Language`, `ContactDetails`, the `*Supabase` row shapes, etc.). Always import the DB generic from `types_db`.

### Data model & RLS (the security boundary)
Schema and policies live in `dump.sql` at the repo root. **`dump.sql` is a hand-maintained running log of SQL, not a migration tool** — apply changes manually in the Supabase SQL editor; there is no `supabase/` migrations dir. The live access model:
- **Anonymous (public) role:** may only `INSERT` into `appointments`, `contact_messages`, `testimonials`, and `SELECT` testimonials `WHERE status = 'approved'`. Nothing else is readable publicly.
- **Admin:** identified by a row in `public.admin_users` keyed by `auth.uid()`. Policies grant full CRUD via `EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())`.
- The older `auth.role() = 'admin_role'` JWT-metadata approach appears earlier in `dump.sql` but is **superseded** by the `admin_users` table approach. Note `dump.sql` contains a hardcoded admin UUID from initial setup.

### Auth & admin panel
- Auth is Supabase email/password. "Is this user an admin?" = "is there a matching row in `admin_users`?" — checked everywhere admin data is touched.
- **Live admin entry point is `/admin`** (`src/app/admin/page.tsx`): a single large client component that renders the login form when unauthenticated and the full dashboard (stats + appointments/messages/testimonials CRUD) when authenticated. Login success does `window.location.href = '/admin'`.
- `/admin-dashboard` (`src/app/admin-dashboard/page.tsx`) is a **separate, server-rendered variant** of the dashboard using `AdminDashboardClient` + a server-action sign-out. Both exist; `/admin` is the one wired into the login flow.
- **Watch out:** `adminNavItems` in `data.ts`, `docs/ADMIN_SETUP.md`, and `next.config.prod.mjs` reference routes like `/admin/login`, `/admin/appointments`, `/admin/settings`, `/admin/dashboard` that **do not exist as files**. They are aspirational/legacy.

### Public forms → server actions → DB
Flow for contact, appointment, and testimonial forms:
1. Client form component (`src/components/*-form.tsx`) uses react-hook-form + `zodResolver`, with a **per-language Zod schema built in the component**.
2. On submit it calls a server action in `src/app/actions.ts`, which **re-validates with its own per-language Zod schema** (validation is intentionally duplicated client + server), runs content moderation, sanitizes, then inserts via the anon `supabase` client (allowed by the INSERT RLS policy).
3. `src/lib/content-moderation.ts` is a **hardcoded** moderator (banned-word lists, regex spam patterns, caps/emoji ratios — no external AI). Testimonials auto-approve at moderation `score >= 85`, otherwise insert as `pending_approval`. Appropriateness thresholds: 60 for testimonials, 50 for contact messages.

### Security headers
`src/middleware.ts` sets CSP / HSTS / X-Frame-Options / etc. on every response. **The Supabase project URL is hardcoded in the CSP `connect-src`** (`wyospvndshfmkqvwkefn.supabase.co`) — if the Supabase project changes, update the CSP there. `next.config.mjs` (the active config) adds caching headers and image optimization. `next.config.prod.mjs` is an **unused** alternate config — editing it has no effect on builds.

### SEO
Homepage (`src/app/[lang]/page.tsx`) is a server component that composes the section components from `data.ts`, fetches approved testimonials from Supabase, and injects JSON-LD structured data built by `src/lib/seo-config.ts`. Per-language `<head>` metadata comes from `generateMetadata` in `src/app/[lang]/layout.tsx`.

## Conventions
- Path alias: `@/*` → `src/*`.
- UI is shadcn/ui (`src/components/ui/`, Radix + CVA) configured via `components.json`; icons are `lucide-react`. Theming uses CSS variables (`tailwind.config.ts`) with a custom `dental` color palette and animation keyframes; theme is class-based dark mode, storage key `orthoprotesis-theme`.
- Comments and some identifiers are a French/Spanish/English mix (originated from a French-speaking author); UI copy is Spanish/English only.
- `src/scripts/**` is excluded from typecheck (`tsconfig.json`).
