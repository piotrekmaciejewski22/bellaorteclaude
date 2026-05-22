-- =============================================================================
-- BELLAORTE — Fala 2 migration
-- =============================================================================
--
-- Dodaje tabelę `events` która obsługuje:
--   • LOKALNE WYDARZENIA (kind='local'): festa, sagra, koncerty
--   • POLECENIA SEZONOWE (kind='seasonal'): "polecane na lato",
--     "weekend zimowy", itp.
--
-- Wspólna tabela bo struktura jest identyczna — rozróżniamy `kind`.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_kind') then
    create type event_kind as enum ('local', 'seasonal');
  end if;
end $$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  kind event_kind not null,
  title text not null,
  excerpt text not null default '',
  body_md text not null default '',
  /* Dla local: konkretna data; dla seasonal: pierwszy dzień zalecanego okresu. */
  start_date date,
  /* Dla local: opcjonalny koniec wielodniowego święta; dla seasonal: koniec polecanego okresu. */
  end_date date,
  /* Wskazówka po polsku, np. "Lipiec — Sierpień", "16 sierpnia 2026". */
  display_period text,
  hero_image_path text,
  external_url text,
  display_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_kind_published_idx
  on public.events (kind, published_at desc) where published_at is not null;

create index if not exists events_dates_idx
  on public.events (start_date, end_date) where start_date is not null;

drop trigger if exists set_updated_at on public.events;
create trigger set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

drop policy if exists "events_anon_read_published" on public.events;
create policy "events_anon_read_published"
  on public.events
  for select
  to anon, authenticated
  using (published_at is not null);

drop policy if exists "events_admin_read" on public.events;
create policy "events_admin_read"
  on public.events
  for select
  to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "events_admin_write_insert" on public.events;
create policy "events_admin_write_insert"
  on public.events
  for insert
  to authenticated
  with check (public.is_admin((select auth.uid())));

drop policy if exists "events_admin_write_update" on public.events;
create policy "events_admin_write_update"
  on public.events
  for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "events_admin_write_delete" on public.events;
create policy "events_admin_write_delete"
  on public.events
  for delete
  to authenticated
  using (public.is_admin((select auth.uid())));


-- =============================================================================
-- Demo data — przykładowe wydarzenia i polecenia sezonowe
-- =============================================================================

insert into public.events (id, kind, title, excerpt, body_md, start_date, end_date, display_period, external_url, display_order, published_at) values
  (
    'aa111111-1111-4111-8111-111111111111'::uuid,
    'local',
    'Festa di San Faustino',
    'Coroczne święto patrona Orte. Procesja, koncerty na piazza, lokalne jedzenie.',
    E'## O wydarzeniu\n\nPatron Orte, San Faustino, wspominany jest co roku w drugi weekend maja. Sobota — procesja przez centrum historyczne, niedziela — koncerty na Piazza della Liberta od godziny 17.\n\n## Co się dzieje\n\n- Sobota 18:00 — uroczysta msza w Konkatedrze Marii Wniebowziętej\n- Sobota 20:00 — procesja ze świecami do Porta Romana\n- Niedziela 17:00 — koncert orkiestry miejskiej\n- Niedziela 21:00 — pokaz sztucznych ogni nad Tybrem\n\n**Bezpłatne. Wszyscy mówią po włosku, ale nikt nie zwraca uwagi że nie rozumiesz.**',
    (now() + interval '14 days')::date,
    (now() + interval '15 days')::date,
    '14 — 15 maja 2026',
    null,
    1,
    now() - interval '5 days'
  ),
  (
    'aa111111-1111-4111-8111-111111111112'::uuid,
    'local',
    'Sagra delle Castagne — Soriano',
    'Coroczne święto kasztanów w sąsiednim Soriano. Pieczone kasztany, lokalne wino, muzyka.',
    E'## O wydarzeniu\n\nNajstarsza sagra w okolicy. W Soriano nel Cimino (25 minut autem z Orte) co roku w październiku odbywa się trzy-tygodniowy festiwal kasztanów.\n\n## Co warto wiedzieć\n\n- Festiwal trwa od pierwszego do trzeciego weekendu października\n- W centrum miasteczka stragany z pieczonymi kasztanami, polentą, dziczyzną\n- Wieczorami koncerty folkowe na Piazza Umberto\n- Wstęp wolny, jedzenie 5—15 EUR\n\nMożna iść na pół dnia. Polecamy sobotnie wieczory — najwięcej życia.',
    null,
    null,
    'Październik 2026',
    'https://www.sagradellecastagne.it/',
    2,
    now() - interval '3 days'
  ),
  (
    'bb222222-2222-4222-8222-222222222221'::uuid,
    'seasonal',
    'Lato w Tuscia — co polecamy',
    'Najlepszy czas na wieczorne kolacje na tarasie, kąpiele w jeziorach Bolsena i Vico, lokalne sagras.',
    E'## Lato u nas\n\nLipiec i sierpień to najpełniejszy sezon. Temperatury 28-32°C w dzień, wieczory chłodne. Klimatyzacja w obu apartamentach działa, ale w nocy zwykle nie jest potrzebna.\n\n## Co polecamy\n\n- **Kąpiele** — Lago di Bolsena (40 min autem, czysta woda), Lago di Vico (30 min, mniej tłoczno)\n- **Wieczorne kolacje** — La Locanda della Chiocciola na tarasie z widokiem na dolinę\n- **Sagras** w mniejszych miasteczkach, każdy weekend coś innego\n- **Wycieczki** rano (przed 11) lub wieczorem (po 18) — w środku dnia upalnie\n\n## Czego unikać\n\nRzymu w ostatnim tygodniu lipca — większość mieszkańców wyjeżdża na wakacje, połowa knajp zamknięta, turystyczne tłumy.',
    (now())::date,
    (now() + interval '60 days')::date,
    'Czerwiec — Sierpień',
    null,
    1,
    now() - interval '7 days'
  ),
  (
    'bb222222-2222-4222-8222-222222222222'::uuid,
    'seasonal',
    'Wczesna jesień — najlepszy moment',
    'Wrzesień i pierwsza połowa października. Mniej tłumów, jedzenie w pełnym sezonie, idealna pogoda.',
    E'## Dlaczego jesień\n\nNasi stali goście wracają najczęściej w połowie września. Powody są dwa: pogoda i jedzenie.\n\n## Pogoda\n\n- 22-26°C w dzień, 14-18°C w nocy\n- Średnio 4-5 deszczowych dni w miesiącu\n- Wieczory na tarasie wciąż możliwe do połowy października\n\n## Jedzenie\n\nWrzesień to początek sezonu na:\n- Białe trufle z Acqualagna (od początku października)\n- Borowiki z lasów wokół Bomarzo\n- Pierwsze kasztany\n- Świeży moszcz winogronowy w okolicznych winnicach\n\n## Wydarzenia\n\nSagra delle Castagne w Soriano, vendemmia (winobranie) w okolicznych winnicach (zwykle pierwsza dekada września), Festa dell\\'Uva w niektórych wioskach.',
    (now() + interval '90 days')::date,
    (now() + interval '150 days')::date,
    'Wrzesień — Październik',
    null,
    2,
    now() - interval '5 days'
  )
on conflict (id) do update set
  kind = excluded.kind,
  title = excluded.title,
  excerpt = excluded.excerpt,
  body_md = excluded.body_md,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  display_period = excluded.display_period,
  external_url = excluded.external_url,
  display_order = excluded.display_order,
  published_at = excluded.published_at;
