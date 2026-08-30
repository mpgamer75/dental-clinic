# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bilingual (Spanish/English) marketing site + admin panel for a dental clinic ("Orthoprotesis Dental Clinic", Dr. Francis Valerio) in Santiago de los Caballeros, Dominican Republic. Next.js 16 App Router, React 19, TypeScript (strict), Neon Postgres + Neon Auth, Drizzle ORM, Tailwind 4 + shadcn/ui. Deployed on Vercel.

The site's commercial priority is **dental implants**. Spanish is the primary language; **the admin UI is Spanish-only**.

## Commands

```bash
npm run dev          # dev server on http://localhost:9003 (NOT 3000), host 0.0.0.0
npm run dev:turbo    # same, with Turbopack
npm run build        # next build
npm run start        # serve production build
npm run lint         # eslint (flat config)
npm run typecheck    # tsc --noEmit

npm run db:migrate   # apply migrations/*.sql in order (needs MIGRATION_DATABASE_URL — see below)
npm run db:seed      # idempotent re-seed of the carried-over rows
npm run db:generate  # drizzle-kit generate
npm run db:studio    # drizzle-kit studio

npm run admin:grant  -- <email> ["Full Name"]   # authorise an address for /admin
npm run admin:revoke -- <email>                 # revoke (sets disabled_at, never deletes)
npm run admin:list                              # who has access
```

- **No test framework is configured.** There are no tests and no test runner. Don't assume `npm test` exists.
- `scripts/contrast.mjs` — verifies every design token pair against WCAG AA. Run it after any palette change.
- `scripts/resolve-tokens.mjs` — expands `var()` chains and diffs two revisions of `globals.css` on computed values. Use it to prove a token refactor is a no-op.

## Pinned dependencies, and why

Two packages are deliberately NOT on their latest tag. Do not "upgrade" them without checking these first:

- **TypeScript is pinned to 6.x.** 7.0 is the native-port rewrite; `typescript-eslint` peers on `<6.1.0` and refuses to load under it, killing the linter entirely.
- **ESLint is pinned to 9.x.** `eslint-plugin-react` (bundled by `eslint-config-next`) supports only through ESLint 9.7 and calls `context.getFilename()`, which ESLint 10 removed — the linter crashes while loading a rule.

## Architecture

### Content is data, not markup
`src/lib/data.ts` is the single source of truth for **all** static bilingual content: services, FAQ, diplomas, every section's copy, the implant cluster's long-form articles, navigation, form labels, and Zod validation messages. Everything is keyed `{ es, en }`. **To change site copy, edit `data.ts`** — not the components. Strings contain `{{clinicName}}`, `{{doctorName}}`, `{{year}}` tokens replaced at render time.

### Two root layouts — this is deliberate
`src/app/` has no `layout.tsx`. Instead there are two route groups, each with its own root layout:

- `src/app/(site)/[lang]/layout.tsx` — renders `<html lang={lang}>` for the public site
- `src/app/(admin)/layout.tsx` — renders `<html lang="es">` for the panel

The split exists to delete one line. A single root layout had to read the locale from an `x-lang` request header, and reading a Dynamic API in the ROOT layout opts **every route in the application** out of static generation. Taking `lang` from `params` instead requires being below the `[lang]` segment — hence two roots. **Do not reintroduce `headers()`, `cookies()` or any Dynamic API into a layout above a public page**; it silently makes the whole marketing site server-render on every request. Verify with `next build`: public routes must print `●`, not `ƒ`.

### Internationalization (hand-rolled, no i18n library)
- URL-prefix based: `/es/...` and `/en/...`, default `es`. Routes live under `src/app/(site)/[lang]/`.
- `src/proxy.ts` — **Next 16 renamed `middleware.ts` to `proxy.ts`**, with a default export. It redirects `/` → `/es`, prefixes unprefixed public paths, sets security headers on every response *including redirects*, and guards `/admin`.
- `src/contexts/language-context.tsx` holds the active lang and rewrites the path on toggle. Server components read `lang` from `params`; client components use `useLanguage()`.

### Database — Neon Postgres, server-only
`src/lib/db.ts` is the only database client. It imports `server-only`, so an accidental client import fails at build time rather than shipping a credential.

Schemas:
- `app` — `appointments`, `contact_messages`, `testimonials`, `site_settings`, `rate_limits`, `staff`
- `audit` — `audit_log`, append-only
- `neon_auth` — managed by Neon Auth. **Nothing in this repo writes to it and no foreign key points at it.**

`src/lib/schema.ts` is the **single** source of DB types (there used to be three competing `Database` declarations). Migrations are numbered SQL files in `migrations/`, applied in order.

**Two roles.** `DATABASE_URL` connects as `vd_app`: CRUD on `app.*`, INSERT+SELECT only on `audit.audit_log`, no DDL, no access to `neon_auth`. DDL needs `MIGRATION_DATABASE_URL` (the owner connection). `npm run db:migrate` warns and fails if it falls back — that is the grant working, not a bug.

### Auth vs. authorization — they are different questions
- **Authentication** is Neon Auth (Managed Better Auth). `auth.getSession()` answers *who are you*.
- **Authorization** is a row in `app.staff`. It answers *may you read the patient book*.

`readAdminSession()` in `src/app/(admin)/admin/_lib/session.ts` does both, and returns **four** states: `authenticated`, `anonymous`, `forbidden` (valid session, not staff), `unavailable` (the check itself failed). **A check that FAILED is not a check that DENIED** — conflating them signs the dentist out on a transient database blip.

Access is granted with `npm run admin:grant`. Accounts themselves are created in the Neon Console, because **`/api/auth/[...path]` allowlists exactly three paths and 404s everything else, `sign-up/*` included**. Those two halves hold each other up: matching staff by email is only safe while nobody can self-register a staff address. Do not relax one without revisiting the other.

### The admin panel
Live at `/admin`, under `src/app/(admin)/admin/`:
- `(panel)/layout.tsx` — the security boundary. A **server component** that resolves the session before any admin markup is serialised. `/admin/login` sits outside this route group so it is reachable without a session.
- `_actions/` — every mutation is a `'use server'` action that opens with `guardAdminMutation(formData)`: CSRF check, then an **independent** session lookup. A server action is a public endpoint; never trust the page that called it.
- `_lib/` — session, queries, list params, CSRF sealing, formatting.

Every UPDATE and DELETE uses `.returning()` and treats zero affected rows as a failure. (The old panel toasted "Cita actualizada" on writes the database had refused.)

### Public forms → server actions → DB
`src/app/actions.ts` runs a fixed pipeline: **rate limit → validate → verify → moderate → sanitise → re-validate → parameterised insert with server-set status → audit**. Rate limiting comes first so a flood costs one indexed upsert rather than a full parse.

- `status` is **always** set server-side. It used to come from the client, which let anyone POST a self-approved testimonial onto the homepage.
- Testimonials **always** insert as `pending_approval`. There is no auto-approve path; `moderation_score` is a queue-priority hint.
- `src/lib/content-moderation.ts` is hardcoded and dependency-free (no AI). It normalises before matching — NFKD, homoglyph and leetspeak folding, spaced-letter rejoining.

### Never log a raw error
Use `formatDatabaseFailure` from `src/lib/db-errors.ts`. Drizzle wraps Postgres errors and exposes the bound values as an own `params` key, so `console.error('...', error)` prints patient email, phone and reason for visiting. The describer reads only SQLSTATE, constraint, table and schema. Same discipline for IPs: hash them via `src/lib/request-context.ts` before they reach the database or a log.

### Security headers
`src/proxy.ts` sets CSP / HSTS / X-Frame-Options on every response, redirects included. The CSP's `connect-src` derives the auth origin **from the environment** — a hardcoded backend host is what went wrong last time, and a stale allow-listed host the clinic no longer controls is an exfiltration endpoint, not just clutter.

### SEO
Implant-focused. `/[lang]/implantes-dentales` is a pillar page with five spokes under `[topic]`. Structured data is built in `src/lib/seo-config.ts` — including `hasCredential` from the nine real diplomas in `data.ts`. Per-language metadata comes from `generateMetadata`.

## Conventions
- Path alias: `@/*` → `src/*`.
- **Colour is tokens only.** Never write a hex literal, `rgb()`, `hsl()`, or a stock Tailwind palette class (`text-blue-500`, `bg-slate-100`). Use `bg-canvas`, `text-ink`, `bg-primary`, `text-brass`, `bg-drench`, `border-line`. The palette is OKLCH tokens in `src/app/globals.css`; Tailwind maps them semantically. The one unavoidable exception is `src/app/global-error.tsx`, which replaces the root layout so `globals.css` never loads — its literals are documented in the file.
- **GPU cost is a review criterion.** Animate `transform` and `opacity` only — never width, height, top, left, box-shadow or filter. No `backdrop-filter` on an element that is always on screen. Read `prefers-reduced-motion` inside an effect, never during render.
- Tailwind 4 is CSS-first; the JS config is opted back in via `@config` in `globals.css`.
- UI is shadcn/ui (`src/components/ui/`, Radix + CVA); icons are `lucide-react`. Theme is class-based dark mode, storage key `orthoprotesis-theme`, **one** ThemeProvider (there were two, with different keys, so the theme never survived a reload).
- Comments explain **why** a non-obvious choice was made and name the concrete failure it prevents. They are prose, not labels. Never write a comment that restates the code.
