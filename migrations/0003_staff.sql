-- =============================================================================
-- 0003_staff — the authorization boundary
-- =============================================================================
-- The migration off Supabase dropped `public.admin_users` along with the rest
-- of the old schema, and the rebuilt panel replaced the check it backed with
-- "does a Neon Auth session exist?". That is authentication standing in for
-- authorization, and the two are not the same question:
--
--   authentication  who are you            -> Neon Auth answers this
--   authorization   may you see this data  -> nothing answered this
--
-- The consequence was that ANY account in the Neon Auth project — including one
-- created through a provider added later, an invite flow, or a second app
-- sharing the project — was a full administrator of the patient book. Every
-- other control in the panel (the server-component guard, the CSRF token, the
-- affected-row checks, the audit trail) sat behind a missing `if`.
--
-- This table is that `if`. Membership is the boundary; a session is only the
-- key that identifies who is asking.
--
-- Matching is by EMAIL, not by the auth service's user id, because the id does
-- not exist until the person has signed in for the first time and the clinic
-- has to be able to grant access before that. `citext` makes the match
-- case-insensitive, so Dentist@Clinic.do and dentist@clinic.do are one person.
--
-- This is only safe because the application refuses to proxy sign-up (see
-- src/app/api/auth/[...path]/route.ts): if anyone could self-register, they
-- could register a staff address and inherit its access. Accounts are created
-- deliberately, in the Neon console, and then granted here. The two halves are
-- load-bearing together — do not relax one without revisiting the other.
-- =============================================================================

CREATE TABLE IF NOT EXISTS app.staff (
  email       citext PRIMARY KEY CHECK (position('@' IN email) > 1),
  name        text,
  -- Recorded the first time this person signs in, purely so the audit log and a
  -- future "revoke this session" can address the account rather than the
  -- address. Never used to decide access: it is null until first sign-in, and
  -- access has to work before then.
  user_id     text UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Revocation without deletion. Deleting the row loses the record that this
  -- person ever had access, which is exactly what an audit trail is for.
  disabled_at timestamptz
);

COMMENT ON TABLE app.staff IS
  'Authorization boundary for /admin. A Neon Auth session is authentication; a row here is authorization.';

-- The lookup is by email on every admin request and every admin mutation, so it
-- is worth an index even at two rows — and this table stays small by design.
CREATE INDEX IF NOT EXISTS staff_active_idx ON app.staff (email) WHERE disabled_at IS NULL;

GRANT SELECT, INSERT, UPDATE ON app.staff TO vd_app;
-- No DELETE: revocation is `disabled_at`, so a compromised application
-- credential cannot quietly erase the record of who had access.
REVOKE DELETE ON app.staff FROM vd_app;
