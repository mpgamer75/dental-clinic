-- =============================================================================
-- 0001_optional_form_consent.sql
-- -----------------------------------------------------------------------------
-- WHAT:  Adds optional columns to persist patient consent to the privacy notice
--        and the locale a form was submitted in, on the three public-facing
--        tables (appointments, contact_messages, testimonials).
-- WHY:   The 2026 UI/UX overhaul added privacy/consent MICROCOPY to the forms
--        for trust + DR Ley 172-13 alignment. That copy is descriptive only and
--        is not stored. These columns let you OPTIONALLY persist consent for an
--        audit trail later. They are NOT required by the shipped UI.
-- DEPENDS ON: existing tables public.appointments / contact_messages /
--             testimonials (see dump.sql). No RLS changes required — the public
--             INSERT policies use WITH CHECK (true) and already permit these
--             columns; only admins can read them.
-- DATE:  2026-06-29
-- SAFETY: Idempotent (ADD COLUMN IF NOT EXISTS). Re-running is a no-op.
-- NOTE:  After applying, to actually capture these values you must also send
--        them from the server actions in src/app/actions.ts (they currently do
--        not, by design). Defaults keep existing inserts valid.
-- =============================================================================

-- appointments -----------------------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS consent_given   boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_version text,
  ADD COLUMN IF NOT EXISTS source_locale   text;

-- contact_messages -------------------------------------------------------------
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS consent_given   boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_version text,
  ADD COLUMN IF NOT EXISTS source_locale   text;

-- testimonials -----------------------------------------------------------------
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS consent_given   boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_version text,
  ADD COLUMN IF NOT EXISTS source_locale   text;

COMMENT ON COLUMN public.appointments.consent_given     IS 'Patient accepted the privacy notice when submitting.';
COMMENT ON COLUMN public.appointments.consent_version   IS 'Version/label of the privacy notice accepted (e.g. "1.0").';
COMMENT ON COLUMN public.appointments.source_locale     IS 'Locale the form was submitted in (es | en).';
COMMENT ON COLUMN public.contact_messages.consent_given IS 'Sender accepted the privacy notice when submitting.';
COMMENT ON COLUMN public.testimonials.consent_given     IS 'Author authorized publication when submitting.';

-- =============================================================================
-- VERIFICATION (run after applying; should return 9 rows)
-- =============================================================================
-- SELECT table_name, column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('appointments', 'contact_messages', 'testimonials')
--   AND column_name IN ('consent_given', 'consent_version', 'source_locale')
-- ORDER BY table_name, column_name;

-- =============================================================================
-- ROLLBACK (destructive — only run intentionally; back up data first)
-- =============================================================================
-- ALTER TABLE public.appointments
--   DROP COLUMN IF EXISTS consent_given,
--   DROP COLUMN IF EXISTS consent_version,
--   DROP COLUMN IF EXISTS source_locale;
-- ALTER TABLE public.contact_messages
--   DROP COLUMN IF EXISTS consent_given,
--   DROP COLUMN IF EXISTS consent_version,
--   DROP COLUMN IF EXISTS source_locale;
-- ALTER TABLE public.testimonials
--   DROP COLUMN IF EXISTS consent_given,
--   DROP COLUMN IF EXISTS consent_version,
--   DROP COLUMN IF EXISTS source_locale;
