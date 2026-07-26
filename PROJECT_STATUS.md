# Project status — Orthoprotesis Dental Clinic

**Site:** bilingual (es-DO default / en) marketing site + admin panel for Dr. Francis Valerio, Plaza Las Ramblas, Santiago de los Caballeros, DR.
**Stack:** Next.js 15.5.9 (App Router) · React 18.3 · TypeScript strict · Tailwind 3.4 + shadcn/ui · Supabase · three.js · Vercel
**Last updated:** 2026-07-26

This is the single source of truth for what the project is, what was just done, and
what is still outstanding. It supersedes `FINAL_REPORT.md` and `OVERHAUL_PLAN.md`
(the June 2026 "Refined Medical" pass) — both are removed; their content remains in
git history at commit `ae6cb59`. Several of their conclusions no longer hold, most
notably "SVG, not WebGL", which this pass deliberately reversed.

**Current state:** `tsc --noEmit` clean · `next lint` clean · production build green ·
all browser verification passing (evidence in §5). **Two blocking items in §3 must be
done before this is fully functional in production.**

---

## 1. What this pass changed

### 1.1 Visual identity — "Warm Consulta"

The previous look was medical-blue shadcn: competent, and indistinguishable from a
template. The palette is now taken from the clinic's own room (see
`public/images/vitrine_clinique*.jpg`) — warm plaster, brass fittings, mahogany rail —
with terracotta carrying the brand and the logo's petrol blue demoted to a supporting
/ informational role.

| Role | Token | Light | Dark |
|---|---|---|---|
| Canvas | `--canvas` | `#F1ECE8` warm plaster | `#19120F` |
| Primary | `--primary-base` | `#9C4A2F` terracotta | `#DC7B5C` |
| Drenched band | `--drench` | `#692A15` | `#5C220E` |
| Accent | `--brass` | `#C08A4E` | `#E8AE6F` |
| Supporting | `--petrol` | `#216188` (the logo) | `#5FA3D2` |

Implementation notes that matter if you touch this:

- **Colour space is OKLCH**, not HSL. HSL shifts perceived lightness badly across the
  30–80 hue band, which is exactly where this palette lives. Tokens hold bare `L C H`
  triples; `tailwind.config.ts` wraps them as `oklch(var(--token) / <alpha-value>)`,
  so every opacity utility (`bg-primary/10`) still works.
- **`--on-brass` exists for a reason.** Brass is mid-light in light mode and lighter
  still in dark mode. Using `--ink` on a brass fill gives 1.73:1 in dark mode, because
  ink is near-white there. Any brass background must use `text-brass-on`.
- **`--ink-faint` is rated for large text only (3:1).** Do not use it below 18px.
- Every foreground/background pair is verified ≥ WCAG AA in **both** themes, first
  numerically and then against real rendered pixels. Do not hand-tune one channel
  without re-checking its pairings.

**Type:** Piazzolla (Huerta Tipográfica, Buenos Aires) for headings — a bookish
humanist serif whose Spanish diacritics and `¿ ¡` are drawn rather than bolted on —
paired with Archivo (Omnibus-Type, Buenos Aires) for UI, body, forms and data. Paired
on the serif↔grotesk contrast axis rather than two near-identical sans faces.

**Removed:** the dead `dental-*` Tailwind palette, the unused `.text-gradient`
utility, the global `section { @apply py-12 … }` rule (it double-padded nested
sections and made every band identical), and the reflexive uppercase "eyebrow" that
sat above all six homepage sections.

### 1.2 Homepage rebuilt as an argument

Order is now: **claim → problem → mechanism → services → proof → doctor → credentials
→ the room → objections → book → contact.** Sections live in
`src/components/sections/`; new copy is in `homeContent` in `src/lib/data.ts`, fully
bilingual like everything else.

New: `hero.tsx`, `problem.tsx`, `doctor.tsx`, `booking.tsx`, plus
`primitives/section.tsx` (owns surface tone, rhythm and measure) and
`layout/mobile-action-bar.tsx`.

### 1.3 The 3D implant scene

`src/components/implant/` — a scroll-driven WebGL assembly: the implant hovers above
the jaw, threads down into it, then the bone turns translucent to reveal
osseointegration. Geometry, materials and the environment map are **all procedural** —
no `.glb`, no texture, no HDR — so nothing can reach for a CDN the CSP would block.

**Read `implant-scene.tsx`'s header comment before changing this.** It is written in
vanilla three.js, not react-three-fiber, and that is deliberate: R3F drives three.js
through `react-reconciler`, which is pinned to a specific React internals shape. Next
15 serves React 19 internals to client components while R3F v8's reconciler reads
React 18's, so the canvas threw `Cannot read properties of undefined (reading
'ReactCurrentBatchConfig')` and took the whole route down. R3F v9 requires React 19,
which in turn forces `react-day-picker` v8 → v9 — a breaking rewrite of the
appointment calendar. The booking flow is not worth trading for a hero graphic.

**It is gated, not assumed.** `implant-stage.tsx` serves the SVG cross-section
(`implant-diagram.tsx`) and only upgrades to WebGL when the client passes every check:
not reduced-motion, ≥1024px, no `saveData`, not 2G/3G, `deviceMemory` ≥ 4, real WebGL,
and not a software rasteriser. The server always renders the SVG, which is what makes
the swap hydration-safe and keeps the section meaningful with no JS. Net cost to the
homepage: **225 kB → 229 kB** first-load JS, because three.js stays in a lazy chunk
phones never fetch.

### 1.4 Icons

`src/components/icons/dental.tsx` — a purpose-drawn set for implants, crowns,
dentures, braces, scaling, whitening, fillings, endodontics and examination. Lucide
has no vocabulary for these; the previous build used `Users`, `Activity` and `Scan`,
which mean nothing to a patient. Drawn to Lucide's grammar (24px grid, 1.5 stroke,
round caps, `currentColor`) so the two sets sit together. Legacy `iconName` values in
`data.ts` still resolve via the `DENTAL_ICONS` map.

---

## 2. Bugs fixed

An exhaustive audit (14 agents, adversarial verification) produced **51 candidates;
41 confirmed, 10 rejected.** All code-side findings are fixed.

### Critical

| # | Bug | Impact |
|---|---|---|
| 1 | `Reveal` emitted `opacity:0` in SSR HTML and never cleared it on hydration (`useReducedMotion()` returns `null` on the server, `true` on a reduced-motion client's first render; React 18 does not strip extra DOM attributes) | **The entire homepage rendered blank** for anyone with OS "Reduce motion" enabled |
| 2 | `next.config.mjs` applied `public, max-age=3600, stale-while-revalidate=86400` to `/:path*`, overriding Next's `no-store` on admin routes | **Patient names, emails, phones and appointment reasons cached to disk for an hour.** Sign out on the clinic laptop, press Back, full patient list |
| 3 | Appointment form sends `isUrgent`; server schema reads `is_urgent` and `.default(false)` filled the gap silently | **Every urgent request stored as non-urgent.** Patient saw the toggle turn red and got a success toast; the clinic never saw a single one |
| 4 | Middleware skipped any path containing a dot, so it fell through to `[lang]` and indexed a content dictionary with e.g. `"foo.bar"` | `/apple-touch-icon.png`, `/.env` and every bot probe returned **HTTP 500**, not 404 |
| 5 | RLS policy on `admin_users` queried `admin_users` | Postgres `42P17` infinite recursion — **the whole admin panel unreachable** (§3.2) |
| 6 | `/admin-dashboard` wrote cookies during Server Component render | Uncaught 500 instead of the intended redirect |
| 7 | Anonymous RLS `WITH CHECK (true)` with a client-supplied `status` column | Anyone with the public anon key can POST `status:"approved"` and **self-publish to the homepage**, bypassing moderation entirely (§3.2) |

### High / medium

- **Moderation was bypassable every other request.** `SUSPICIOUS_PATTERNS` and
  `MEDICAL_SPAM` were module-level `/g` regexes used with `.test()`, which advances
  `lastIndex` and persists across requests in a long-lived server. The second
  identical spam submission scored a clean 100 and auto-published.
- **`sanitizeText` manufactured markup.** It stripped tags and *then* decoded HTML
  entities, so `&lt;img src=x onerror=alert(1)&gt;` came out as live markup that was
  written to the database. Now decodes once, then strips — and deliberately does not
  re-encode, which would double-escape through React and show `&amp;` to patients.
- The Google Maps embed had a full-cover `<a>` over it: **the map could not be panned
  or zoomed at all**, and any click bounced the visitor to Google Maps.
- "Top 5 Servicios" chart rendered **zero bars** (`layout="horizontal"` with a category
  Y-axis is contradictory in recharts).
- `/admin` discarded the `error` from all nine dashboard queries — supabase-js resolves
  rather than throws, so the surrounding `try/catch` never fired and **an unreachable
  database rendered a healthy-looking dashboard of zeros**.
- Any error on the `admin_users` lookup was treated as "not an admin" and
  **force-signed-out a legitimate admin**.
- 7-day chart bucketed by UTC date then labelled in local time — **every weekday label
  off by one** in Santiago (UTC−4), and evening appointments counted on the wrong day.
- JSON-LD used `next/script` with an inline body, which the App Router rewrites into a
  `self.__next_s` bootstrap array — **no structured data in the served HTML at all**.
- Three Spanish diploma descriptions were **in French**.
- Nine certificate scans existed in `/public/images` and were **never rendered**.
- `global-error.tsx` was styled entirely in Tailwind classes; it replaces the root
  layout, so `globals.css` never loads and the one page shown when the site has already
  failed rendered unstyled. Now fully inline-styled.
- Contact form client schema accepted phone values the server rejected (round-trip
  failure with no field highlighted); server validation messages were hardcoded Spanish
  and shown to English users.
- `<html lang>` stayed `es` after the in-app language toggle (App Router layouts persist
  across navigation).
- Language toggle and locale redirect both dropped the query string — **every UTM /
  gclid parameter destroyed**.
- Sub-pages inherited the homepage's OpenGraph block, so sharing the booking link
  showed the homepage's title and URL.
- Back-to-top stayed focusable while invisible; scroll-progress rendered underneath the
  navbar and was never visible; theme toggle had English-only accessible names on a
  Spanish-default site.
- `sitemap.xml` listed 12 fragment URLs that collapse to 2 documents (duplicate-URL
  signal) and omitted the real `/privacidad` routes.
- `autoprefixer` was absent from the PostCSS chain entirely.
- `public/test-images.html` and `test-images.js` were deployed and crawlable.
- `src/scripts/setup-admin.ts` re-created the recursive RLS policy on every fresh setup.

---

## 3. Outstanding — blocking

**These two must be done for the site to work correctly in production.**

### 3.1 `.env.local` service-role key is truncated

`SUPABASE_SERVICE_ROLE_KEY` in `.env.local` shares an identical header and payload with
the copy in `.env`, but its **signature is 42 characters where HS256 requires 43** — it
is truncated by one character, so the JWT fails verification. `.env.local` takes
precedence over `.env` in Next, so the broken key wins.

Everything using `createAdminClient()` fails: `npm run setup-admin`,
`npm run quick-admin`, `npm run diagnose-admin`, and any privileged server-side work.

**Fix:** copy the `SUPABASE_SERVICE_ROLE_KEY` value from `.env` into `.env.local`, or
re-copy it from Supabase → Project Settings → API. Verify with `npm run diagnose-admin`.

*(Not done automatically: editing a secrets file is yours to make, and the correct
value should come from Supabase rather than be inferred.)*

### 3.2 Apply the database migration

`supabase/migrations/manual/2026-07-26_fix_rls_recursion_and_status_escalation.sql`

Paste it into the Supabase SQL editor. It fixes criticals **#5** and **#7** — the
recursion that makes the admin panel unreachable, and the escalation that lets anyone
publish to the homepage. Verification queries are at the bottom of the file; all three
should come back clean.

One decision it forces: the server action currently auto-approves testimonials scoring
≥ 85, using the anon client, which can no longer write `status='approved'`. Either
accept that everything starts as `pending_approval` (recommended — a human should see
a testimonial before it goes public) or move that write to the service-role client in
`src/lib/supabase-admin.ts`. Nothing breaks either way; testimonials simply wait for
approval until you choose.

### 3.3 Carried forward from the previous pass (still open)

- **Set `NEXT_PUBLIC_SITE_URL` in Vercel** (Production scope) to
  `https://drfrancisvaleriop.com` — no trailing slash, no `/es`. Remove any
  `http://localhost:3000` value from Production/Preview.
- *(Optional)* Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` for Search Console.
- **Review the advertising claims** in `src/lib/seo-config.ts` with someone familiar
  with DR health-advertising rules (Ley 172-13). See §4.2 — the metadata still promises
  *"resultados garantizados"* and *"consulta gratis"* that the site does not back up.

---

## 4. Outstanding — roadmap

Ranked impact/effort, from the audit. Nothing here is required for the site to work.

### 4.1 Patient side

| Impact | Item | Where |
|---|---|---|
| high | **WhatsApp as a first-class channel** — absent from the entire codebase, and it is how the DR actually books | `data.ts` `contactDetails`, contact/booking sections |
| high | **Post-submission panel** — what to bring, where to park, what happens next | `form-feedback.tsx`, `appointment-form.tsx` |
| high | **Per-service landing pages** — the site is 2 indexable URLs competing for 27 keywords | new `[lang]/servicios/[slug]/` |
| med | **Preferred date + time window on the booking form** (needs 2 new columns) | `appointment-form.tsx`, `actions.ts`, schema |
| med | **Reason chips** instead of a free-text-only "Motivo de la Cita" wall | `appointment-form.tsx` |
| med | **Real-time escape hatch when "urgent" is toggled** — show phone/WhatsApp immediately | `appointment-form.tsx` |
| med | **Publish cost expectations**, and drop the unsupported guarantees (§4.2) | `seo-config.ts`, FAQ |
| med | **Google Business Profile + socials** wired into `sameAs` structured data | `data.ts`, `seo-config.ts` |
| med | **Conversion instrumentation** — currently zero measurement; CSP already allows Vercel Analytics | `app/layout.tsx` |

*(Done this pass: persistent mobile call/book bar — there was previously **no visible
booking button on a phone**, the header CTA being `hidden sm:inline-flex`.)*

### 4.2 Notification, and the claims problem

**Nothing notifies the clinic when a request arrives.** Submissions land silently in
Postgres and are only seen if someone opens the panel. This is the single largest
functional gap on the patient side — an urgent request can sit unread indefinitely.
Add a `src/lib/notify.ts` called from `actions.ts` after each successful insert.

Separately: `seo-config.ts` advertises *"resultados garantizados"* and *"consulta
gratis"* in the meta description, OpenGraph and Twitter cards. The site itself makes no
such offer, and guaranteed-outcome language in dental advertising is exactly what
Ley 172-13 scrutinises. Recommend removing both phrases.

### 4.3 Admin side

| Impact | Item |
|---|---|
| high | **Tap-to-call / WhatsApp / email** — patient contact details are currently inert text |
| high | **Auto-refresh** — a panel left open on the front desk is frozen at page-load time forever (Supabase realtime channel) |
| high | **Sort urgent first** — a 3-day-old urgent request currently sorts below 9 routine ones and falls off the 10-row list |
| high | **Read the full testimonial before approving it** — currently approvable to the public homepage while truncated |
| high | **Mobile layout** — ~1000px of charts sit between the header and the first actionable appointment; lists are trapped in fixed 550px inner scrollers |
| high | **Pagination / filter / search** — all three lists hard-capped at 10 rows, items 11+ unreachable |
| high | **Undo, and name what you are deleting** — deletion is permanent and the confirmation does not say whose record it is |
| high | **Password reset** — the sole non-technical admin is one forgotten password from being locked out |
| high | **Consolidate the two dashboards** — `/admin` (client) and `/admin-dashboard` (server) have already drifted; the cookie-write bug (#6) existed only in the copy. Keep `/admin`, adopt the server-side auth gate as `admin/layout.tsx`, delete the duplicate |
| high | **`scheduled_at` column** — the panel can confirm a request but can never record *when the patient is actually coming* |
| med | Opening a message should mark it read (the unread counter drifts) |
| med | "New since you last looked" markers |
| med | CSV export (BOM-prefixed so Excel renders `ñ` correctly) |

### 4.4 Known-vestigial (safe to delete, not touched)

`genkit:dev` / `genkit:watch` / `cleanup:test-data` npm scripts (point at files that do
not exist) · `src/lib/firebase.ts` (migrated off Firebase) · `next.config.prod.mjs`
(unused; editing it has no effect) · `adminNavItems` routes in `data.ts` that have no
corresponding files · the stale 3-table `Database` interface in `src/lib/types.ts`
(canonical one is `types_db.ts`).

---

## 5. What was verified, and how

Against a **production build** (`next build` + `next start`), in real Chromium:

| Check | Result |
|---|---|
| Reduced-motion homepage | 222 text elements, **0 invisible** (was: entire page blank) |
| Scroll reveal still works | 173 staged → **0 hidden** after scrolling, desktop and mobile |
| No-JS | hero, problem, implant legend, doctor, booking, FAQ all present in server HTML |
| Horizontal overflow @ 320px | `scrollWidth 320 = viewport 320` |
| Contrast, light mode | **0 failures** (canvas-resolved, composited through translucent layers) |
| Contrast, dark mode | **0 failures** |
| Dot-path routing | `/apple-touch-icon.png`, `/.env`, `/wp-login.php` → **404** (was 500) |
| Unknown locale | `/xx`, `/fr/agendar-cita` → **404** |
| `Cache-Control` on `/admin` | `private, no-cache, no-store` (was `public, max-age=3600`) |
| three.js isolation | **not present in any shared/initial chunk** |
| Moderation | stable across repeated calls; spam rejected, legitimate testimonial accepted |
| WebGL scene | mounts, renders, **zero console errors**; full assembly sequence confirmed |
| `tsc --noEmit` / `next lint` / `next build` | clean |

The Playwright harness used for this was intentionally **not** committed — the project
has no test runner and adding one was out of scope. Re-create it if you want it in CI.

---

## 6. Deliberately not done

**No before/after gallery was built.** That needs real patient photographs with
documented, written consent. Fabricating or mocking up clinical results would be both
unethical and a regulatory problem under DR health-advertising rules — a before/after
image is a representation of a treatment outcome, and an invented one is a false claim
about medicine. If Dr. Valerio has consented cases, this is a genuinely high-value
addition and should be built with the real images.

For the same reason, all new copy in `homeContent` is restricted to well-established,
non-promissory statements about tooth loss and osseointegration (bone resorbs without a
root; adjacent teeth drift; dentures stop fitting as bone remodels). **Nothing claims an
outcome, a success rate, or a timeline for any individual patient**, and nothing should
be added later that does without clinical sign-off.

The unsupported *"resultados garantizados / consulta gratis"* metadata predates this
pass; it is flagged in §4.2 rather than silently rewritten, because changing what the
clinic advertises is the clinic's call.

---

## 7. Conventions worth knowing

- Path alias `@/*` → `src/*`.
- **All bilingual copy lives in `src/lib/data.ts`**, keyed `{ es, en }`. Change copy
  there, not in components. `{{clinicName}}` / `{{doctorName}}` / `{{year}}` tokens are
  replaced at render.
- Four Supabase clients, one per context — see `CLAUDE.md`. Use `types_db.ts` for the
  `Database` generic, never `types.ts`.
- `dump.sql` is a hand-maintained log, not a migration runner. Apply SQL manually and
  update it to match.
- The CSP in `src/middleware.ts` hardcodes the Supabase project URL. If the project
  changes, update `connect-src` there.
- New surfaces should use `primitives/section.tsx` for tone and rhythm, the `e1`–`e5`
  elevation scale rather than ad-hoc shadows, and the semantic z-index scale
  (`z-header`, `z-modal`, …) rather than arbitrary values.
- **Never gate content visibility on a JS-applied class.** `reveal.tsx` renders visible
  by default and only hides what is genuinely off-screen, with a 3s fail-open timer.
  That is what criticals #1 cost, and it is easy to reintroduce.
