-- =============================================================================
-- 0002_optional_appointment_datetime.sql
--
--   *** OPTIONAL — NOT REQUIRED — NOT YET APPLIED ***
--
-- Nothing in the shipped site depends on this file. The booking form works
-- today without it. Do not run it unless you have read the "AFTER APPLYING"
-- section at the bottom and are prepared to make the matching code change in
-- the same deploy.
-- -----------------------------------------------------------------------------
-- WHAT:  Adds first-class columns to public.appointments for the patient's
--        preferred appointment day and time-of-day:
--          preferred_date  date
--          preferred_time  text  ('morning' | 'afternoon' | 'any')
--
-- WHY:   The 2026 booking-form rework added a "when would suit you" step — a
--        preferred day and a morning/afternoon/any choice. `appointments` has
--        no date column (see dump.sql: id, name, email, phone, service_type,
--        reason, is_urgent, submitted_at, status), and writing to a column
--        that does not exist fails the whole INSERT.
--
--        So the shipped code does NOT write these columns. `submitAppointmentForm`
--        in src/app/actions.ts folds the preference into the existing `reason`
--        TEXT column as a labelled first line, in the language the form was
--        submitted in:
--
--          Preferencia de cita: martes, 4 de agosto de 2026 — por la mañana (9:00–12:00).
--
--          <the patient's own text>
--
--        That works with zero schema change and the clinic sees it immediately
--        in the admin table. It is, however, prose: it cannot be sorted,
--        filtered or used to build a day sheet. This migration is the upgrade
--        path when that matters.
--
-- DEPENDS ON: existing table public.appointments (dump.sql).
-- DATE:  2026-07-27
-- SAFETY: Idempotent (ADD COLUMN IF NOT EXISTS). Re-running is a no-op.
--         Both columns are NULLable with no default, so every existing row and
--         every insert that omits them stays valid. Nothing breaks on apply.
--
-- RLS:   *** NO ROW LEVEL SECURITY CHANGES. ***
--        None are needed and none are made. The public INSERT policy on
--        appointments uses WITH CHECK (true) and already permits new columns;
--        SELECT remains admin-only via public.admin_users. Do not add policies
--        here.
-- =============================================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS preferred_date date,
  ADD COLUMN IF NOT EXISTS preferred_time text;

-- Keeps preferred_time to the three values the form can actually produce.
-- Guarded with a catalog lookup because ADD CONSTRAINT has no IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass
      AND conname  = 'appointments_preferred_time_check'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_preferred_time_check
      CHECK (preferred_time IS NULL OR preferred_time IN ('morning', 'afternoon', 'any'));
  END IF;
END
$$;

-- Admin day-sheet lookups ("what has been requested for next week") scan by
-- date. Partial, because rows written before this migration have NULL here and
-- are never the target of such a query.
CREATE INDEX IF NOT EXISTS appointments_preferred_date_idx
  ON public.appointments (preferred_date)
  WHERE preferred_date IS NOT NULL;

COMMENT ON COLUMN public.appointments.preferred_date IS
  'Calendar day the patient asked for. A DATE, not a timestamptz: it is a day, not an instant, and storing it with a time zone shifts it across midnight for every zone west of UTC.';
COMMENT ON COLUMN public.appointments.preferred_time IS
  'Requested time of day: morning | afternoon | any. Not a clock time — the clinic sets the actual slot when it calls back.';

-- =============================================================================
-- AFTER APPLYING — the code change this migration expects
-- -----------------------------------------------------------------------------
-- Until the following is done, these columns stay NULL forever and the
-- preference keeps arriving inside `reason`. Applying the migration alone
-- changes nothing.
--
-- 1. src/lib/types_db.ts — add to the appointments Row / Insert / Update:
--        preferred_date: string | null      (Insert/Update: preferred_date?: string | null)
--        preferred_time: 'morning' | 'afternoon' | 'any' | null
--
-- 2. src/app/actions.ts, submitAppointmentForm — stop folding the preference
--    into `reason` and write the columns instead:
--
--        const sanitizedData = {
--          ...
--          reason: sanitizeText(validatedFields.data.reason),   // <- no prefix
--          preferred_date: validatedFields.data.preferred_date, // 'YYYY-MM-DD'
--          preferred_time: validatedFields.data.time_preference,
--        };
--
--    `preferred_date` is already validated as a `YYYY-MM-DD` calendar string
--    and must be passed through AS A STRING. Do NOT call `new Date(...)` or
--    `.toISOString()` on it: Postgres parses the string as a date directly,
--    whereas an ISO instant re-introduces exactly the timezone shift the string
--    format exists to avoid.
--
--    Delete `formatPreferredDate` / `preferenceLine` and the
--    `appointmentBooking[lang].reasonPrefix` entries in src/lib/data.ts once
--    nothing references them.
--
-- 3. src/app/admin/page.tsx + src/components/admin/** — surface the two columns
--    in the appointments table, and add the header labels to
--    `generalUiStrings.*.appointmentTableHeaders` in src/lib/data.ts.
--
-- 4. Historical rows keep their preference inside `reason`. This migration does
--    NOT backfill them: parsing a localised, bilingual prose date back out of
--    free text is guesswork, and a wrong date on a medical appointment is worse
--    than a date the clinic has to read for itself.
--
-- =============================================================================
-- VERIFICATION (run after applying; should return 2 rows)
-- =============================================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name   = 'appointments'
--   AND column_name IN ('preferred_date', 'preferred_time')
-- ORDER BY column_name;

-- =============================================================================
-- ROLLBACK (destructive — only run intentionally; back up data first)
-- =============================================================================
-- DROP INDEX IF EXISTS public.appointments_preferred_date_idx;
-- ALTER TABLE public.appointments
--   DROP CONSTRAINT IF EXISTS appointments_preferred_time_check;
-- ALTER TABLE public.appointments
--   DROP COLUMN IF EXISTS preferred_date,
--   DROP COLUMN IF EXISTS preferred_time;
