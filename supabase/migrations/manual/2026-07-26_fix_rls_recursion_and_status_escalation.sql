-- =============================================================================
-- Fix: RLS infinite recursion + anonymous status escalation
--
-- Apply by pasting into the Supabase SQL editor. This project has no migration
-- runner; dump.sql is a hand-maintained log, so update it to match afterwards.
--
-- Two independent CRITICAL problems are fixed here.
--
-- (1) INFINITE RECURSION — the entire admin panel is dead.
--
--     The SELECT policy on public.admin_users tests membership by querying
--     public.admin_users, which re-triggers the same policy. Postgres aborts
--     with:
--         42P17: infinite recursion detected in policy for relation "admin_users"
--
--     Every other admin policy also does `SELECT 1 FROM public.admin_users`
--     inside its USING clause, and RLS applies to that subquery too — so admin
--     SELECT/UPDATE/DELETE on appointments, contact_messages, testimonials and
--     app_settings all fail with the same error. A legitimate admin signing in
--     is told "Acceso denegado. No tiene permisos de administrador."
--
--     Fixed with a SECURITY DEFINER helper that bypasses RLS for the membership
--     lookup, plus a non-recursive self-read policy.
--
-- (2) STATUS ESCALATION — moderation is optional from the client's side.
--
--     The anonymous INSERT policies are `WITH CHECK (true)` and `status` is a
--     plain client-supplied column. The anon key ships to the browser, so
--     anyone can POST directly to the REST endpoint and skip the server action:
--
--       curl -X POST 'https://<project>.supabase.co/rest/v1/testimonials' \
--            -H 'apikey: <anon key>' -H 'Content-Type: application/json' \
--            -d '{"name":"X","quote":"spam","status":"approved"}'
--
--     That row is immediately readable by the public SELECT policy and renders
--     on the homepage with zero moderation. The same trick lets an attacker
--     insert appointments as 'completed' or messages as 'archived' so they
--     never appear in the clinic's pending views.
--
--     Fixed by constraining the status each role may write on INSERT.
--
-- NOTE: the server action auto-approves testimonials scoring >= 85. That path
-- uses the anon client, so it can no longer set status='approved' directly.
-- Either accept that all testimonials start as 'pending_approval' (recommended
-- — a human should see them), or move the auto-approve write to the
-- service-role client in src/lib/supabase-admin.ts.
-- =============================================================================

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Non-recursive admin membership test
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
security definer          -- runs as owner, so RLS on admin_users is bypassed
stable
set search_path = public  -- never resolve unqualified names from the caller
as $$
  select exists (
    select 1 from public.admin_users where id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. admin_users: replace the self-referential policy
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Admins can view admin_users" on public.admin_users;
drop policy if exists "Users can read own admin row" on public.admin_users;

-- Non-recursive: compares the row's own id to auth.uid(), no subquery.
create policy "Users can read own admin row"
on public.admin_users for select
to authenticated
using (id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Rewrite every admin policy to use the helper
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array['appointments', 'contact_messages', 'testimonials', 'app_settings']
  loop
    execute format('drop policy if exists "Admins can view all %1$s" on public.%1$I', t);
    execute format('drop policy if exists "Admins can update %1$s" on public.%1$I', t);
    execute format('drop policy if exists "Admins can delete %1$s" on public.%1$I', t);
    execute format('drop policy if exists "Admin full access for %1$s" on public.%1$I', t);

    execute format(
      'create policy "Admins can view all %1$s" on public.%1$I for select to authenticated using (public.is_admin())', t);
    execute format(
      'create policy "Admins can update %1$s" on public.%1$I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format(
      'create policy "Admins can delete %1$s" on public.%1$I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Constrain the status anonymous inserts may claim
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Public can insert testimonials" on public.testimonials;
drop policy if exists "Public insert access for testimonials" on public.testimonials;

create policy "Public can insert pending testimonials"
on public.testimonials for insert
to anon, authenticated
with check (status = 'pending_approval');

drop policy if exists "Public can insert appointments" on public.appointments;
drop policy if exists "Public insert access for appointments" on public.appointments;

create policy "Public can insert pending appointments"
on public.appointments for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "Public can insert contact_messages" on public.contact_messages;
drop policy if exists "Public insert access for contact_messages" on public.contact_messages;

create policy "Public can insert unread contact_messages"
on public.contact_messages for insert
to anon, authenticated
with check (status = 'unread');

-- Defence in depth: make the DB assign the safe default even if a client omits
-- the column, so the policy above is a constraint rather than the only guard.
alter table public.testimonials     alter column status set default 'pending_approval';
alter table public.appointments     alter column status set default 'pending';
alter table public.contact_messages alter column status set default 'unread';

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification — run after committing. Both should return zero rows.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- a) No policy on admin_users may reference admin_users in its own expression:
--
--   select polname
--   from pg_policy
--   where polrelid = 'public.admin_users'::regclass
--     and pg_get_expr(polqual, polrelid) ilike '%admin_users%';
--
-- b) No anonymous INSERT policy may still be unconditional:
--
--   select c.relname, p.polname
--   from pg_policy p
--   join pg_class c on c.oid = p.polrelid
--   where p.polcmd = 'a'
--     and pg_get_expr(p.polwithcheck, p.polrelid) = 'true'
--     and c.relname in ('appointments','contact_messages','testimonials');
--
-- c) As a signed-in admin, this must return a row rather than error 42P17:
--
--   select public.is_admin();
