# OVERHAUL_PLAN.md — Premium UI/UX Overhaul

**Project:** Orthoprotesis Dental Clinic / Dr. Francis Valerio — bilingual (es-DO / en) marketing site + admin panel
**Branch:** `feat/ui-ux-overhaul-2026`
**Mode:** Healthcare site — trust, calm, clarity, accessibility first; premium polish second; spectacle never.
**Date:** 2026-06-29

---

## 1. Stack & architecture (confirmed in Phase 0)

| Concern | Finding |
|---|---|
| Framework | Next.js **15.5.9** (App Router), React **18.3.1**, TypeScript strict |
| Styling | Tailwind **3.4.1** + shadcn/ui (Radix + CVA), CSS-variable tokens, class-based dark mode |
| Motion | **framer-motion 12** (`<Reveal>` wrapper, respects reduced-motion). No GSAP/Lenis/R3F installed. |
| i18n | Hand-rolled, URL-prefix `/es` (default) + `/en`; `middleware.ts` redirect/prefix; `LanguageProvider` |
| Data | Supabase (Postgres + Auth + RLS). 4 client pattern. Canonical types in `types_db.ts`. |
| DB schema | 5 tables: `appointments`, `contact_messages`, `testimonials`, `admin_users`, `app_settings`. **`is_urgent`, `status`, moderation states already exist.** |
| Forms | react-hook-form + zod (per-language, duplicated client+server in `actions.ts`), hardcoded `content-moderation.ts`. |
| Deploy | Vercel (`vercel.json`), region iad1. |
| Routes | `/[lang]` (home, anchored sections), `/[lang]/agendar-cita`, `/admin` (live), `/admin-dashboard` (server variant). **No service-detail routes exist** — "Servicios" is an on-page anchor section. |
| Assets | `public/images/`: 9 diplomas, `logo_valerio.png`, 3 `vitrine_clinique{1,2,3}.jpg`. **No OG/twitter/clinic-exterior/root-logo images** (referenced but missing). |
| Secrets | `.env*` is gitignored; **no secrets committed** ✓ |

### Critical correction to the brief's assumptions
- The brief assumed **service-detail pages** exist ("Leer Más" / "Ver Todos los Tratamientos"). They **do not** — services render as cards in an on-page `#servicios` section with an expand/collapse. We will keep that model (it is fine for a single-page clinic site) and ensure those CTAs anchor-scroll correctly rather than 404.

---

## 2. Most important context: a refresh already landed

The last commit `7c7a7b7 feat(ui): premium UI/UX refresh (Refined Medical)` already rewrote: `globals.css` design tokens (deep medical blue `215 85% 32%` + soft teal `186 64% 32%`, light/dark, reduced-motion, focus-visible), all public **section** components, `navbar`, `footer`, and the **contact + testimonial** forms, plus `<Reveal>` and `<SectionHeading>`.

**It did NOT touch:** `appointment-form.tsx`, the entire **admin panel**, `seo-config.ts`, `sitemap.ts`, `robots.ts`, `data.ts`, or the **error pages**.

➡️ **Strategy: build ON the Refined Medical system and close the gaps** — not a from-scratch redesign. This protects the working public site and concentrates effort where it's missing.

---

## 3. Prioritized findings (from 9-agent recon)

### 🔴 Critical / High — must fix
1. **Site-URL chaos → production localhost leak (SEO).** Four conflicting origins: real `drfrancisvaleriop.com` vs. code fallback `orthoprotesis-dental.com` (×6 hardcoded incl. structured-data `@id`/`url`/`image`/`logo` + breadcrumb) vs. `.env` `…vercel.app/es` (bad trailing `/es` corrupts `metadataBase`) vs. `.env.local` `localhost:3000`.
2. **Fabricated `aggregateRating`** (`4.9` / `150 reviews`) in JSON-LD — no backing data. Risk: Google penalty + trust/compliance. → **Remove** + flag.
3. **Broken social/SEO images** — `og-image-implants.jpg`, `twitter-image-implants.jpg`, `clinic-exterior.jpg`, root `/logo.png` referenced but **do not exist**.
4. **Error pages are 100% French** with `lang="fr"` (`error.tsx`, `global-error.tsx`) — shown to all users on any uncaught error.
5. **Map embed locale `!1sfr!2sdo`** (French) in both es + en (`data.ts:422-423`).
6. **Appointment form not refreshed** — French char counter (`appointment-form.tsx`), undersized Switch (24px) touch target, no consent microcopy, styling inconsistent with other forms.
7. **No privacy/consent microcopy** on any form; **no privacy policy page** (healthcare trust + DR Ley 172-13).
8. **French `verification.google` placeholder** (`'votre-code-verification-google'`) ships to HTML.
9. **Admin panel** uses partial/old styling, `confirm()` native dialogs, emoji toasts, sub-44px targets, missing landmarks.
10. **Elder-friendly a11y gaps**: no global body font-size/line-height; touch targets 36–40px across buttons/inputs/icon-buttons (< 44px); no success/warning token or toast variant; root `<html lang>` hardcoded `es`.

### 🟡 Medium
- hreflang inconsistency (`es`/`en` vs. `es-DO`/`en-US`) in `sitemap.ts` + `agendar-cita`.
- No loading/error state for DB-driven testimonials (silent empty on failure).
- Dead `language-toggle-button.tsx` (unused, buggy).
- French console strings in admin setup scripts.
- Guarantee / free-consult / FDA / superlative claims (flag for legal review — see §6).

### 🟢 Low
- French code comments (fix opportunistically in touched files).
- Stray `public/test-images.html`.
- Missing favicon/manifest niceties.

---

## 4. Scope decisions (what we will and won't do)

**In scope (this overhaul):**
- Design-foundation hardening on top of Refined Medical (a11y, tokens, primitives).
- Appointment + all forms experience; consent microcopy; **bilingual Privacy Policy page**.
- Public section gap-close (loading/error states, mobile, a11y).
- Admin **restyle + targeted a11y** (AlertDialog, icon toasts, landmarks, 44px) with **full functional parity**.
- Restrained motion polish + a tasteful **educational implant SVG cross-section** (see below).
- Full SEO/i18n fix (single-source site URL, structured data, hreflang, error pages, French sweep).
- Prepared (never applied) DB migrations.

**Explicitly OUT of scope (avoid scope-creep / "don't touch business logic"):**
- Refactoring the 1180-line `admin/page.tsx` into many files (high risk, no UX benefit) — restyle in place.
- New email/SMS notification tables, audit-log tables, RLS role re-architecture (recon suggested; beyond a UI overhaul and touches data/security model).
- Service-detail page routes (don't exist by design; not requested as a real gap).
- Deleting `/admin-dashboard` (keep both; restyle shared client).
- Rewriting/strengthening medical claims — **flag only** (§6).

**3D decision:** Instead of React-Three-Fiber (adds `three`+`drei`+R3F bundle, WebGL/perf/low-power risk on a trust-first health site), implement a **clean, lazy, animated SVG cross-section of a dental implant** (titanium post + abutment + crown, labeled, bilingual). Zero JS-bundle/ WebGL cost, fully accessible, respects reduced-motion, perfect static fallback. This better serves "educate the patient with restraint." R3F considered and rejected — documented in `FINAL_REPORT.md`.

---

## 5. Execution order

| Phase | Focus | Risk |
|---|---|---|
| **1** | Design foundations: success/warning tokens, elder type scale, 44px primitives, CTA, contrast | low |
| **6** | SEO/i18n: single-source `SITE_URL`, structured data, generated OG image, hreflang, error pages, French sweep | low, high-impact |
| **3** | Appointment + forms: refresh appointment form, fix counter, consent microcopy, Privacy page, Switch a11y | medium |
| **2** | Public sections: loading/error states, mobile, a11y polish, implant SVG | medium |
| **4** | Admin: restyle + AlertDialog/icon-toasts/landmarks/44px, parity | medium |
| **5** | Motion polish + lazy educational implant SVG wiring | low |
| **7** | Visual QA loop (Playwright MCP): mobile+desktop, both locales, flows, prod-build SEO | — |
| **8** | DB migrations (prepare, never apply): zero required + optional consent migration + README | low |
| **9** | Independent review + `FINAL_REPORT.md` | — |

Each phase ends with a green `npm run typecheck` + atomic conventional commit. Build stays green throughout.

---

## 6. Claims flagged for human/legal review (DR Ley 172-13) — do NOT amplify

Inventoried, **left as-is** in copy (except the fabricated rating, which is removed):
- **REMOVED (fabricated, not human copy):** `aggregateRating` 4.9 / 150 reviews — `seo-config.ts`.
- "resultados garantizados" / "guaranteed results" — `seo-config.ts:26,71`.
- "100% Garantizado" / "100% Guaranteed" hero trust chip — `page.tsx` (heroExtras).
- "Consulta gratis" / "Free consultation" — `seo-config.ts:26,66,71,111`.
- "materiales FDA aprobados" / "FDA-approved materials" — `seo-config.ts` keywords + offer descriptions.
- "mejor dentista" / "best dentist" keywords; "resultados naturales"; "asegurar los mejores resultados".
- 30+ years, 9 certifications, specialist credentials — verifiable, no docs linked.

Full table with file:line goes in `FINAL_REPORT.md`.

---

## 7. Definition of Done (tracked against brief §13)

See task list (#1–#11). Ship only when: every section/page responsive both locales with empty/loading/error states; all 3 flows submit end-to-end with reassuring states; admin restyled at parity; WCAG 2.2 AA elder-friendly; CWV green mobile; calm motion + reduced-motion; SEO localhost bug fixed + structured data valid; French residue removed; PII server-side + consent microcopy + NAP consistent; no fabricated claims (rating removed, rest flagged); before/after screenshots; migrations in folder w/ README, none applied; branch clean, build green; `FINAL_REPORT.md` written.
