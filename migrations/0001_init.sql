-- =============================================================================
-- 0001_init — initial Neon schema
-- =============================================================================
-- Replaces the Supabase public schema. Three differences from the dump this is
-- derived from, all deliberate:
--
--   1. Tables live in `app`, not `public`. The application connects as a role
--      that has CRUD on `app` and nothing else — no DDL, no read access to the
--      auth tables, INSERT-only on the audit log. Under Supabase there was one
--      role for everything and RLS was the only boundary; RLS cannot help here
--      because `auth.uid()` does not exist outside Supabase, so the boundary is
--      moved to roles and to server-side checks.
--
--   2. Every `status` column carries a CHECK constraint. They were unconstrained
--      `text` in the dump while TypeScript declared them as closed unions, so
--      the types were fiction — any string could be written.
--
--   3. `appointments.preferred_date` and `.time_preference` are real columns.
--      The old code formatted both into a sentence and prepended it to the
--      free-text `reason`, which meant the clinic could not sort or filter by
--      the date a patient actually asked for. `reason` now holds only what the
--      patient wrote.
--
-- Neon Auth owns the `neon_auth` schema (user, session, account, …). Nothing
-- here writes to it, and no foreign key points at it — it is managed by Neon and
-- its shape is not ours to depend on. Admin identity is referenced by id as
-- plain text where it needs recording.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;

-- -----------------------------------------------------------------------------
-- app.appointments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  email           citext NOT NULL CHECK (length(email) <= 255),
  phone           text CHECK (phone IS NULL OR length(phone) <= 40),
  service_type    text NOT NULL CHECK (length(service_type) <= 120),
  reason          text NOT NULL CHECK (length(reason) BETWEEN 10 AND 500),
  is_urgent       boolean NOT NULL DEFAULT false,

  -- A calendar date, not an instant: `date` rather than `timestamptz` so it
  -- cannot drift a day across the UTC-4 boundary the way an ISO timestamp does.
  preferred_date  date,
  time_preference text CHECK (time_preference IN ('morning', 'afternoon', 'any')),

  submitted_at    timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- The admin queue reads urgent-first, then newest-first, and filters by status.
-- This is the index that stops an urgent request being buried under routine ones.
CREATE INDEX IF NOT EXISTS appointments_queue_idx
  ON app.appointments (is_urgent DESC, submitted_at DESC);
CREATE INDEX IF NOT EXISTS appointments_status_idx
  ON app.appointments (status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS appointments_preferred_date_idx
  ON app.appointments (preferred_date) WHERE preferred_date IS NOT NULL;

-- -----------------------------------------------------------------------------
-- app.contact_messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.contact_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  email        citext NOT NULL CHECK (length(email) <= 255),
  phone        text CHECK (phone IS NULL OR length(phone) <= 40),
  message      text NOT NULL CHECK (length(message) BETWEEN 10 AND 1000),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  status       text NOT NULL DEFAULT 'unread'
                 CHECK (status IN ('unread', 'read', 'archived'))
);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx
  ON app.contact_messages (status, submitted_at DESC);

-- -----------------------------------------------------------------------------
-- app.testimonials
-- -----------------------------------------------------------------------------
-- `status` no longer has an auto-approve path. Everything lands as
-- 'pending_approval' and a human publishes it; `moderation_score` is retained as
-- a queue-priority hint, not as a gate. The old rule published anything scoring
-- >= 85 straight to a medical practice's homepage, from a 45-word literal
-- blocklist that never saw the `location` field at all.
CREATE TABLE IF NOT EXISTS app.testimonials (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  quote            text NOT NULL CHECK (length(quote) BETWEEN 10 AND 1000),
  location         text CHECK (location IS NULL OR length(location) <= 120),
  moderation_score smallint CHECK (moderation_score BETWEEN 0 AND 100),
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  reviewed_by      text,
  status           text NOT NULL DEFAULT 'pending_approval'
                     CHECK (status IN ('pending_approval', 'approved', 'rejected'))
);

-- The public homepage reads only approved rows, newest first.
CREATE INDEX IF NOT EXISTS testimonials_public_idx
  ON app.testimonials (submitted_at DESC) WHERE status = 'approved';
-- The moderation queue reads pending rows worst-score-first.
CREATE INDEX IF NOT EXISTS testimonials_queue_idx
  ON app.testimonials (moderation_score ASC NULLS FIRST, submitted_at DESC)
  WHERE status = 'pending_approval';

-- -----------------------------------------------------------------------------
-- app.site_settings
-- -----------------------------------------------------------------------------
-- What survives of the old `app_settings`. That table carried ~22 bilingual
-- content columns (clinic name, address, phone, schedule, map links) that no
-- code ever read — src/lib/data.ts is the real content source — alongside four
-- feature flags that are genuinely runtime state. Only the flags are kept.
--
-- `id` is pinned to a single row: this is configuration, not a collection.
CREATE TABLE IF NOT EXISTS app.site_settings (
  id                 boolean PRIMARY KEY DEFAULT true CHECK (id),
  maintenance_mode   boolean NOT NULL DEFAULT false,
  allow_appointments boolean NOT NULL DEFAULT true,
  allow_testimonials boolean NOT NULL DEFAULT true,
  allow_contact_form boolean NOT NULL DEFAULT true,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         text
);

INSERT INTO app.site_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- app.rate_limits
-- -----------------------------------------------------------------------------
-- Fixed-window counter shared by the three public forms and by admin login
-- throttling. There was no rate limiting of any kind before this: the clinic's
-- only intake channel could be filled by a loop.
--
-- `bucket` is a caller-built key such as 'appointment:<ip-hash>' or
-- 'login:<ip-hash>'. The IP is hashed with a server secret before it gets here —
-- a raw address is personal data and this table has no business holding one.
CREATE TABLE IF NOT EXISTS app.rate_limits (
  bucket       text NOT NULL,
  window_start timestamptz NOT NULL,
  hits         integer NOT NULL DEFAULT 1 CHECK (hits >= 0),
  PRIMARY KEY (bucket, window_start)
);

-- Lets the sweeper delete expired windows without a full scan.
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON app.rate_limits (window_start);

-- -----------------------------------------------------------------------------
-- audit.audit_log
-- -----------------------------------------------------------------------------
-- Append-only. The application role is granted INSERT and SELECT and nothing
-- else, so a compromised application credential cannot rewrite or erase the
-- record of what it did. Before/after snapshots are jsonb so the shape can
-- change without a migration.
CREATE TABLE IF NOT EXISTS audit.audit_log (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id     text,
  actor_email  citext,
  action       text NOT NULL,
  entity       text NOT NULL,
  entity_id    text,
  before       jsonb,
  after        jsonb,
  ip_hash      text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit.audit_log (entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit.audit_log (created_at DESC);

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER (the default) and a pinned search_path: without the pin, a
-- role that can create objects in a schema earlier on the path could shadow
-- `now()` and have it run with the caller's rights.
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER appointments_touch
  BEFORE UPDATE ON app.appointments
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

CREATE OR REPLACE TRIGGER contact_messages_touch
  BEFORE UPDATE ON app.contact_messages
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

CREATE OR REPLACE TRIGGER testimonials_touch
  BEFORE UPDATE ON app.testimonials
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
