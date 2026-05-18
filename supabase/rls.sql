-- =============================================================================
-- BELLAORTE — Row Level Security policies
-- =============================================================================
--
-- Purpose:
--   Enables Row Level Security on every table created by `schema.sql` and
--   declares the per-role policies for `anon` (anonymous browser visitor)
--   and `authenticated` (logged-in admin). The `service_role` used by
--   `createServiceClient()` in `src/lib/supabase/admin.ts` BYPASSES RLS
--   entirely, so this file deliberately defines NO `service_role` policies.
--
-- Deployment order (paste each file into the Supabase SQL editor, or run
-- them in this order with `supabase db push`):
--   1. supabase/schema.sql   ← extensions, enums, tables, RPC.
--   2. supabase/rls.sql      ← THIS FILE.
--   3. supabase/storage.sql  ← buckets and storage policies.
--   4. supabase/seed.sql     ← demo data.
--
-- Role split (Wymaganie 38, Wymaganie 42):
--   * `anon`           — unauthenticated public visitors. May SELECT only
--                        published, non-PII rows. Never sees the contents
--                        of `booking_inquiries`, `reservations`,
--                        `calendar_blocks`, or `admin_users`.
--   * `authenticated`  — logged-in Supabase Auth user. Becomes "admin"
--                        when their `auth.uid()` is present in
--                        `public.admin_users`. Admins can read everything
--                        (including unpublished/soft-deleted/pending rows)
--                        and perform every write.
--   * `service_role`   — used exclusively from server-side route handlers
--                        (booking inquiries POST, review POST, guest photo
--                        POST, admin mutations). Bypasses RLS by design.
--                        That is the escape hatch for the public POST
--                        flows that anon must NOT be able to perform via
--                        a direct REST call.
--
-- Admin predicate:
--   `(select auth.uid()) in (select user_id from public.admin_users)`
--   The `auth.uid()` call is wrapped in a subquery so PostgreSQL caches
--   the value once per statement (Supabase RLS performance best practice).
--   The same predicate appears in both `using` and `with check` to keep
--   the row visibility and the row-being-written rules symmetric.
--
-- Public POST escape hatch:
--   The public POST endpoints — `POST /api/booking-inquiries`,
--   `POST /api/reviews`, `POST /api/guest-photos` — go through rate-limited
--   route handlers (tasks 5.2, 5.3) that authenticate to Supabase with the
--   `service_role` key. service_role bypasses RLS, so this file deliberately
--   does NOT add an `anon INSERT` policy on `booking_inquiries`, `reviews`,
--   or `guest_photos`. A direct anon REST insert from the browser is — and
--   must remain — rejected.
--
-- Public availability read path:
--   The PII tables `booking_inquiries`, `reservations`, `calendar_blocks`
--   have no `to anon` policy of any kind. Anonymous availability data is
--   served exclusively through the `public.get_availability(uuid, date,
--   date)` RPC defined in `schema.sql`, which returns only an aggregate
--   day-status string (Wymaganie 7, 8, 42).
--
-- Naming convention:
--   `<table>_<role>_<action>[_<qualifier>]`, snake_case. Examples:
--     apartments_anon_read_published
--     restaurants_admin_write_update
--     booking_inquiries_admin_read
--   Each role × action combination gets its own policy. We deliberately
--   avoid the `for all` shortcut so the audit trail stays explicit.
--
-- Idempotency:
--   This file is fully re-runnable. Every table is wrapped in
--   `alter table ... enable row level security` (which is idempotent) and
--   every policy is preceded by `drop policy if exists ...` so a re-run
--   replaces the existing policy in place.
--
-- A note on `force row level security`:
--   We deliberately do NOT use `force row level security`. With plain
--   `enable row level security`, the `service_role` (and table owner,
--   which is the Supabase migration role) bypasses RLS — that is exactly
--   the behaviour we rely on for the rate-limited public POST handlers
--   and for the admin route handlers in `src/app/api/admin/**`. Forcing
--   RLS would require adding `service_role` policies on every PII table,
--   which would expand the attack surface for no security gain.
--
-- Wymagania pokryte: 38 (#3, #4), 42 (#1).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. apartments
-- -----------------------------------------------------------------------------
-- Public visibility: a row is visible to anon iff `published_at is not null`.
-- Authenticated admins see every row (including unpublished drafts) via the
-- explicit admin SELECT policy below. Writes are admin-only.

alter table public.apartments enable row level security;

drop policy if exists "apartments_anon_read_published" on public.apartments;
create policy "apartments_anon_read_published"
  on public.apartments
  for select
  to anon, authenticated
  using (published_at is not null);

drop policy if exists "apartments_admin_read" on public.apartments;
create policy "apartments_admin_read"
  on public.apartments
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "apartments_admin_write_insert" on public.apartments;
create policy "apartments_admin_write_insert"
  on public.apartments
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "apartments_admin_write_update" on public.apartments;
create policy "apartments_admin_write_update"
  on public.apartments
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "apartments_admin_write_delete" on public.apartments;
create policy "apartments_admin_write_delete"
  on public.apartments
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 2. restaurants
-- -----------------------------------------------------------------------------
-- Public visibility requires both `published_at is not null` AND
-- `deleted_at is null` (soft-delete filter). Admins see everything.

alter table public.restaurants enable row level security;

drop policy if exists "restaurants_anon_read_published" on public.restaurants;
create policy "restaurants_anon_read_published"
  on public.restaurants
  for select
  to anon, authenticated
  using (published_at is not null and deleted_at is null);

drop policy if exists "restaurants_admin_read" on public.restaurants;
create policy "restaurants_admin_read"
  on public.restaurants
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "restaurants_admin_write_insert" on public.restaurants;
create policy "restaurants_admin_write_insert"
  on public.restaurants
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "restaurants_admin_write_update" on public.restaurants;
create policy "restaurants_admin_write_update"
  on public.restaurants
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "restaurants_admin_write_delete" on public.restaurants;
create policy "restaurants_admin_write_delete"
  on public.restaurants
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 3. attractions
-- -----------------------------------------------------------------------------
-- Same pattern as restaurants: published + not soft-deleted for anon, full
-- visibility for admins, admin-only writes.

alter table public.attractions enable row level security;

drop policy if exists "attractions_anon_read_published" on public.attractions;
create policy "attractions_anon_read_published"
  on public.attractions
  for select
  to anon, authenticated
  using (published_at is not null and deleted_at is null);

drop policy if exists "attractions_admin_read" on public.attractions;
create policy "attractions_admin_read"
  on public.attractions
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "attractions_admin_write_insert" on public.attractions;
create policy "attractions_admin_write_insert"
  on public.attractions
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "attractions_admin_write_update" on public.attractions;
create policy "attractions_admin_write_update"
  on public.attractions
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "attractions_admin_write_delete" on public.attractions;
create policy "attractions_admin_write_delete"
  on public.attractions
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 4. gallery_photos
-- -----------------------------------------------------------------------------
-- Anon SELECT is unconditional. The polymorphic FK guarantees a gallery
-- photo always points at exactly one of (apartment_id, restaurant_id,
-- attraction_id). Photos belonging to an unpublished or soft-deleted parent
-- ARE technically returned by RLS here, but the public app never queries
-- them in isolation: it always joins through the parent row, which is
-- itself filtered by its own RLS policy. Adding a parent-aware predicate
-- would require a per-row subquery on every read; we accept the small
-- residual exposure (a stable `storage_path` string) in exchange for a
-- much simpler, faster index path.

alter table public.gallery_photos enable row level security;

drop policy if exists "gallery_photos_anon_read" on public.gallery_photos;
create policy "gallery_photos_anon_read"
  on public.gallery_photos
  for select
  to anon, authenticated
  using (true);

drop policy if exists "gallery_photos_admin_write_insert" on public.gallery_photos;
create policy "gallery_photos_admin_write_insert"
  on public.gallery_photos
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "gallery_photos_admin_write_update" on public.gallery_photos;
create policy "gallery_photos_admin_write_update"
  on public.gallery_photos
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "gallery_photos_admin_write_delete" on public.gallery_photos;
create policy "gallery_photos_admin_write_delete"
  on public.gallery_photos
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 5. booking_inquiries
-- -----------------------------------------------------------------------------
-- Carries Guest_Contributor PII (Wymaganie 42 #1). NO anon policy of any
-- kind: anonymous clients have zero visibility into this table via the REST
-- API. The public POST flow (`POST /api/booking-inquiries`, task 5.2) goes
-- through a rate-limited route handler that uses `service_role`, which
-- bypasses RLS — that is the only legitimate write path for anon users.
-- Anonymous availability reads use the `get_availability` RPC, which never
-- exposes guest PII.

alter table public.booking_inquiries enable row level security;

drop policy if exists "booking_inquiries_admin_read" on public.booking_inquiries;
create policy "booking_inquiries_admin_read"
  on public.booking_inquiries
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "booking_inquiries_admin_write_insert" on public.booking_inquiries;
create policy "booking_inquiries_admin_write_insert"
  on public.booking_inquiries
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "booking_inquiries_admin_write_update" on public.booking_inquiries;
create policy "booking_inquiries_admin_write_update"
  on public.booking_inquiries
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "booking_inquiries_admin_write_delete" on public.booking_inquiries;
create policy "booking_inquiries_admin_write_delete"
  on public.booking_inquiries
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 6. reservations
-- -----------------------------------------------------------------------------
-- Same privacy posture as `booking_inquiries`: NO anon policy. Reservations
-- carry the booking inquiry FK plus admin notes; nothing in this table is
-- ever exposed to anon. The public availability calendar reads aggregate
-- day-status only, via `get_availability`.

alter table public.reservations enable row level security;

drop policy if exists "reservations_admin_read" on public.reservations;
create policy "reservations_admin_read"
  on public.reservations
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "reservations_admin_write_insert" on public.reservations;
create policy "reservations_admin_write_insert"
  on public.reservations
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "reservations_admin_write_update" on public.reservations;
create policy "reservations_admin_write_update"
  on public.reservations
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "reservations_admin_write_delete" on public.reservations;
create policy "reservations_admin_write_delete"
  on public.reservations
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 7. calendar_blocks
-- -----------------------------------------------------------------------------
-- Manual admin blocks (maintenance, owner stays, cleaning). NO anon policy.
-- Anonymous clients only see the aggregate `blocked` status via
-- `get_availability`; they never see the reason text or the admin note.

alter table public.calendar_blocks enable row level security;

drop policy if exists "calendar_blocks_admin_read" on public.calendar_blocks;
create policy "calendar_blocks_admin_read"
  on public.calendar_blocks
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "calendar_blocks_admin_write_insert" on public.calendar_blocks;
create policy "calendar_blocks_admin_write_insert"
  on public.calendar_blocks
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "calendar_blocks_admin_write_update" on public.calendar_blocks;
create policy "calendar_blocks_admin_write_update"
  on public.calendar_blocks
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "calendar_blocks_admin_write_delete" on public.calendar_blocks;
create policy "calendar_blocks_admin_write_delete"
  on public.calendar_blocks
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 8. reviews
-- -----------------------------------------------------------------------------
-- Anon SELECT is restricted to moderated `approved` rows (Wymaganie 38 #3).
-- Pending / rejected / hidden rows are visible to admins only. Public POST
-- (`POST /api/reviews`, task 5.3) goes through a rate-limited route handler
-- that uses `service_role` and bypasses RLS — we deliberately do NOT add
-- an anon INSERT policy, so a direct anon REST insert from the browser is
-- rejected.

alter table public.reviews enable row level security;

drop policy if exists "reviews_anon_read_approved" on public.reviews;
create policy "reviews_anon_read_approved"
  on public.reviews
  for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "reviews_admin_read" on public.reviews;
create policy "reviews_admin_read"
  on public.reviews
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "reviews_admin_write_insert" on public.reviews;
create policy "reviews_admin_write_insert"
  on public.reviews
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "reviews_admin_write_update" on public.reviews;
create policy "reviews_admin_write_update"
  on public.reviews
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "reviews_admin_write_delete" on public.reviews;
create policy "reviews_admin_write_delete"
  on public.reviews
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 9. guest_photos
-- -----------------------------------------------------------------------------
-- Same posture as `reviews`: anon SELECT is restricted to `approved`. Public
-- POST (`POST /api/guest-photos`, task 5.3) goes through a rate-limited
-- route handler with `service_role` — no anon INSERT policy.

alter table public.guest_photos enable row level security;

drop policy if exists "guest_photos_anon_read_approved" on public.guest_photos;
create policy "guest_photos_anon_read_approved"
  on public.guest_photos
  for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "guest_photos_admin_read" on public.guest_photos;
create policy "guest_photos_admin_read"
  on public.guest_photos
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "guest_photos_admin_write_insert" on public.guest_photos;
create policy "guest_photos_admin_write_insert"
  on public.guest_photos
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "guest_photos_admin_write_update" on public.guest_photos;
create policy "guest_photos_admin_write_update"
  on public.guest_photos
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "guest_photos_admin_write_delete" on public.guest_photos;
create policy "guest_photos_admin_write_delete"
  on public.guest_photos
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 10. rome_itinerary
-- -----------------------------------------------------------------------------
-- One-day curated walk through Rome. Anon visibility requires
-- `published_at is not null`; admins see drafts.

alter table public.rome_itinerary enable row level security;

drop policy if exists "rome_itinerary_anon_read_published" on public.rome_itinerary;
create policy "rome_itinerary_anon_read_published"
  on public.rome_itinerary
  for select
  to anon, authenticated
  using (published_at is not null);

drop policy if exists "rome_itinerary_admin_read" on public.rome_itinerary;
create policy "rome_itinerary_admin_read"
  on public.rome_itinerary
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "rome_itinerary_admin_write_insert" on public.rome_itinerary;
create policy "rome_itinerary_admin_write_insert"
  on public.rome_itinerary
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "rome_itinerary_admin_write_update" on public.rome_itinerary;
create policy "rome_itinerary_admin_write_update"
  on public.rome_itinerary
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "rome_itinerary_admin_write_delete" on public.rome_itinerary;
create policy "rome_itinerary_admin_write_delete"
  on public.rome_itinerary
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 11. rome_info_sections
-- -----------------------------------------------------------------------------
-- Five fixed slots (one per `rome_info_kind`). Same publish gate as
-- `rome_itinerary`.

alter table public.rome_info_sections enable row level security;

drop policy if exists "rome_info_sections_anon_read_published" on public.rome_info_sections;
create policy "rome_info_sections_anon_read_published"
  on public.rome_info_sections
  for select
  to anon, authenticated
  using (published_at is not null);

drop policy if exists "rome_info_sections_admin_read" on public.rome_info_sections;
create policy "rome_info_sections_admin_read"
  on public.rome_info_sections
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "rome_info_sections_admin_write_insert" on public.rome_info_sections;
create policy "rome_info_sections_admin_write_insert"
  on public.rome_info_sections
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "rome_info_sections_admin_write_update" on public.rome_info_sections;
create policy "rome_info_sections_admin_write_update"
  on public.rome_info_sections
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "rome_info_sections_admin_write_delete" on public.rome_info_sections;
create policy "rome_info_sections_admin_write_delete"
  on public.rome_info_sections
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 12. travel_info
-- -----------------------------------------------------------------------------
-- Practical travel info shown on `/useful-info`. Same publish gate.

alter table public.travel_info enable row level security;

drop policy if exists "travel_info_anon_read_published" on public.travel_info;
create policy "travel_info_anon_read_published"
  on public.travel_info
  for select
  to anon, authenticated
  using (published_at is not null);

drop policy if exists "travel_info_admin_read" on public.travel_info;
create policy "travel_info_admin_read"
  on public.travel_info
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "travel_info_admin_write_insert" on public.travel_info;
create policy "travel_info_admin_write_insert"
  on public.travel_info
  for insert
  to authenticated
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "travel_info_admin_write_update" on public.travel_info;
create policy "travel_info_admin_write_update"
  on public.travel_info
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));

drop policy if exists "travel_info_admin_write_delete" on public.travel_info;
create policy "travel_info_admin_write_delete"
  on public.travel_info
  for delete
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 13. site_settings
-- -----------------------------------------------------------------------------
-- Singleton row. Always public — used by the site header, footer, and
-- privacy page. The CHECK constraint in `schema.sql` (`id = 1`) plus the
-- `smallint primary key` already guarantees there can be at most one row,
-- so we expose UPDATE only. The very first INSERT is performed by
-- `seed.sql` running as `service_role`, which bypasses RLS — no INSERT
-- policy is needed at the row-level here. DELETE is intentionally not
-- exposed; the singleton row is never removed.

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_anon_read" on public.site_settings;
create policy "site_settings_anon_read"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "site_settings_admin_write_update" on public.site_settings;
create policy "site_settings_admin_write_update"
  on public.site_settings
  for update
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users))
  with check ((select auth.uid()) in (select user_id from public.admin_users));


-- -----------------------------------------------------------------------------
-- 14. admin_users
-- -----------------------------------------------------------------------------
-- The membership table for admin privileges. NO anon policy of any kind:
-- anonymous clients must not learn who is an admin. Authenticated admins
-- can read the table (so the admin layout can list other admins if we ever
-- want that UI). INSERT / UPDATE / DELETE are intentionally not exposed
-- via RLS — managing admin membership is a one-off operation done from
-- Supabase Studio or a script using the `service_role` key.

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_admin_read" on public.admin_users;
create policy "admin_users_admin_read"
  on public.admin_users
  for select
  to authenticated
  using ((select auth.uid()) in (select user_id from public.admin_users));


-- =============================================================================
-- Sanity assertions (documentation only — no runtime checks)
-- =============================================================================
--
-- Per Wymaganie 42, the following invariants MUST hold after this file runs:
--
--   * `booking_inquiries`, `reservations`, `calendar_blocks`, `admin_users`
--     have ZERO `to anon` policies. An anonymous SELECT on any of these
--     tables returns 0 rows.
--   * `reviews` and `guest_photos` are visible to anon ONLY when
--     `status = 'approved'`. Pending, rejected, or hidden rows are
--     invisible to anon.
--   * `restaurants` and `attractions` are visible to anon ONLY when
--     `published_at is not null AND deleted_at is null`. Drafts and
--     soft-deleted rows are invisible to anon.
--   * `apartments`, `rome_itinerary`, `rome_info_sections`, `travel_info`
--     are visible to anon ONLY when `published_at is not null`. Drafts
--     are invisible to anon.
--   * `gallery_photos` and `site_settings` are unconditionally visible
--     to anon.
--   * Every admin write predicate is the same:
--     `(select auth.uid()) in (select user_id from public.admin_users)`.
--   * Every admin write policy is scoped to `to authenticated`. No anon
--     write policy exists on any table.
--   * Public POST endpoints (`booking_inquiries`, `reviews`, `guest_photos`)
--     are reachable only via the rate-limited route handlers using
--     `service_role`. No anon INSERT policy exists on any table.
--
-- A manual smoke test for these assertions is the responsibility of
-- task 19.2 ("Sprawdzenie RLS na wszystkich tabelach").
--
-- End of rls.sql.
-- =============================================================================
