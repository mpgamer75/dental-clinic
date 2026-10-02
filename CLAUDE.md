# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bilingual (Spanish/English) marketing site + admin panel for a dental clinic ("Orthoprotesis Dental Clinic", Dr. Francis Valerio) in Santiago de los Caballeros, Dominican Republic. Next.js 16 App Router, React 19, TypeScript (strict), Neon Postgres + Neon Auth, Drizzle ORM, Tailwind 4 + shadcn/ui. Deployed on Vercel.

The site's commercial priority is **dental implants**. Spanish is the primary language; **the admin UI is Spanish-only**. Patients skew older and mostly arrive on phones; most of them would rather reach the clinic by **WhatsApp** (same number as the phone).

## Commands

```bash
npm run dev          # dev server on http://localhost:9003 (NOT 3000), host 0.0.0.0
npm run dev:turbo    # same, with Turbopack
npm run build        # next build
npm run start        # serve production build
npm run lint         # eslint (flat config) — expected: 0 errors, 0 warnings
npm run typecheck    # tsc --noEmit

npm run db:migrate   # apply migrations/*.sql in order (needs MIGRATION_DATABASE_URL — see below)
npm run db:seed      # idempotent re-seed of the carried-over rows
npm run db:demo:seed   # flagged, reversible demo rows so the admin charts have a shape
npm run db:demo:purge  # remove every row with is_demo = true
npm run db:generate  # drizzle-kit generate
npm run db:studio    # drizzle-kit studio

npm run admin:grant  -- <email> ["Full Name"]   # authorise an address for /admin
npm run admin:revoke -- <email>                 # revoke (sets disabled_at, never deletes)
npm run admin:list                              # who has access
```

- **No test framework is configured.** There are no tests and no test runner. Don't assume `npm test` exists.
- `node scripts/contrast.mjs` — verifies every design-token pair against WCAG AA in both themes, including `ink-faint` as **text** (4.5:1) on every ground and the translucent `text-drench-on/70–80` used on navy bands (alpha-composited). Run it after any palette change.
- `scripts/resolve-tokens.mjs` — expands `var()` chains and diffs two revisions of `globals.css` on computed values. Use it to prove a token refactor is a no-op.
- **Deploy order:** `migrations/0005_optional_appointment_email.sql` must be applied **before** deploying code that lets a patient leave email empty, or those bookings fail at insert.

## Pinned dependencies, and why

Two packages are deliberately NOT on their latest tag. Do not "upgrade" them without checking these first:

- **TypeScript is pinned to 6.x.** 7.0 is the native-port rewrite; `typescript-eslint` peers on `<6.1.0` and refuses to load under it, killing the linter entirely.
- **ESLint is pinned to 9.x.** `eslint-plugin-react` (bundled by `eslint-config-next`) supports only through ESLint 9.7 and calls `context.getFilename()`, which ESLint 10 removed — the linter crashes while loading a rule. (ESLint 9 also dropped the `unix`/`compact` formatters: use `--format json` to script over results.)

## Architecture

### Content is data, not markup
`src/lib/data.ts` is the single source of truth for **all** static bilingual content: services, FAQ, diplomas, every section's copy, the implant cluster's long-form articles, navigation, form labels, and Zod validation messages. Everything is keyed `{ es, en }`. **To change site copy, edit `data.ts`** — not the components. Strings contain `{{clinicName}}`, `{{doctorName}}`, `{{year}}` tokens replaced at render time.

- **House style for Spanish copy** (stated at the top of `data.ts`): **usted everywhere**, never tú; **sentence case** ("Enviar mensaje", not "Enviar Mensaje"). Hours are written one way: `Lunes a viernes, de 9:00 a. m. a 6:00 p. m.` with no-break spaces binding each time to its suffix.
- Turbopack tree-shakes `data.ts` **per export** (verified on a production build: the implant articles' prose is in no client chunk). Still, labels a server component can read should be read there and passed down as props.
- `clinicPhotos` is the photo registry (src, dimensions, alt in both languages). There are three photos, all of the storefront, so **each is placed once**: hero (portrait `door` on wide screens, landscape `front` on phones, one art-directed `<picture>` via `getImageProps`) and "Cómo llegar" (`approach`). A portrait of the doctor and a treatment-room photo are missing — see Open upgrades.
- `getHomeFaq(lang)` builds the homepage FAQ implant-first by **borrowing** three answers from the implant guide by `id` (no copied prose). Only items with `origin: 'home'` go into the homepage FAQPage JSON-LD; the borrowed ones are marked up on the guide pages they belong to.

### Contact links — never build `tel:` by hand
`clinicContact` (data.ts) holds the E.164 number and the WhatsApp number; `src/lib/contact.ts` exports `TEL_HREF`, `whatsappHref(lang)` and `contactLinkLabels(lang)`. Stripping the display number to digits produced `tel:8095817059`, which does not dial from outside the North American plan — the dental-tourism audience. The WhatsApp glyph is `@/components/icons/whatsapp` (lucide has no brand icons).

### Services have stable keys
Each service has a `key` (`implants`, `prosthetics`, …). The appointment form submits the **key**; the server resolves it with `serviceKeyOf()` (accepts keys, current titles in either language, and every historical spelling), refuses anything unresolvable, and **stores the canonical Spanish title** (`canonicalServiceTitle`). Admin readers fold stored values through `serviceLabelEs()`, so old rows ("Implantes Dentales", "Dental Implants") and new ones land in one bucket. `HISTORICAL_TITLES` in `src/lib/service-catalog.ts` is **append-only**: when a title changes, add the old spelling; rows with it still exist.

### Two root layouts — this is deliberate
`src/app/` has no `layout.tsx`. Instead there are two route groups, each with its own root layout:

- `src/app/(site)/[lang]/layout.tsx` — renders `<html lang={lang}>` for the public site
- `src/app/(admin)/layout.tsx` — renders `<html lang="es">` for the panel

The split exists to delete one line. A single root layout had to read the locale from an `x-lang` request header, and reading a Dynamic API in the ROOT layout opts **every route in the application** out of static generation. Taking `lang` from `params` instead requires being below the `[lang]` segment — hence two roots. **Do not reintroduce `headers()`, `cookies()` or any Dynamic API into a layout above a public page**; it silently makes the whole marketing site server-render on every request. Verify with `next build`: public routes must print `●`, not `ƒ`. (A **database read** is not a Dynamic API — the site layout reads `site_settings` and stays static.)

The [lang] layout DOES re-render when its own `lang` param changes on a client navigation, so server components inside it (the footer) follow the language toggle.

Unknown public URLs go through `src/app/(site)/[lang]/[...rest]/page.tsx`, which calls `notFound()` so they render the bilingual `[lang]/not-found.tsx` inside the site layout instead of Next's bare English 404. It is deliberately **not** given `generateStaticParams` (every probed path would become a cached 404).

### Internationalization (hand-rolled, no i18n library)
- URL-prefix based: `/es/...` and `/en/...`, default `es`. Routes live under `src/app/(site)/[lang]/`.
- `src/proxy.ts` — **Next 16 renamed `middleware.ts` to `proxy.ts`**, with a default export. It redirects `/` → `/es`, prefixes unprefixed public paths, sets security headers on every response *including redirects*, and guards `/admin`.
- `src/contexts/language-context.tsx` holds the active lang and rewrites the path on toggle. Server components read `lang` from `params`; client components use `useLanguage()`.

### The homepage is an argument, in this order
`src/app/(site)/[lang]/page.tsx`: hero (claim, one action, the place) → problem (why it matters) → implant explainer (the mechanism; the page's one authored motion moment) → doctor + diploma rail (who, and the documents under the claim) → testimonials (**only if at least one approved, non-demo testimonial exists**) → services (three specialties weighted above general dentistry) → FAQ (implant-first) → "Cómo llegar" (contact channels, one photo, click-to-load map, the general-questions form folded) → booking band (**last**, so the page ends on the reassurance, not on a form) → footer.

- Anchors the header/footer link to always exist: `#implantes`, `#el-doctor`, `#diplomas`, `#servicios`, `#preguntas-frecuentes`, `#contacto` (with a `#la-consulta` alias for old links), `#agendar`. `#testimonios` is the testimonials band, or the invitation row inside the doctor band when there is none.
- When nothing is approved, the page shows **no** testimonials band — never "Todavía no hay testimonios" or a load error to prospective patients. The loader retries transport errors and, during a runtime ISR regeneration, **throws** on final failure so Next keeps serving the last good page; at build time it returns empty.
- `implantEducation.parts` is in **assembly order** with stable keys (`fixture`, `abutment`, `crown`, `bone`); `ImplantStage` reports the phase via `onPhaseChange` and the legend row with the same index lights up. The 2D plate's callout numbers follow the same order.

### Database — Neon Postgres, server-only
`src/lib/db.ts` is the only database client. It imports `server-only`, so an accidental client import fails at build time rather than shipping a credential.

Schemas:
- `app` — `appointments`, `contact_messages`, `testimonials`, `site_settings`, `rate_limits`, `staff`
- `audit` — `audit_log`, append-only
- `neon_auth` — managed by Neon Auth. **Nothing in this repo writes to it and no foreign key points at it.**

`src/lib/schema.ts` is the **single** source of DB types. Migrations are numbered SQL files in `migrations/`, applied in order. `appointments.email` is **nullable** since 0005 (NULL = not given, never `''`).

**Two roles.** `DATABASE_URL` connects as `vd_app`: CRUD on `app.*`, INSERT+SELECT only on `audit.audit_log`, no DDL, no access to `neon_auth`. DDL needs `MIGRATION_DATABASE_URL` (the owner connection). `npm run db:migrate` warns and fails if it falls back — that is the grant working, not a bug.

**Demo rows** (`is_demo = true`, from `db:demo:seed`) are invented. They are badged in the panel, **cannot be approved** (refused server-side in `reviewTestimonial`), and the public testimonial query excludes them.

### Site settings — the admin switches are real
`app.site_settings` holds `maintenance_mode`, `allow_appointments`, `allow_contact_form`, `allow_testimonials`.

- `src/lib/site-settings.ts` → `getPublicSiteSettings()` is the **public** reader (React-`cache`d, **fails open**: if the row cannot be read the site behaves as if every switch is on — failing closed would take the booking form offline whenever Neon wakes slowly).
- The site layout renders `MaintenanceNotice` instead of page content in maintenance mode; `/agendar-cita` shows a "call or WhatsApp" panel when appointments are off; the homepage hides the contact panel / testimonial invitation when those are off.
- **Server actions enforce it** (`channelOpen` in `src/app/actions.ts`, right after the rate limit): a page rendered before the switch flipped still has a live form.
- The admin save action calls `revalidatePath('/[lang]', 'layout')` so every public page picks the change up on its next request.
- Do not read settings in public code through `@/app/(admin)/admin/_lib/queries` — those reads are staff-only.

### Auth vs. authorization — they are different questions
- **Authentication** is Neon Auth (Managed Better Auth). `auth.getSession()` answers *who are you*.
- **Authorization** is a row in `app.staff`. It answers *may you read the patient book*.

`readAdminSession()` in `src/app/(admin)/admin/_lib/session.ts` does both, and returns **four** states: `authenticated`, `anonymous`, `forbidden` (valid session, not staff), `unavailable` (the check itself failed). **A check that FAILED is not a check that DENIED** — conflating them signs the dentist out on a transient database blip. `readAdminSessionOnce` is the same check memoised per render.

Access is granted with `npm run admin:grant`. Accounts themselves are created in the Neon Console, because **`/api/auth/[...path]` allowlists exactly three paths and 404s everything else, `sign-up/*` included**. Those two halves hold each other up: matching staff by email is only safe while nobody can self-register a staff address. Do not relax one without revisiting the other.

### The admin panel
Live at `/admin`, under `src/app/(admin)/admin/`:
- `(panel)/layout.tsx` — the **front door**, not the data boundary. A server component that resolves the session before any admin markup is serialised (anonymous → redirect, non-staff → refusal). **A layout cannot keep data out of the response**: Next renders the page segment beneath it independently and serialises it into the RSC payload, and layouts do not re-run on client navigation.
- `_lib/queries.ts` — **the data boundary.** Every read goes through `runQuery`, which first asks `readAdminSessionOnce()` and returns nothing (or redirects, if anonymous) unless the caller is staff. Any new admin read MUST go through `runQuery`.
- `_actions/` — every mutation is a `'use server'` action that opens with `guardAdminMutation(formData)`: CSRF check, then an **independent** session lookup. A server action is a public endpoint; never trust the page that called it. Pass `guard.actor` to `recordAudit` (it avoids a second auth round trip).
- `_lib/patient-contact.ts` — normalises a patient's free-text phone into `tel:`/`wa.me` links (DR 10-digit numbers get `+1`).
- Login throttling counts **failed** sign-ins only, keyed on hashed IP + hashed email (the whole clinic shares one NAT address).

Every UPDATE and DELETE uses `.returning()` and treats zero affected rows as a failure. (The old panel toasted "Cita actualizada" on writes the database had refused.)

### Public forms → server actions → DB
`src/app/actions.ts` runs a fixed pipeline: **rate limit → site-settings check → validate → verify → moderate → sanitise → re-validate → parameterised insert with server-set status → audit**. Rate limiting comes first so a flood costs one indexed upsert rather than a full parse.

- `status` is **always** set server-side. It used to come from the client, which let anyone POST a self-approved testimonial onto the homepage.
- Testimonials **always** insert as `pending_approval`. There is no auto-approve path; `moderation_score` is a queue-priority hint.
- `src/lib/content-moderation.ts` is hardcoded and dependency-free (no AI). It normalises before matching — NFKD, homoglyph and leetspeak folding, spaced-letter rejoining.
- On the homepage, `ContactForm` and `AddTestimonialForm` are **lazy-loaded** with `next/dynamic` (prefetched on hover/focus of their trigger): their react-hook-form + zod stack was ~100 KB gzipped of initial JS for forms at the bottom of the page. Keep their named exports stable.

### Never log a raw error
Use `formatDatabaseFailure` from `src/lib/db-errors.ts`. Drizzle wraps Postgres errors and exposes the bound values as an own `params` key, so `console.error('...', error)` prints patient email, phone and reason for visiting. The describer reads only SQLSTATE, constraint, table and schema (`no sqlstate (…)` means a transport error, not a query error). Same discipline for IPs: hash them via `src/lib/request-context.ts` before they reach the database or a log.

### Security headers
`src/proxy.ts` sets CSP / HSTS / X-Frame-Options on every response, redirects included. The CSP's `connect-src` derives the auth origin **from the environment** — a hardcoded backend host is what went wrong last time, and a stale allow-listed host the clinic no longer controls is an exfiltration endpoint, not just clutter. `'unsafe-eval'` is added **in development only** (React's dev build needs it). `frame-src` allows Google only (the on-request map).

### Caching
- `/images/*` is NOT fingerprinted, so it is cached `max-age=86400, stale-while-revalidate=604800` — never `immutable` (a replaced photo stayed stale for a year). Next already serves `/_next/static` immutable; do not add a header for it (it triggers a build warning). `vercel.json` carries no header rules.
- Every `quality` used by an image must be listed in `images.qualities` in `next.config.mjs` (Next throws on an unlisted value).

### SEO and social cards
Implant-focused. `/[lang]/implantes-dentales` is a pillar page with five spokes under `[topic]`. Structured data is built in `src/lib/seo-config.ts` — including `hasCredential` from the nine real diplomas in `data.ts`. Per-language metadata comes from `generateMetadata`. Share cards come from `src/lib/og-card.tsx` (`renderOgCard`), one statically generated `opengraph-image.tsx` per page type (home, pillar, spokes, booking, privacy), each showing that page's own title. The sitemap emits `lastModified` only where the date is real (`IMPLANT_CONTENT_REVISED`).

## Conventions
- Path alias: `@/*` → `src/*`.
- **Colour is tokens only.** Never write a hex literal, `rgb()`, `hsl()`, or a stock Tailwind palette class (`text-blue-500`, `bg-slate-100`, `bg-black/80`). Use `bg-canvas`, `text-ink`, `bg-primary`, `text-brass`, `bg-drench`, `border-line`. The palette is OKLCH tokens in `src/app/globals.css`; Tailwind maps them semantically. Documented exceptions, each because CSS variables do not exist there: `src/app/global-error.tsx` (replaces the root layout), `src/lib/og-card.tsx` (rasterised by Satori), and the `themeColor` in the site layout's `viewport` (a `<meta>` tag). Each derives its values from the tokens and says so.
- **`ink-faint` is text-safe** (≥ 4.5:1 on canvas, sunk, surface and the tint band). Use `ink-soft` for secondary prose, `ink-faint` for the quietest metadata.
- **GPU cost is a review criterion.** Animate `transform` and `opacity` only — never width, height, top, left, box-shadow or filter. No `backdrop-filter` on an element that is always on screen. Read `prefers-reduced-motion` inside an effect (or via `useSyncExternalStore`), never during render. No infinite loops on a marketing page; any loop must stop when off screen.
- **Motion.** One authored moment: the implant figure assembling as it is scrolled. Everything else is quiet. `Reveal`/`RevealGroup`/`RevealItem` (`src/components/reveal.tsx`) are hookless and place the `.reveal` class — a **CSS view-timeline** animation in `globals.css`, with no JavaScript, no observers and no hydration cost; unsupported browsers and reduced motion simply show the content. Use them on section headings and short lists, not on every paragraph.
- **Disclosures are native `<details>`** (`.disclosure` styles in `globals.css`; exclusive accordions use `<details name>`). No height animation, no Radix accordion.
- **Images:** `priority` is deprecated in Next 16 — use `preload`, or `fetchPriority="high"` + `loading="eager"` for an image already in the HTML. Art direction is `getImageProps` + `<picture>`.
- **Dialogs:** `DialogContent` / `SheetContent` take `closeLabel` (default `'Cerrar'`); pass `'Close'` on English pages.
- Tailwind 4 is CSS-first; the JS config is opted back in via `@config` in `globals.css`.
- UI is shadcn/ui (`src/components/ui/`, Radix + CVA); icons are `lucide-react` (+ `src/components/icons/` for dental glyphs and WhatsApp). Theme is class-based dark mode, storage key `orthoprotesis-theme`, **one** ThemeProvider (there were two, with different keys, so the theme never survived a reload).
- Comments explain **why** a non-obvious choice was made and name the concrete failure it prevents. They are prose, not labels. Never write a comment that restates the code.

## Open upgrades (not done — need an asset, a decision, or a migration)
- **Photography:** a portrait of Dr. Valerio (belongs beside the doctor narrative) and a treatment-room photo (belongs in the hero). Every image on the site is of the storefront.
- **Claims to confirm with the clinic:** "Especialista en … ortodoncia" (no orthodontic specialist diploma among the nine on file) and "Compromiso con la última tecnología dental".
- **Clinic notifications:** `notifyClinicOfAppointment` only sends when `RESEND_API_KEY` and `CLINIC_NOTIFICATION_EMAIL` are set — check the Vercel environment, or urgent requests sit unseen until someone opens the panel.
- **CSP nonce** to drop `'unsafe-inline'` from `script-src`.
- **Fonts:** Newsreader's optical-size axis costs ~74 KB on every page; weigh it against TBT on mid-range phones.
- **`global-not-found`** (experimental in Next 16) would also cover unmatched URLs outside `[lang]` (e.g. `/admin/xyz`, paths with dots).
- **DB CHECK** `NOT (is_demo AND status = 'approved')` on testimonials (code already refuses it).
- **Privacy policy:** legal review under Ley 172-13, including the WhatsApp and Google Maps third parties.
- **Tests:** there are none. A Playwright smoke suite (home renders, booking form validates, 404, admin redirects) would catch most regressions this project has had.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
