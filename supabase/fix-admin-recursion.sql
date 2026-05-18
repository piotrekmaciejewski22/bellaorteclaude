-- =============================================================================
-- BELLAORTE — fix RLS infinite recursion on admin_users
-- =============================================================================
--
-- Problem: every admin policy uses the predicate
--   auth.uid() in (select user_id from public.admin_users)
-- which is fine on tables OTHER than admin_users, but applied to
-- admin_users itself it creates infinite recursion: to evaluate the
-- policy on admin_users we have to read admin_users to evaluate the
-- policy ... loop.
--
-- Fix: introduce a SECURITY DEFINER function `public.is_admin(uid)`.
-- Functions with `SECURITY DEFINER` run with the privileges of the
-- function owner (postgres) and bypass RLS while inside the function.
-- Re-write every admin policy on admin_users to call this function
-- instead of running an inline subquery against the same table.
--
-- This file is idempotent — re-running it is safe.
-- Run it once in Supabase SQL Editor as `postgres` (default in Studio).
-- =============================================================================


-- 1. Helper function. STABLE so the planner can cache it within a query;
-- SECURITY DEFINER so it can read admin_users without going through RLS.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = uid
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;


-- 2. Drop the recursive policies on admin_users and recreate them using
-- the helper. Only authenticated admins can read; nobody else writes
-- through RLS (writes go via service_role).

drop policy if exists "admin_users_admin_read" on public.admin_users;
create policy "admin_users_admin_read"
  on public.admin_users
  for select
  to authenticated
  using (public.is_admin((select auth.uid())));


-- =============================================================================
-- Sanity check: this query should now return your admin row when run
-- as service_role, and should NOT loop. From an authenticated admin
-- session it should return one row (yours). From an anon session it
-- should return zero rows.
--
--   set local role service_role;
--   select user_id from public.admin_users;
--   reset role;
-- =============================================================================
