-- =============================================================================
-- BELLAORTE — Fala 1 migration
-- =============================================================================
--
-- Dodaje:
--   1. site_settings.hero_image_path        — zdjęcie w tle hero strony głównej
--   2. blog_posts                            — wpisy blogowe
--   3. blog_comments                         — komentarze pod wpisami z moderacją
--   4. community_photos                      — galeria "Wasze zdjęcia"
--
-- Plik jest idempotentny — re-run jest bezpieczny.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Hero image path w site_settings
-- ---------------------------------------------------------------------------
alter table public.site_settings
  add column if not exists hero_image_path text;

comment on column public.site_settings.hero_image_path is
  'Storage path do bucketa site-media z obrazem hero (np. site/hero/abc.jpg). '
  'Public CDN URL = NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/public/site-media/<path>. '
  'NULL = użyj placeholdera /placeholders/hero.svg.';


-- ---------------------------------------------------------------------------
-- 2. blog_posts
-- ---------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    constraint blog_posts_slug_kebab_case
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  excerpt text not null default '',
  body_md text not null default '',
  hero_image_path text,
  author_signature text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published_at desc) where published_at is not null;

drop trigger if exists set_updated_at on public.blog_posts;
create trigger set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "blog_posts_anon_read_published" on public.blog_posts;
create policy "blog_posts_anon_read_published"
  on public.blog_posts
  for select
  to anon, authenticated
  using (published_at is not null);

drop policy if exists "blog_posts_admin_read" on public.blog_posts;
create policy "blog_posts_admin_read"
  on public.blog_posts
  for select
  to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "blog_posts_admin_write_insert" on public.blog_posts;
create policy "blog_posts_admin_write_insert"
  on public.blog_posts
  for insert
  to authenticated
  with check (public.is_admin((select auth.uid())));

drop policy if exists "blog_posts_admin_write_update" on public.blog_posts;
create policy "blog_posts_admin_write_update"
  on public.blog_posts
  for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "blog_posts_admin_write_delete" on public.blog_posts;
create policy "blog_posts_admin_write_delete"
  on public.blog_posts
  for delete
  to authenticated
  using (public.is_admin((select auth.uid())));


-- ---------------------------------------------------------------------------
-- 3. blog_comments — moderowane
-- ---------------------------------------------------------------------------
create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  signature text not null,
  body text not null,
  status moderation_status not null default 'pending',
  consent_at timestamptz not null default now(),
  source_ip text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_comments_signature_len check (char_length(signature) between 2 and 60),
  constraint blog_comments_body_len check (char_length(body) between 5 and 2000)
);

create index if not exists blog_comments_post_status_idx
  on public.blog_comments (post_id, status);

drop trigger if exists set_updated_at on public.blog_comments;
create trigger set_updated_at
  before update on public.blog_comments
  for each row execute function public.set_updated_at();

alter table public.blog_comments enable row level security;

drop policy if exists "blog_comments_anon_read_approved" on public.blog_comments;
create policy "blog_comments_anon_read_approved"
  on public.blog_comments
  for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "blog_comments_admin_read" on public.blog_comments;
create policy "blog_comments_admin_read"
  on public.blog_comments
  for select
  to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "blog_comments_admin_write_update" on public.blog_comments;
create policy "blog_comments_admin_write_update"
  on public.blog_comments
  for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "blog_comments_admin_write_delete" on public.blog_comments;
create policy "blog_comments_admin_write_delete"
  on public.blog_comments
  for delete
  to authenticated
  using (public.is_admin((select auth.uid())));

-- Anon INSERT NIE ma policy — public POST flow idzie przez service_role
-- z route handlera (analogicznie do reviews / guest_photos).


-- ---------------------------------------------------------------------------
-- 4. community_photos — galeria "Wasze zdjęcia"
-- ---------------------------------------------------------------------------
create table if not exists public.community_photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  caption text not null default '',
  contributor_name text not null default '',
  location_label text,
  status moderation_status not null default 'pending',
  consent_at timestamptz not null default now(),
  source_ip text,
  admin_note text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_photos_caption_len check (char_length(caption) <= 500),
  constraint community_photos_contributor_len check (char_length(contributor_name) <= 60)
);

create index if not exists community_photos_status_idx
  on public.community_photos (status, created_at desc);

drop trigger if exists set_updated_at on public.community_photos;
create trigger set_updated_at
  before update on public.community_photos
  for each row execute function public.set_updated_at();

alter table public.community_photos enable row level security;

drop policy if exists "community_photos_anon_read_approved" on public.community_photos;
create policy "community_photos_anon_read_approved"
  on public.community_photos
  for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "community_photos_admin_read" on public.community_photos;
create policy "community_photos_admin_read"
  on public.community_photos
  for select
  to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "community_photos_admin_write_update" on public.community_photos;
create policy "community_photos_admin_write_update"
  on public.community_photos
  for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "community_photos_admin_write_delete" on public.community_photos;
create policy "community_photos_admin_write_delete"
  on public.community_photos
  for delete
  to authenticated
  using (public.is_admin((select auth.uid())));


-- =============================================================================
-- Po uruchomieniu sprawdź:
--
--   set local role service_role;
--   select count(*) from public.blog_posts;
--   select count(*) from public.blog_comments;
--   select count(*) from public.community_photos;
--   select hero_image_path from public.site_settings;
--   reset role;
-- =============================================================================
