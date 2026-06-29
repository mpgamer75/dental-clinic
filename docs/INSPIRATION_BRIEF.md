# Inspiration Brief — Orthoprotesis Dental Clinic (Refined Medical)

> Design-research deliverable for the 2026 UI/UX overhaul. Bias: **trust, calm, clarity, accessibility** for an older-skewing implant/prosthetics patient base + international dental-tourism audience. Adapt, never copy.

## Design north star
Calm clinical confidence: a well-lit, modern, spotless clinic where a competent specialist has all the time in the world for you. Trust is earned through clarity and restraint — generous whitespace, legible type, real faces, verifiable credentials — not spectacle or urgency. If a patient's parent can read it, book it, and believe it on a phone at 2 a.m., we've succeeded.

## Decisions adopted into this overhaul
- **Type:** body **18px (1.125rem)**, line-height **1.6–1.7**, near-black text. Keep Figtree (headings) + humanist sans body. Tabular figures for stats/phone.
- **Color:** keep deep medical blue `hsl(215 85% 32%)` as the trust anchor for CTAs/headings/icons. **Warm the neutrals** — off-white page background instead of pure white; soft blue-grey section bands. **Demote teal to an accent only** (success, small highlights, underlines), never large fills.
- **Touch targets:** ≥44px (prefer 48px), ≥8px spacing.
- **Forms:** keep them short; inline forgiving validation (green check on valid, errors in words+icon); **persistent calm success state** (confirmation card, not just a vanishing toast); privacy + response-time microcopy under submit; explicit, unchecked marketing opt-in.
- **Motion allow-list:** gentle fade+≤8px rise section reveals (once); CountUp stats (single play, tabular); soft card hover lift (~150ms); sticky header condense; focus-ring transitions. All `prefers-reduced-motion`-aware.
- **Motion avoid-list:** auto-carousels, autoplay video w/ sound, scroll-jacking, parallax, cursor-trails, glassmorphism over busy photos, neon glows, particles, bouncy easings, letter-by-letter flying text.
- **3D:** educational implant cross-section only where it teaches (implants section), lazy, user-triggered, static fallback, reduced-motion gated. Never on the homepage hero/critical path. → This overhaul implements it as a **lightweight animated SVG cross-section** (no WebGL bundle) for best perf/a11y.

## Consent / privacy microcopy (adopted)
- ES: *"Tus datos solo se usan para gestionar tu solicitud y nunca se comparten. Consulta nuestra Política de Privacidad."*
- EN: *"Your information is used only to manage your request and is never shared. See our Privacy Policy."*
- ES (response): *"Te responderemos en menos de 24 horas."* · EN: *"We'll reply within 24 hours."*

## Key references
- Dental/healthcare trust & trends: delmain, lassomd, nopio, webstacks, pctechmag, digitalrootsmedia.
- Awwwards (restrained, credible): LAVA Dental, Halo Dental.
- React Bits patterns (tasteful subset): CountUp, Scroll Reveal, Fade Content, Spotlight Card (tuned down/skipped).
- Accessibility (elder): a11y-collective (min font size), hurix (senior WCAG), edify, tpgi (ageism in design).
- Booking/CTA/microcopy: penrod, arini, blacksmith, landingi, shopify microcopy.
- Typography: Typewolf humanist sans, designshack, fontfabric, creativebloq.
- 3D education: ScienceDirect immersive implant tool, EBakr 3D dental.
