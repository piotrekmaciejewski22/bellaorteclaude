-- =============================================================================
-- BELLAORTE — Fala 3 migration
-- =============================================================================
--
-- Dodaje:
--   1. faq_items     — sekcja FAQ na /useful-info
--   2. blog_posts.tags  TEXT[] — tagi do filtrowania bloga
--   3. local_services — sklepy/apteki/bankomaty/etc. na /dla-gosci
-- =============================================================================

-- 1. FAQ ----------------------------------------------------------------------

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer_md text not null default '',
  display_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faq_items_published_idx
  on public.faq_items (display_order)
  where published_at is not null;

drop trigger if exists set_updated_at on public.faq_items;
create trigger set_updated_at
  before update on public.faq_items
  for each row execute function public.set_updated_at();

alter table public.faq_items enable row level security;

drop policy if exists "faq_items_anon_read_published" on public.faq_items;
create policy "faq_items_anon_read_published"
  on public.faq_items
  for select
  to anon, authenticated
  using (published_at is not null);

drop policy if exists "faq_items_admin_read" on public.faq_items;
create policy "faq_items_admin_read"
  on public.faq_items
  for select
  to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "faq_items_admin_insert" on public.faq_items;
create policy "faq_items_admin_insert"
  on public.faq_items
  for insert
  to authenticated
  with check (public.is_admin((select auth.uid())));

drop policy if exists "faq_items_admin_update" on public.faq_items;
create policy "faq_items_admin_update"
  on public.faq_items
  for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "faq_items_admin_delete" on public.faq_items;
create policy "faq_items_admin_delete"
  on public.faq_items
  for delete
  to authenticated
  using (public.is_admin((select auth.uid())));


-- 2. Tagi w blogu ---------------------------------------------------------

alter table public.blog_posts
  add column if not exists tags text[] not null default '{}';

create index if not exists blog_posts_tags_idx
  on public.blog_posts using gin (tags);


-- 3. Lokalne usługi (sklepy/apteki/...) ------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'local_service_kind') then
    create type local_service_kind as enum (
      'grocery',
      'pharmacy',
      'atm',
      'transit',
      'laundry',
      'medical',
      'other'
    );
  end if;
end $$;

create table if not exists public.local_services (
  id uuid primary key default gen_random_uuid(),
  kind local_service_kind not null,
  name text not null,
  address text not null default '',
  notes text not null default '',
  hours text,
  walk_minutes int,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  display_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists local_services_kind_idx
  on public.local_services (kind, display_order)
  where published_at is not null;

drop trigger if exists set_updated_at on public.local_services;
create trigger set_updated_at
  before update on public.local_services
  for each row execute function public.set_updated_at();

alter table public.local_services enable row level security;

drop policy if exists "local_services_anon_read_published" on public.local_services;
create policy "local_services_anon_read_published"
  on public.local_services
  for select
  to anon, authenticated
  using (published_at is not null);

drop policy if exists "local_services_admin_read" on public.local_services;
create policy "local_services_admin_read"
  on public.local_services
  for select
  to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "local_services_admin_insert" on public.local_services;
create policy "local_services_admin_insert"
  on public.local_services
  for insert
  to authenticated
  with check (public.is_admin((select auth.uid())));

drop policy if exists "local_services_admin_update" on public.local_services;
create policy "local_services_admin_update"
  on public.local_services
  for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "local_services_admin_delete" on public.local_services;
create policy "local_services_admin_delete"
  on public.local_services
  for delete
  to authenticated
  using (public.is_admin((select auth.uid())));


-- =============================================================================
-- Demo data
-- =============================================================================

-- FAQ: 6 typowych pytań po polsku
insert into public.faq_items (id, question, answer_md, display_order, published_at) values
  (
    'fa111111-1111-4111-8111-111111111101'::uuid,
    'Czy w cenie są ręczniki i pościel?',
    'Tak — komplet pościeli i ręczników (kąpielowy + mały) znajdziesz w szafie. Sprzątanie końcowe również w cenie.',
    1,
    now()
  ),
  (
    'fa111111-1111-4111-8111-111111111102'::uuid,
    'Czy można przyjechać z psem?',
    'W jednym z apartamentów (Casa Orte Uno) goście z małym psem są mile widziani — prosimy zaznaczyć w zapytaniu. Drugi apartament jest bezpieczniejszy dla osób z alergią.',
    2,
    now()
  ),
  (
    'fa111111-1111-4111-8111-111111111103'::uuid,
    'Jak dotrzeć z lotniska Roma Fiumicino?',
    '**Pociągiem (najwygodniej):** Leonardo Express do Roma Termini (32 min, 14€), potem Intercity do Orte (50-60 min, 8-12€).\n\n**Autem:** ok. 90 minut przez A1, parking przy apartamencie bezpłatny.',
    3,
    now()
  ),
  (
    'fa111111-1111-4111-8111-111111111104'::uuid,
    'Czy jest klimatyzacja?',
    'Tak, w obu apartamentach. W lipcu i sierpniu polecamy włączać wieczorem — w nocy zwykle nie jest potrzebna, kamienne mury trzymają chłód.',
    4,
    now()
  ),
  (
    'fa111111-1111-4111-8111-111111111105'::uuid,
    'Jak działa rezerwacja?',
    'Wysyłasz zapytanie przez formularz. Odpowiadamy mailem w ciągu doby z potwierdzeniem terminu i danymi do przelewu. Bez płatności online — wszystko ręcznie.',
    5,
    now()
  ),
  (
    'fa111111-1111-4111-8111-111111111106'::uuid,
    'Co z parkingiem w Orte?',
    'Centrum historyczne Orte to strefa ZTL (zakaz wjazdu dla niemieszkańców). Goście dostają pisemne pozwolenie na wjazd i parkowanie pod apartamentem — wysyłamy wraz z potwierdzeniem rezerwacji.',
    6,
    now()
  )
on conflict (id) do update set
  question = excluded.question,
  answer_md = excluded.answer_md,
  display_order = excluded.display_order,
  published_at = excluded.published_at;


-- Lokalne usługi — 6 punktów dla gości
insert into public.local_services (id, kind, name, address, notes, hours, walk_minutes, latitude, longitude, display_order, published_at) values
  (
    '5e111111-1111-4111-8111-111111111101'::uuid,
    'grocery',
    'Conad — sklep spożywczy',
    'Via Cassia, Orte Scalo',
    'Najbliższy duży sklep — pełen asortyment, świeże pieczywo do 19:00. W niedziele otwarte do 13:00.',
    'Pn-Sb 8:00-20:00, Nd 8:00-13:00',
    null,
    42.4612,
    12.3795,
    1,
    now()
  ),
  (
    '5e111111-1111-4111-8111-111111111102'::uuid,
    'grocery',
    'Alimentari da Bruno',
    'Via Cavour, Orte centrum',
    'Mały sklep w centrum historycznym — świeże produkty lokalne, ser, wino, oliwa z winnic okolicznych. Bruno mówi po angielsku.',
    'Pn-Sb 7:30-13:00 i 16:30-20:00, Nd zamknięte',
    3,
    42.4595,
    12.3851,
    2,
    now()
  ),
  (
    '5e111111-1111-4111-8111-111111111103'::uuid,
    'pharmacy',
    'Farmacia San Faustino',
    'Piazza della Liberta, Orte',
    'Jedyna apteka w centrum. Mówią trochę po angielsku. Na nocne dyżury wskazówki na drzwiach.',
    'Pn-Sb 8:30-13:00 i 16:00-19:30',
    2,
    42.4592,
    12.3849,
    3,
    now()
  ),
  (
    '5e111111-1111-4111-8111-111111111104'::uuid,
    'atm',
    'Bankomat Intesa Sanpaolo',
    'Via Cassia, Orte Scalo',
    'Działa 24/7, akceptuje karty Visa/Mastercard. Bez prowizji dla EUR.',
    '24/7',
    null,
    42.4615,
    12.3792,
    4,
    now()
  ),
  (
    '5e111111-1111-4111-8111-111111111105'::uuid,
    'transit',
    'Stacja kolejowa Orte',
    'Piazza della Stazione, Orte Scalo',
    'Pociągi do Rzymu (60 min) co 30-60 min. Bilety w automacie albo w kiosku obok. Parking 2€/dzień.',
    'Czynna całą dobę, kasa 6:00-21:00',
    null,
    42.4631,
    12.3798,
    5,
    now()
  ),
  (
    '5e111111-1111-4111-8111-111111111106'::uuid,
    'laundry',
    'Lavanderia Self-Service Orte',
    'Via Cassia 142, Orte Scalo',
    'Pranie 4-5€/cykl, suszenie 3€. Gotowe w 90 minut. Akceptują tylko monety — drobne w sklepie obok.',
    'Pn-Sb 7:00-22:30, Nd 9:00-21:00',
    null,
    42.4608,
    12.3789,
    6,
    now()
  )
on conflict (id) do update set
  kind = excluded.kind,
  name = excluded.name,
  address = excluded.address,
  notes = excluded.notes,
  hours = excluded.hours,
  walk_minutes = excluded.walk_minutes,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  display_order = excluded.display_order,
  published_at = excluded.published_at;


-- Tagi do istniejących wpisów bloga (z seed-blog.ts)
update public.blog_posts set tags = array['orte', 'codzienne'] where slug = 'pierwsze-rano-w-orte';
update public.blog_posts set tags = array['orte', 'sasiedzi', 'jedzenie'] where slug = 'wieczor-z-sasiadami-pod-porta-romana';
update public.blog_posts set tags = array['wycieczki', 'bomarzo', 'civita'] where slug = 'sobota-w-terenie-bomarzo';
update public.blog_posts set tags = array['viterbo', 'jedzenie', 'targ'] where slug = 'targ-w-viterbo-co-przywiezlismy';
