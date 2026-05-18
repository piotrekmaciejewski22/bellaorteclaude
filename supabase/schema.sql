-- =============================================================================
-- BELLAORTE — Supabase Postgres schema
-- =============================================================================
--
-- Purpose:
--   This file defines the canonical database schema for the BELLAORTE MVP.
--   It MUST round-trip cleanly to the TypeScript domain shapes declared in
--   `src/lib/types.ts`. Snake_case columns here map 1:1 (camelCase) to those
--   shapes; nullability and enum value sets are kept identical on both sides.
--
-- Deployment order (paste each file into the Supabase SQL editor, or run
-- them in this order with `supabase db push`):
--   1. supabase/schema.sql   ← this file: extensions, enums, tables,
--                              indexes, CHECK / EXCLUDE constraints,
--                              shared `set_updated_at()` trigger,
--                              `get_availability()` RPC.
--   2. supabase/rls.sql      ← `enable row level security` plus all
--                              per-table policies for `anon` and
--                              `authenticated` (task 2.3).
--   3. supabase/storage.sql  ← buckets `site-media`, `guest-media` and
--                              their access policies (task 2.4).
--   4. supabase/seed.sql     ← demo data: two apartments, restaurants,
--                              attractions, etc. (task 2.5).
--
-- NOT included in this file (created by later tasks):
--   * RLS policies for every table — see `supabase/rls.sql` (task 2.3).
--   * Storage buckets and their policies — see `supabase/storage.sql`
--     (task 2.4).
--   * Any seed data — see `supabase/seed.sql` (task 2.5).
--
-- Idempotency:
--   Where reasonable, statements are written so the file can be re-run
--   safely (`create extension if not exists`, `create table if not exists`,
--   defensive `do $$ ... exception when duplicate_object then null; end $$`
--   blocks for `create type`).
--
-- Privacy / Wymaganie 42:
--   Tables `booking_inquiries`, `reservations`, `calendar_blocks`,
--   `reviews.source_ip`, `guest_photos.source_ip` carry data that MUST
--   never be exposed to anonymous clients. Public reads of these columns
--   are blocked by RLS (task 2.3); the public availability view is served
--   exclusively through the `get_availability` RPC (task 2.2).
--
-- Wymagania pokryte: 30, 40, 41, 42, 48.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Extensions
-- -----------------------------------------------------------------------------
-- pgcrypto provides `gen_random_uuid()` for primary keys.
-- btree_gist lets the EXCLUDE constraint on `reservations` mix `=` (uuid)
-- with `&&` (daterange) operators in a single GiST index.
create extension if not exists pgcrypto;
create extension if not exists btree_gist;


-- -----------------------------------------------------------------------------
-- 2. Enum types
-- -----------------------------------------------------------------------------
-- Enum value sets MUST stay identical to the string-literal unions in
-- `src/lib/types.ts`. The defensive do-block pattern keeps this file
-- re-runnable without dropping types (which would cascade to columns).

do $$ begin
  create type inquiry_status as enum ('pending','confirmed','rejected','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reservation_status as enum ('active','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type block_reason as enum ('maintenance','owner_stay','cleaning','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type region_kind as enum ('orte_area','rome');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_status as enum ('pending','approved','rejected','hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type day_part as enum ('morning','noon','afternoon','evening');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rome_info_kind as enum (
    'transfer_from_orte','public_transport','tickets','safety','opening_hours'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type travel_info_kind as enum (
    'car_rental','rome_transfer','trains','travel_directions'
  );
exception when duplicate_object then null; end $$;

-- `source_kind` is modelled as a true enum rather than a free-form text
-- column with a CHECK constraint. The enum domain itself satisfies the
-- five-value restriction required by Wymaganie 40 #3, with a cleaner
-- typing story on the TS side (`SourceKind` in `src/lib/types.ts`).
do $$ begin
  create type source_kind as enum (
    'placeholder_orte','placeholder_italy','placeholder_rome','interior_real','exterior_real'
  );
exception when duplicate_object then null; end $$;


-- -----------------------------------------------------------------------------
-- 3. Shared trigger function: set_updated_at()
-- -----------------------------------------------------------------------------
-- Every table that has an `updated_at` column gets a `before update` trigger
-- pointing at this function. Tables without `updated_at` (gallery_photos,
-- admin_users) deliberately skip the trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- 4. Tables
-- -----------------------------------------------------------------------------
-- Created in FK-dependency order:
--   apartments, restaurants, attractions
--     → gallery_photos (references all three)
--   apartments
--     → booking_inquiries → reservations
--     → calendar_blocks
--   restaurants, attractions
--     → reviews → guest_photos
--   restaurants, attractions
--     → rome_itinerary
--   rome_info_sections, travel_info, site_settings, admin_users (no FKs out)
-- -----------------------------------------------------------------------------


-- 4.1 apartments
-- The MVP keeps the row count locked at exactly two; the cap is enforced
-- in the admin route handlers (Wymaganie 28 #6, task 14.6) rather than at
-- the schema level so seeds and tests can still insert freely.
create table if not exists public.apartments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  max_guests int not null check (max_guests >= 1),
  bedrooms int not null check (bedrooms >= 0),
  bathrooms int not null check (bathrooms >= 0),
  amenities text[] not null default '{}',
  house_rules text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint apartments_slug_kebab_case
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

drop trigger if exists set_updated_at on public.apartments;
create trigger set_updated_at
  before update on public.apartments
  for each row execute function public.set_updated_at();


-- 4.2 restaurants
-- Soft-delete via `deleted_at`; public reads (task 2.3) filter
-- WHERE deleted_at IS NULL AND published_at IS NOT NULL.
-- Map_Data: address + (place_id OR latitude+longitude). Validation lives
-- in the admin route handler (task 3.4 / 16.1) per Wymaganie 41 #1.
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  region region_kind not null,
  cuisine_categories text[] not null default '{}',
  tags text[] not null default '{}',
  opening_hours text,
  phone text,
  website text,
  tip_for_guest text,
  address text,
  place_id text,
  latitude double precision,
  longitude double precision,
  maps_url text,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurants_slug_kebab_case
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists restaurants_region_idx
  on public.restaurants (region) where deleted_at is null;
create index if not exists restaurants_published_at_idx
  on public.restaurants (published_at) where deleted_at is null;

drop trigger if exists set_updated_at on public.restaurants;
create trigger set_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();


-- 4.3 attractions
-- Same shape pattern as restaurants but tailored to sightseeing places:
-- no cuisine/opening hours/phone/website/tip_for_guest; instead
-- `practical_info` and `travel_info` text blocks.
create table if not exists public.attractions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  region region_kind not null,
  tags text[] not null default '{}',
  practical_info text,
  travel_info text,
  address text,
  place_id text,
  latitude double precision,
  longitude double precision,
  maps_url text,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attractions_slug_kebab_case
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists attractions_region_idx
  on public.attractions (region) where deleted_at is null;
create index if not exists attractions_published_at_idx
  on public.attractions (published_at) where deleted_at is null;

drop trigger if exists set_updated_at on public.attractions;
create trigger set_updated_at
  before update on public.attractions
  for each row execute function public.set_updated_at();


-- 4.4 gallery_photos
-- Polymorphic link: exactly one of (apartment_id, restaurant_id,
-- attraction_id) is non-null. The CHECK constraint at the bottom enforces
-- that invariant. `source_kind` uses the enum type defined above; the
-- enum's value set IS the Wymaganie 40 #3 whitelist.
-- No `updated_at` per the TS contract (`GalleryPhoto` in types.ts).
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid references public.apartments(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  attraction_id uuid references public.attractions(id) on delete cascade,
  storage_path text not null,
  alt text not null default '',
  source_kind source_kind not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint gallery_photos_exactly_one_target
    check (
      (apartment_id is not null)::int
      + (restaurant_id is not null)::int
      + (attraction_id is not null)::int
      = 1
    )
);

create index if not exists gallery_photos_apartment_idx
  on public.gallery_photos (apartment_id, display_order)
  where apartment_id is not null;
create index if not exists gallery_photos_restaurant_idx
  on public.gallery_photos (restaurant_id, display_order)
  where restaurant_id is not null;
create index if not exists gallery_photos_attraction_idx
  on public.gallery_photos (attraction_id, display_order)
  where attraction_id is not null;


-- 4.5 booking_inquiries
-- Holds Guest_Contributor PII. Access is RLS-locked to admins (task 2.3);
-- the public availability calendar reads only an aggregate status via the
-- `get_availability` RPC (task 2.2). The partial GiST index on
-- `daterange(check_in, check_out, '[)')` accelerates the pending-overlap
-- lookup that the RPC performs for every Apartment_Detail render.
create table if not exists public.booking_inquiries (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments(id),
  check_in date not null,
  check_out date not null,
  adults int not null check (adults >= 1),
  children int not null default 0 check (children >= 0),
  guest_full_name text not null,
  guest_email text not null,
  guest_phone text,
  message text,
  consent_at timestamptz not null,
  status inquiry_status not null default 'pending',
  source_ip text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_inquiries_check_out_after_check_in
    check (check_out > check_in)
);

create index if not exists booking_inquiries_apartment_dates_idx
  on public.booking_inquiries (apartment_id, check_in, check_out);
create index if not exists booking_inquiries_status_idx
  on public.booking_inquiries (status);
create index if not exists booking_inquiries_pending_range_idx
  on public.booking_inquiries
  using gist (apartment_id, daterange(check_in, check_out, '[)'))
  where status = 'pending';

drop trigger if exists set_updated_at on public.booking_inquiries;
create trigger set_updated_at
  before update on public.booking_inquiries
  for each row execute function public.set_updated_at();

comment on table public.booking_inquiries is
  'Booking inquiries submitted by Guest_Contributor. Carries PII; '
  'public reads are forbidden (Wymaganie 42). Aggregate availability is '
  'served via the `get_availability` RPC.';
comment on column public.booking_inquiries.guest_full_name is
  'Guest PII. MUST never be returned to anon clients (Wymaganie 42).';
comment on column public.booking_inquiries.guest_email is
  'Guest PII. MUST never be returned to anon clients (Wymaganie 42).';
comment on column public.booking_inquiries.guest_phone is
  'Guest PII. MUST never be returned to anon clients (Wymaganie 42).';
comment on column public.booking_inquiries.message is
  'Free-form guest message. MUST never be returned to anon clients (Wymaganie 42).';
comment on column public.booking_inquiries.source_ip is
  'IP address captured for rate limiting / abuse detection. MUST never '
  'be returned to anon clients.';


-- 4.6 reservations
-- The half-open daterange `[check_in, check_out)` mirrors the booking
-- inquiry shape so an overlap can be detected with a single
-- `daterange && daterange` test. The EXCLUDE constraint guarantees that
-- two ACTIVE reservations on the same apartment can never share a day —
-- this is the database-level back-stop for the admin "Confirm" flow
-- (Wymaganie 30 #5, #6).
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments(id),
  inquiry_id uuid references public.booking_inquiries(id) on delete set null,
  check_in date not null,
  check_out date not null,
  status reservation_status not null default 'active',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_check_out_after_check_in
    check (check_out > check_in),
  constraint reservations_no_active_overlap
    exclude using gist (
      apartment_id with =,
      daterange(check_in, check_out, '[)') with &&
    ) where (status = 'active')
);

create index if not exists reservations_apartment_dates_idx
  on public.reservations (apartment_id, check_in, check_out);
create index if not exists reservations_status_idx
  on public.reservations (status);

drop trigger if exists set_updated_at on public.reservations;
create trigger set_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();


-- 4.7 calendar_blocks
-- Manual admin blocks (maintenance, owner stays, cleaning). The
-- `start_date`/`end_date` naming is intentional and matches the TS
-- contract (`CalendarBlock` in types.ts). Public reads are RLS-blocked;
-- the `get_availability` RPC reads this table as `blocked` days.
create table if not exists public.calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason block_reason not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_blocks_end_after_start
    check (end_date > start_date)
);

create index if not exists calendar_blocks_apartment_dates_idx
  on public.calendar_blocks (apartment_id, start_date, end_date);
create index if not exists calendar_blocks_range_idx
  on public.calendar_blocks
  using gist (daterange(start_date, end_date, '[)'));

drop trigger if exists set_updated_at on public.calendar_blocks;
create trigger set_updated_at
  before update on public.calendar_blocks
  for each row execute function public.set_updated_at();


-- 4.8 reviews
-- Polymorphic link to either a restaurant or an attraction (exactly one).
-- `signature` is the only piece of guest identity that is ever shown
-- publicly (Wymaganie 42 #3); `source_ip` is private and used for
-- rate-limit / abuse review only.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  attraction_id uuid references public.attractions(id) on delete cascade,
  signature text not null check (char_length(signature) between 2 and 60),
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 1000),
  status moderation_status not null default 'pending',
  consent_at timestamptz not null,
  source_ip text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_exactly_one_target
    check (
      (restaurant_id is not null)::int
      + (attraction_id is not null)::int
      = 1
    )
);

create index if not exists reviews_restaurant_status_idx
  on public.reviews (restaurant_id, status);
create index if not exists reviews_attraction_status_idx
  on public.reviews (attraction_id, status);

drop trigger if exists set_updated_at on public.reviews;
create trigger set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

comment on column public.reviews.source_ip is
  'IP address captured for rate limiting / abuse detection. MUST never '
  'be returned to anon clients (Wymaganie 42).';


-- 4.9 guest_photos
-- Same polymorphic pattern as reviews. Storage path lives in the
-- non-public bucket `guest-media`; public consumers only see the photo
-- through a signed URL once it has been moderated to status='approved'.
-- The size cap (8 MiB) matches the application-side `MAX_PHOTO_BYTES`
-- in `src/lib/constants.ts` so the UI and the DB stay in sync.
create table if not exists public.guest_photos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  attraction_id uuid references public.attractions(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 8 * 1024 * 1024),
  status moderation_status not null default 'pending',
  consent_at timestamptz not null,
  source_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_photos_exactly_one_target
    check (
      (restaurant_id is not null)::int
      + (attraction_id is not null)::int
      = 1
    )
);

create index if not exists guest_photos_restaurant_status_idx
  on public.guest_photos (restaurant_id, status);
create index if not exists guest_photos_attraction_status_idx
  on public.guest_photos (attraction_id, status);

drop trigger if exists set_updated_at on public.guest_photos;
create trigger set_updated_at
  before update on public.guest_photos
  for each row execute function public.set_updated_at();

comment on column public.guest_photos.source_ip is
  'IP address captured for rate limiting / abuse detection. MUST never '
  'be returned to anon clients (Wymaganie 42).';


-- 4.10 rome_itinerary
-- One-day curated walk through Rome, four buckets (morning / noon /
-- afternoon / evening). Items can optionally link to a restaurant or
-- attraction so the public page can render a `MapEmbed`. ON DELETE SET
-- NULL keeps itinerary points alive even if the linked place is later
-- soft-deleted — the UI shows the point without a map link.
create table if not exists public.rome_itinerary (
  id uuid primary key default gen_random_uuid(),
  day_part day_part not null,
  title text not null,
  body text not null default '',
  linked_restaurant_id uuid references public.restaurants(id) on delete set null,
  linked_attraction_id uuid references public.attractions(id) on delete set null,
  display_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rome_itinerary_day_part_order_idx
  on public.rome_itinerary (day_part, display_order);

drop trigger if exists set_updated_at on public.rome_itinerary;
create trigger set_updated_at
  before update on public.rome_itinerary
  for each row execute function public.set_updated_at();


-- 4.11 rome_info_sections
-- Five fixed slots (one per `rome_info_kind` value). The UNIQUE on
-- `kind` enforces "exactly one row per kind"; the admin UI edits these
-- in place rather than supporting a free list.
create table if not exists public.rome_info_sections (
  id uuid primary key default gen_random_uuid(),
  kind rome_info_kind not null unique,
  title text not null,
  body text not null default '',
  display_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.rome_info_sections;
create trigger set_updated_at
  before update on public.rome_info_sections
  for each row execute function public.set_updated_at();


-- 4.12 travel_info
-- Practical travel info shown on `/useful-info`. `external_links` is a
-- JSONB array of `{ "label": text, "url": text }` objects; we keep the
-- shape loose at the schema level and validate it in the admin route
-- handler (task 16.4) so seed/CMS can grow without a migration.
create table if not exists public.travel_info (
  id uuid primary key default gen_random_uuid(),
  kind travel_info_kind not null,
  title text not null,
  body text not null default '',
  external_links jsonb not null default '[]'::jsonb,
  display_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists travel_info_kind_order_idx
  on public.travel_info (kind, display_order);

drop trigger if exists set_updated_at on public.travel_info;
create trigger set_updated_at
  before update on public.travel_info
  for each row execute function public.set_updated_at();


-- 4.13 site_settings
-- Singleton row. The `check (id = 1)` plus `smallint primary key`
-- guarantees there can never be more than one row. There is no
-- `created_at` (per the TS contract — `SiteSettings` has only
-- `updatedAt`); a single trigger keeps `updated_at` honest.
create table if not exists public.site_settings (
  id smallint primary key check (id = 1),
  contact_email text not null,
  contact_phone text,
  footer_address text not null default '',
  privacy_policy_md text not null default '',
  consent_text_booking text not null default '',
  consent_text_review text not null default '',
  consent_text_photo text not null default '',
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.site_settings;
create trigger set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();


-- 4.14 admin_users
-- A `user_id` present in this table grants admin privileges. The FK to
-- `auth.users(id)` ensures the row is removed automatically if the
-- Supabase auth user is deleted. No `updated_at` per the TS contract.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- 5. RPC: public.get_availability(p_apartment_id, p_from, p_to)
-- -----------------------------------------------------------------------------
-- This is the ONE and ONLY public read path that touches the privacy-sensitive
-- tables `calendar_blocks`, `reservations`, and `booking_inquiries`. Anonymous
-- clients have no SELECT grant on those tables (RLS, task 2.3); they reach
-- their day-level aggregate exclusively through this function.
--
-- What it returns:
--   For every date d in the inclusive window [p_from, p_to], one row
--   `(date d, status text)` where `status` is the highest-priority Calendar_Status
--   that applies on d, with the priority order:
--       blocked  >  reserved  >  pending  >  available
--   (Wymagania 7 #4–#7 and Wymaganie 8 #4–#5.)
--
-- Why `status text` and not an enum:
--   The four DayStatus values mix two different DB enum domains
--   (`reservation_status` covers `active|cancelled`, `inquiry_status` covers
--   `pending|confirmed|rejected|cancelled`) plus two pure UI strings
--   (`blocked`, `available`). No single enum holds all four, so the function
--   returns plain `text`. The TypeScript side narrows it to the
--   `DayStatus = 'available' | 'pending' | 'reserved' | 'blocked'` union in
--   `src/lib/types.ts`.
--
-- Half-open semantic:
--   `reservations` and `calendar_blocks` (and `booking_inquiries`) all model
--   their date ranges as `[check_in, check_out)` — check-in inclusive,
--   check-out exclusive. A reservation 2024-09-01 → 2024-09-05 covers
--   Sept 1, 2, 3, 4 only. The CTE joins reproduce that exactly with
--   `d >= start AND d < end`.
--
-- Privacy invariant (Wymaganie 42):
--   The function returns ONLY the aggregate day status. No guest name, email,
--   phone, message, IP, inquiry id, or reservation id ever leaves this
--   function. It is the data source for `GET /api/availability` (task 5.1)
--   and the public Availability_Calendar (task 7.x).
--
-- Wymagania pokryte: 7 (#1, #4–#7), 8 (priorytet blocked > reserved > pending),
-- 42 (#1, #2 — public read of calendar without PII).
-- -----------------------------------------------------------------------------

create or replace function public.get_availability(
  p_apartment_id uuid,
  p_from date,
  p_to date
)
returns table (date date, status text)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  -- Input validation. These guards are intentionally strict: the function
  -- is reachable by anonymous clients and an unbounded date window would
  -- materialise an arbitrarily large `generate_series`.
  if p_apartment_id is null then
    raise exception 'p_apartment_id must not be null';
  end if;
  if p_from is null or p_to is null then
    raise exception 'p_from and p_to must not be null';
  end if;
  if p_from > p_to then
    raise exception 'p_from must be <= p_to';
  end if;
  if (p_to - p_from) > 366 then
    raise exception 'window too large: (p_to - p_from) must be <= 366 days';
  end if;

  return query
  with days as (
    select generate_series(p_from, p_to, interval '1 day')::date as d
  ),
  blocked_days as (
    select days.d
    from days
    join public.calendar_blocks cb
      on cb.apartment_id = p_apartment_id
     and days.d >= cb.start_date
     and days.d <  cb.end_date
  ),
  reserved_days as (
    select days.d
    from days
    join public.reservations r
      on r.apartment_id = p_apartment_id
     and r.status = 'active'
     and days.d >= r.check_in
     and days.d <  r.check_out
  ),
  pending_days as (
    select days.d
    from days
    join public.booking_inquiries bi
      on bi.apartment_id = p_apartment_id
     and bi.status = 'pending'
     and days.d >= bi.check_in
     and days.d <  bi.check_out
  )
  select
    days.d as date,
    case
      when days.d in (select d from blocked_days)  then 'blocked'
      when days.d in (select d from reserved_days) then 'reserved'
      when days.d in (select d from pending_days)  then 'pending'
      else 'available'
    end as status
  from days
  order by days.d;
end;
$$;

comment on function public.get_availability(uuid, date, date) is
  'Returns one row per date in the inclusive window [p_from, p_to] with the '
  'highest-priority Calendar_Status (blocked > reserved > pending > available). '
  'Sole public read path for `calendar_blocks`, `reservations`, '
  '`booking_inquiries`. Returns NO guest PII (Wymagania 7, 8, 42).';

-- Lock down the default PUBLIC grant that Postgres adds to every new
-- function, then expose execution explicitly to the two roles that the
-- public site uses (`anon` for unauthenticated visitors, `authenticated`
-- for logged-in admins reaching the same RPC from the admin panel).
revoke all on function public.get_availability(uuid, date, date) from public;
grant execute on function public.get_availability(uuid, date, date) to anon, authenticated;


-- =============================================================================
-- End of schema.sql.
--
-- Next steps:
--   * Task 2.3 — `supabase/rls.sql`: enable RLS and add policies (DONE).
--   * Task 2.4 — `supabase/storage.sql`: storage buckets and policies.
--   * Task 2.5 — `supabase/seed.sql`: seed data.
-- =============================================================================
