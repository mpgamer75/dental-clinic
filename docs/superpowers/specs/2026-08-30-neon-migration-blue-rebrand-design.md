# Neon migration, blue rebrand, admin hardening — design

Date: 2026-08-30
Status: approved (owner decisions recorded below)

## Goal

One push that: moves the app off Supabase onto Neon Postgres, upgrades the whole
dependency tree to latest stable, recolours the site to a premium clinical blue,
rebuilds the admin panel on a real server-side security boundary, and optimises
the WebGL implant scene — without losing speed or implant-focused SEO.

## Owner decisions

| # | Decision | Chosen |
|---|---|---|
| 1 | Auth replacement | **Neon Auth (Managed Better Auth)** |
| 2 | Neon layout | **One database, schemas `app` / `auth` / `audit`, Neon branches for dev** |
| 3 | Palette | **Deep clinical navy + cyan**, brass **retained** as the credential accent |
| 4 | Dependencies | **All upgraded to latest stable** (Next 16, React 19, Tailwind 4, Zod 4) |
| 5 | Scope | Stated asks **+ high-leverage adjacents + everything recon found** |
| 6 | PII backup | Gitignored and moved out of the repo — **done** |
| 7 | Testimonials | **Always queue for review**; moderation score becomes queue priority |
| 8 | Extras | Email alert on appointment · implant SEO cluster · drop `app_settings` · delete `/admin-dashboard` |

## Baseline (measured, not assumed)

- 190 issues found by reconnaissance: 8 critical, 38 high, 84 medium, 60 low.
- 11 files in `src/` import Supabase. Nothing else touches it.
- 114 `.ts/.tsx/.css` files in `src/`; **101 are colour-token-safe**. 120 hardcoded
  colour hits across 13 files, 70 of them in the 5 admin components being rewritten.
- Neon: PG 18.6, `public` empty, `neon_auth` schema already provisioned with the
  Better Auth table set. Auth endpoint verified live.

## The core architectural consequence

Supabase supplied four things; Neon supplies one.

| Supabase gave | Neon gives | Must be rebuilt |
|---|---|---|
| Postgres | Postgres | — |
| PostgREST (browser → DB over HTTP) | nothing | every read/write moves behind a server boundary |
| GoTrue (sessions, JWT, refresh) | nothing | auth → Neon Auth |
| RLS + `auth.uid()` (the only authz in the app) | RLS exists, `auth.uid()` does not | ~20 policies → explicit server-side checks |

`/admin` is currently a 1318-line **client** component that holds a database
credential and issues `update`/`delete` from the browser. A Neon connection string
can never reach a browser, so all 13 query sites collapse into server actions.

This deletes two critical vulnerabilities **by construction**:

- `WITH CHECK (true)` plus the public anon key let anyone POST a self-approved
  testimonial onto the homepage, bypassing Zod and moderation entirely.
- `status` was client-settable on all three tables.

Neither can exist once the client has no credential and `status` is server-controlled.

## Database design

One database, three schemas, least-privilege app role.

```
neondb
├── app     appointments, contact_messages, testimonials, site_settings
├── auth    (managed by Neon Auth: user, session, account, verification, jwks, …)
└── audit   audit_log  — append-only; no UPDATE, no DELETE granted
```

Roles:

- `neondb_owner` — migrations / DDL only.
- `vd_app` — CRUD on `app.*`, INSERT-only on `audit.audit_log`, no DDL, no
  access to `auth.*`. This is the role the application connects as.

Carried over from the Supabase dump, with fixes:

- `appointments`, `contact_messages`, `testimonials` keep their column shapes.
- **`CHECK` constraints on all three `status` columns.** They are unconstrained
  `text` today and the TypeScript unions are fiction.
- `app_settings` is **dropped**. ~22 bilingual columns, zero readers; `data.ts` is
  the real content source. Replaced by a small `site_settings` table holding only
  `maintenance_mode` and the three `allow_*` flags, wired to the admin panel.
- New: `rate_limits` (IP-hash counter, shared by public forms and login throttling).
- New: `audit.audit_log` — every admin mutation, append-only.

Seed data migrated: 2 appointments, 0 messages, 1 pending testimonial. The admin
identity is re-established through Neon Auth; the old bcrypt hash is not reused.

Migrations become real numbered SQL files under `migrations/`, applied by a runner
script. `dump.sql` and `supabase/migrations/manual/` are retired — they disagree
with each other and with the live DB.

## Auth design

Neon Auth (Managed Better Auth) via `@neondatabase/auth`, which requires Next 16 or
later — supplied by the dependency upgrade.

- `src/lib/auth/server.ts` — `createNeonAuth({ baseUrl, cookies: { secret } })`
- `src/lib/auth/client.ts` — `createAuthClient()`
- `src/app/api/auth/[...path]/route.ts` — `auth.handler()`
- `proxy.ts` (Next 16's renamed middleware) — `auth.middleware({ loginUrl })`
- **`src/app/admin/layout.tsx`** — server component gate that redirects *before any
  admin chrome is serialised*. This is the fix for the missing server-side guard.
- Every admin mutation is a `'use server'` action that **re-verifies the session
  itself**. Never trust the page.

Neon Auth handles identity, sessions and revocation. It does **not** handle the
following, which we own on top of it:

- **CSRF** — double-submit token on every admin mutation.
- **Rate limiting** — login throttling (5 per 15 min per IP-hash) and public-form
  limits, on the shared `rate_limits` table.
- **Audit logging** — who changed what, when.

Environment: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`.
`DATABASE_URL` must never gain a `NEXT_PUBLIC_` prefix.

## Security work (OWASP Top 10 2021)

| Cat | Issue | Fix |
|---|---|---|
| A01 | `/admin` explicitly skipped by middleware; gate is client React state | server-component gate, proxy check, per-action re-verify |
| A01 | client-settable `status` on 3 tables | server-controlled; CHECK constraints |
| A02 | service-role key live in `.env`; 4 dead keys | rotate, remove |
| A03 | injection | parameterised queries only via Drizzle; no string-built SQL |
| A03 | stored XSS via testimonial text | server-side sanitisation, escaped rendering, no `dangerouslySetInnerHTML` on user text |
| A04 | **no rate limiting anywhere** on the clinic's only intake channel | `rate_limits` table plus honeypot |
| A04 | no CSRF token on admin mutations | double-submit token |
| A05 | CSP carries `unsafe-eval` and a hardcoded Supabase host; redirects ship with no HSTS | tighten CSP, apply headers to redirect responses, `X-XSS-Protection: 0` |
| A07 | login uses `.single()` and discards the error — a transient DB failure signs the admin out | handled by Neon Auth plus explicit error paths |
| A09 | `console.log` of full appointment rows including patient email, phone and reason | remove; structured audit log instead |
| — | an RLS-denied UPDATE returns 0 rows and no error, and the UI toasts success | check affected-row count on every mutation |

Regex and validation: Zod 4 schemas with real bounds (max lengths, email, phone),
shared between client and server rather than duplicated. The content moderator is
hardened — accent and leetspeak folding, spaced-letter normalisation, the
`location` field actually checked, control-character rejection — and its score
becomes a queue priority rather than an auto-publish trigger.

## Design system and recolour

Palette (OKLCH, drops into the existing token pipeline):

```
primary        oklch(0.42 0.13 253)   deep navy
primary-hover  oklch(0.36 0.14 253)
accent         oklch(0.68 0.13 218)   cyan
canvas         oklch(0.985 0.006 250)
ink            oklch(0.22 0.03 255)
drench         oklch(0.24 0.07 253)
brass          retained, ramp re-tuned and contrast re-verified on navy
```

Sequence matters — this order is not optional:

1. **De-duplicate 12 tokens** that hardcode `38.7` / `67.5` literals instead of
   aliasing (`--sidebar-*`, `--chart-1/2/3/5`, six dark `*-foreground` copies).
   Pure no-op diff. Skip it and the sidebar and every chart stay terracotta.
2. Change the hue.
3. **`--shadow-color` is HSL, not OKLCH** (`28 40% 22%` / `24 50% 3%`) and feeds
   all five elevation levels. Invisible to an OKLCH grep. Miss it and every shadow
   casts warm brown over cool surfaces.
4. Codemod the Tailwind keys: `terracotta` to `primary`, in the **same commit** as
   the hue change, or `bg-terracotta` ships blue.
5. Hand-edit the structurally untokenisable files: `global-error.tsx` (replaces the
   root layout, so `globals.css` never loads) and `[lang]/opengraph-image.tsx`
   (edge runtime via `next/og`).
6. **`implant-scene.tsx` is a design decision, not find and replace.** The materials
   are correct; the *lighting rig* is warm — brass key `0xfff0d8`, warm floor
   bounce `0xd8a86a`, ambient `0xfff2e2` — chosen to match a terracotta room. It
   will leave the hero object visibly warm inside a cool page. `resolveToken`'s
   fallback `0xe8ddcd` also silently restores the old brand on any failure.

Tailwind 4 moves configuration into CSS (`@theme`). Since the token layer is being
rewritten anyway, this lands in the same pass rather than as a separate migration.

## Admin panel rebuild

Rebuilt on the new server-action surface, **before** the recolour — which makes 58%
of the recolour's hand-edit burden evaporate.

- Server-component gate; login through Neon Auth's UI, themed to the new palette.
- Real pagination, search, filter and sort. Today there is a hard `.limit(10)`
  ordered by date only, under a stat card reading "de 45 totales" — **11 routine
  submissions bury an urgent dental emergency.** Urgent-first ordering.
- Genuine loading, empty and error states; confirmation on destructive actions;
  optimistic updates that reconcile against the affected-row count.
- Accessibility: labelled controls, visible focus, status conveyed by more than
  colour, keyboard-navigable tables.
- GPU-efficient: transform and opacity only, no persistent `backdrop-filter` on
  always-on-screen surfaces, no layout-animating properties.
- `/admin-dashboard` deleted; its `getUser()` gate pattern is kept as the shape of
  the new gate.

## 3D implant scene

1. **Gate construction, not just rendering, on the viewport** — IntersectionObserver
   with `rootMargin: 400px`. Removes a ~150 KB chunk, a measured 70 ms geometry
   build, a PMREM bake and ~12 shader links from the hydration critical path of a
   below-the-fold section. About 6 lines; also an LCP fix.
2. **Drop `transmission: 0.34` on the crown.** It forces a full-viewport HalfFloat
   4×MSAA render target (~39 MB VRAM), a second pass over all opaque geometry, an
   MSAA resolve and a half-float mipmap chain every frame. The crown already has
   clearcoat 1, sheen, an env map and baked vertex colours.
3. **Make idle actually free.** The dirty-gate is well built and provably never
   fires because `driftGain` never reaches 0. Resting cost goes from 278,830
   triangles per frame at 60 fps to zero — which is where the user spends this section.
4. `renderer.shadowMap.autoUpdate = false`, updating only when the assembly moves.
   Every resting frame currently re-renders a bit-identical 87,354-triangle depth pass.
5. Build-cost batch: bone `steps: 40 → 14` (36,366 non-indexed vertices / 1.1 MB for
   a constant cross-section), preallocate `Uint16Array` index buffers instead of
   ~284,000 boxed pushes, delete the unused `compileEquirectangularShader()`, and
   `compileAsync()` before the loop starts.

Correctness, same pass: fix the seam normals in `geometry.ts:122` — coincident
vertices with one-sided normals produce a measured 7.7° median / 29° peak
discontinuity along a `metalness: 1` fixture, which is exactly the bright hairline
the code comment claims to prevent. Add `clipShadows` to the bone and gum materials,
or the cut-away half casts a shadow from nothing.

No GPU leak exists — teardown is clean and scroll drives a ref, not state. The
problems are scheduling, not wiring.

## SEO and performance

1. **Remove `headers()` from `src/app/layout.tsx:59`** — it opts all 6 routes out of
   static generation. Route groups `(site)` and `(admin)` get `lang` from `params`
   with no dynamic API. Then drop `force-dynamic` from the homepage; the Neon
   migration makes the testimonial read cookie-free by construction.
2. **Implant cluster as real routes** — `/[lang]/implantes-dentales` pillar plus
   spokes (`all-on-4`, `carga-inmediata`, `injerto-oseo`, `precio`,
   `turismo-dental-santiago`). Every one of those terms is already in the keywords
   array with **zero supporting copy**. Repoint the nav off the `#implantes`
   fragment and add them to the sitemap.
3. **Fix the on-page and metadata mismatch** — the `<h1>` carries neither the service
   nor the city while the title tag targets both. Delete "resultados garantizados"
   and "Consulta gratis": neither appears anywhere in the site copy, and an
   unsubstantiated guarantee on a health site is a compliance exposure.
4. **Repair structured data** — `hasOfferCatalog.itemOffered: MedicalProcedure` is
   out of range and produces nothing; use `availableService`. Populate `sameAs` with
   the Google Business Profile. Add `hasCredential` from the nine real diplomas
   already in `data.ts` — textbook E-E-A-T currently invisible to parsers. Add
   `medicalSpecialty`, `availableLanguage: ['es','en']` (a direct dental-tourism
   signal), `hasMap`, and real breadcrumbs.
5. **Core Web Vitals batch** — drop `latin-ext` and italic (537 KB down to ~180 KB of
   preloaded fonts competing with the LCP hero), click-to-load facade for the Maps
   embed, `minimumCacheTTL` 60 → 31536000, generic `es` / `en` hreflang beside the
   region-locked pair. Also `/admin` is linked from the public footer **and**
   `Disallow`ed in robots.txt with no `noindex` — the exact recipe for a URL-only
   index entry.

## Notifications

There is currently **no notification path at all**. An urgent appointment reaches
the clinic only when someone opens `/admin`. A Resend call inside the existing
appointment server action closes this; it needs a free Resend API key. Until that
key exists the code path is written, feature-flagged off, and reported as pending.

## Sequencing

1. ~~Hour zero: PII backup out of the repo, gitignore rules~~ — **done**.
2. Dependency upgrade to latest stable; get a green build before touching features.
3. No-op token de-duplication in `globals.css`; verify the visual diff is empty.
4. Neon schema, migrations and auth — the foundation everything sits on.
5. Rewrite the 4 data-access files into server actions; delete the 9 dead files.
6. Rebuild the admin UI on the new surface.
7. Recolour: hue, then `--shadow-color`, then the Tailwind codemod, then hand-edits.
8. 3D optimisation; SEO and performance batch; implant cluster routes.
9. Verify: typecheck, lint, production build, and a browser pass over every route.

Steps 4–5 and 6–7 are the only hard ordering constraints. Everything else parallelises.

## Out of scope

Anything not implied by the above: no new patient-facing features, no CMS, no
payment flow, no test framework introduction (none is configured today).
