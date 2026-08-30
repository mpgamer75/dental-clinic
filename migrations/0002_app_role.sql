-- =============================================================================
-- 0002_app_role — least-privilege role for the application
-- =============================================================================
-- `neondb_owner` is the migration role: it owns every object and can run DDL.
-- The application must never connect as it. `vd_app` is what DATABASE_URL points
-- at at runtime, and it can do exactly what the app needs and nothing more:
--
--   * CRUD on app.*                     — the business tables
--   * INSERT + SELECT on audit.audit_log — append-only; cannot rewrite history
--   * no DDL anywhere
--   * no access to neon_auth.*          — session and credential storage is
--                                         Neon Auth's, reached over its own API,
--                                         never over this connection
--
-- Supabase had one role for everything and leaned entirely on RLS. That is not
-- available here (`auth.uid()` is a Supabase function), so the boundary moves to
-- role grants plus server-side checks in the application.
--
-- NOTE: the password below is a placeholder. Set a real one and put the
-- resulting connection string in DATABASE_URL:
--   ALTER ROLE vd_app WITH PASSWORD '<generated>';
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vd_app') THEN
    CREATE ROLE vd_app LOGIN;
  END IF;
END
$$;

-- Connect + schema visibility, but not the ability to create objects.
GRANT CONNECT ON DATABASE neondb TO vd_app;
GRANT USAGE ON SCHEMA app TO vd_app;
GRANT USAGE ON SCHEMA audit TO vd_app;

-- Business tables: full row-level CRUD, no schema changes.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO vd_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO vd_app;

-- Audit log: write and read, never amend. This is the point of the separate
-- schema — a compromised app credential can add to the record but cannot edit
-- or delete what is already there.
GRANT SELECT, INSERT ON audit.audit_log TO vd_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO vd_app;
REVOKE UPDATE, DELETE, TRUNCATE ON audit.audit_log FROM vd_app;

-- Same grants for anything a later migration adds, so a new table does not
-- silently arrive unreadable (or, worse, prompt someone to grant it ALL).
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vd_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT USAGE, SELECT ON SEQUENCES TO vd_app;

-- `public` stays empty and stays closed. Postgres 15+ already revokes CREATE
-- from PUBLIC, but being explicit means a future `CREATE TABLE foo` without a
-- schema qualifier fails loudly instead of landing somewhere ungoverned.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM vd_app;
