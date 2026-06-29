# Manual SQL migrations

> **These are applied by a human, never automatically.** This repo has no
> migration runner; the live schema is maintained by hand in `dump.sql` and the
> Supabase SQL editor. Review every file before running it.

## Summary for the 2026 UI/UX overhaul

**The overhaul requires ZERO schema changes.** The existing schema already
supports everything the new UI uses:

- `appointments.is_urgent` (boolean) — the urgency toggle.
- `appointments.status`, `contact_messages.status`, `testimonials.status` — all
  admin workflows (pending/confirmed/cancelled/completed, unread/read/archived,
  pending_approval/approved/rejected).
- Testimonial auto-approval is computed in the server action (`score >= 85`); no
  extra column is needed.

The consent **microcopy** added to the forms is descriptive text only and is
**not persisted**, so it needs no column. The privacy policy is a static page.

## Optional migration (not required)

`0001_optional_form_consent.sql` adds columns to persist that a patient accepted
the privacy notice (`consent_given`, `consent_version`) and the locale the form
was submitted in (`source_locale`). Apply this **only if** you later decide to
store consent for audit purposes. If you apply it and want the values populated,
you must also send those fields from the server actions in `src/app/actions.ts`
(currently they do not, by design — see the overhaul report).

## How to run

1. Open the Supabase Dashboard → your project → **SQL Editor**.
2. Paste the contents of the migration file (e.g. `0001_optional_form_consent.sql`).
3. Run it. Each statement is **idempotent** (`IF NOT EXISTS`), so re-running is safe.
4. Run the **Verification** query at the bottom of the file to confirm the columns exist.

CLI alternative (if you use the Supabase CLI and have it linked):

```bash
supabase db execute --file supabase/migrations/manual/0001_optional_form_consent.sql
```

## Rollback

Each migration file ends with a clearly-marked, commented-out **ROLLBACK**
section. To roll back, copy those statements into the SQL editor and run them.
`DROP COLUMN` is destructive — back up first if the columns hold data.

## RLS

These migrations do **not** change Row Level Security. The public (`anon`) role
already inserts rows via `WITH CHECK (true)` INSERT policies, which permit the
new columns; only admins (rows in `public.admin_users`) can read them. No policy
edits are needed.

## Run order

| Order | File | Required? | Notes |
|-------|------|-----------|-------|
| 1 | `0001_optional_form_consent.sql` | No (optional) | Persist form consent + source locale |
