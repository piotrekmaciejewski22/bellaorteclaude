-- =============================================================================
-- BELLAORTE — Demo seed data
-- =============================================================================
--
-- Purpose:
--   Populates a fresh Supabase project with the minimum content that the
--   public site, the admin panel, and the route handlers need in order
--   to render and exercise every flow described in the spec. This is the
--   fourth and final SQL file in the deployment chain.
--
-- Deployment order:
--   1. supabase/schema.sql   ← extensions, enums, tables, RPC.
--   2. supabase/rls.sql      ← row level security policies.
--   3. supabase/storage.sql  ← buckets + storage policies.
--   4. supabase/seed.sql     ← THIS FILE: demo content.
--
-- What this file inserts:
--   * 2 apartments (`casa-orte-uno`, `casa-orte-due`) with descriptions
--     and `published_at = now()` so they are visible on `/apartments`.
--   * 3 placeholder gallery photos per apartment, all with
--     `source_kind = 'placeholder_orte'` so the apartment galleries
--     have something to render before real interior shots arrive
--     (Wymaganie 40).
--   * 5 restaurants — 3 in the `orte_area` region, 2 in the `rome`
--     region — each with full Map_Data (address + place_id +
--     latitude/longitude) so `<MapEmbed>` has every input it needs
--     (Wymaganie 14, 41).
--   * 5 attractions — 3 in `orte_area`, 2 in `rome` — same Map_Data
--     completeness (Wymaganie 16, 41).
--   * 4 Rome itinerary points, one per `day_part` value
--     (`morning`, `noon`, `afternoon`, `evening`). Each point links to
--     a rome-region restaurant or attraction so the public itinerary
--     page can render `<MapEmbed>` per point (Wymaganie 20).
--   * 5 `rome_info_sections`, one per `rome_info_kind` value
--     (`transfer_from_orte`, `public_transport`, `tickets`, `safety`,
--     `opening_hours`). The UNIQUE constraint on `kind` guarantees the
--     "exactly one row per kind" invariant (Wymaganie 21).
--   * 4 `travel_info` rows, one per `travel_info_kind` value
--     (`car_rental`, `rome_transfer`, `trains`, `travel_directions`)
--     for `/useful-info` (Wymaganie 22).
--   * 1 `site_settings` row with the default contact, footer address,
--     privacy stub, and the three consent texts that the booking,
--     review, and photo forms render (Wymaganie 37, 43).
--
-- Idempotency:
--   Every INSERT in this file is wrapped in an `ON CONFLICT … DO UPDATE`
--   clause keyed on a stable identifier:
--     * apartments / restaurants / attractions / travel_info /
--       rome_info_sections — keyed on the natural unique column
--       (`slug` for the first three, `kind` for the last two; the schema
--       already has `UNIQUE` constraints on each).
--     * gallery_photos and rome_itinerary — keyed on a fixed UUID
--       declared in the INSERT itself, so re-runs find the same row and
--       update it in place rather than appending duplicates.
--     * site_settings — singleton with `id = 1`; we INSERT … ON CONFLICT
--       (id) DO UPDATE so the default values can be re-applied.
--   This file can be re-run any number of times against a populated
--   database without producing duplicate rows or violating the
--   "exactly one of …" CHECK on `gallery_photos`.
--
-- Stable IDs:
--   Apartments, restaurants, attractions, gallery photos, and itinerary
--   points all use hand-written UUIDs declared as plain `uuid` literals.
--   The same id values are reused as foreign keys between rows (e.g. an
--   itinerary point's `linked_restaurant_id` matches the restaurant's
--   `id`). Hand-writing the UUIDs keeps cross-row references stable
--   across re-runs without needing CTEs or temp tables.
--
-- Privacy / Wymaganie 42:
--   Seed content is INTENTIONALLY non-personal. There is no demo
--   booking_inquiry, reservation, calendar_block, review, or
--   guest_photo: those tables are seeded organically by the public POST
--   flows (tasks 5.2, 5.3, 5.4) and by the admin moderation queue.
--   Inserting fake PII here would put placeholder names and emails into
--   a privacy-sensitive table and contradict the "no anon read" RLS
--   posture established in `supabase/rls.sql`.
--
-- Wymagania pokryte: 4, 14, 16, 18, 20, 21, 22.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. apartments — exactly two, both published.
-- -----------------------------------------------------------------------------
-- The MVP keeps the apartment count locked at two (Wymaganie 28 #6); the
-- admin route handlers (task 14.6) reject a third INSERT. Slugs are kebab
-- case (the schema enforces this with the `apartments_slug_kebab_case`
-- CHECK), and `published_at = now()` makes both rows visible to the
-- `apartments_anon_read_published` policy.

insert into public.apartments (
  id, slug, name, description, max_guests, bedrooms, bathrooms,
  amenities, house_rules, published_at
) values (
  '11111111-1111-4111-8111-111111111111'::uuid,
  'casa-orte-uno',
  'Casa Orte Uno',
  'Przestronny apartament w sercu zabytkowego centrum Orte z widokiem na dolinę Tybru. Idealny dla par lub małych rodzin szukających spokoju i autentycznego włoskiego klimatu.',
  4,
  2,
  1,
  array['Wi-Fi', 'Klimatyzacja', 'Kuchnia w pełni wyposażona', 'Pralka', 'Taras', 'Pościel i ręczniki'],
  E'Zameldowanie od 15:00, wymeldowanie do 11:00.\nCisza nocna 22:00 — 08:00.\nBez zwierząt domowych.\nZakaz palenia we wnętrzach.',
  now()
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  max_guests = excluded.max_guests,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  amenities = excluded.amenities,
  house_rules = excluded.house_rules,
  published_at = excluded.published_at;

insert into public.apartments (
  id, slug, name, description, max_guests, bedrooms, bathrooms,
  amenities, house_rules, published_at
) values (
  '22222222-2222-4222-8222-222222222222'::uuid,
  'casa-orte-due',
  'Casa Orte Due',
  'Kameralny apartament tuż obok Piazza della Liberta, z dostępem do podziemnej trasy Orte Sotterranea i lokalnych restauracji w odległości spaceru. Najlepszy wybór na pierwszą wizytę w regionie Lacjum.',
  2,
  1,
  1,
  array['Wi-Fi', 'Klimatyzacja', 'Aneks kuchenny', 'Pralka', 'Pościel i ręczniki'],
  E'Zameldowanie od 15:00, wymeldowanie do 11:00.\nCisza nocna 22:00 — 08:00.\nBez zwierząt domowych.\nZakaz palenia we wnętrzach.',
  now()
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  max_guests = excluded.max_guests,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  amenities = excluded.amenities,
  house_rules = excluded.house_rules,
  published_at = excluded.published_at;


-- -----------------------------------------------------------------------------
-- 2. gallery_photos — 3 placeholder shots per apartment.
-- -----------------------------------------------------------------------------
-- All six rows use `source_kind = 'placeholder_orte'` so the
-- `ApartmentGallery` component (task 9.1) treats them as orte/okolica
-- placeholders rather than real interior photos. Per Wymaganie 40 #2,
-- as long as no `interior_real` row exists for an apartment, the public
-- gallery falls back to placeholder/exterior photos exclusively.
--
-- `storage_path` values point at relative paths inside the public
-- `site-media` bucket. The bucket is `public = true` so the CDN URL
-- `https://<project>.supabase.co/storage/v1/object/public/site-media/<path>`
-- resolves without a signed token. The actual placeholder JPEGs need
-- to be uploaded separately by the operator following
-- `docs/supabase-setup.md`; the seed only declares the rows.

insert into public.gallery_photos (id, apartment_id, storage_path, alt, source_kind, display_order) values
  (
    'a1111111-1111-4111-8111-111111111101'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    'apartments/casa-orte-uno/placeholder-orte-01.jpg',
    'Widok na zabytkowe centrum Orte o zachodzie słońca',
    'placeholder_orte',
    0
  ),
  (
    'a1111111-1111-4111-8111-111111111102'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    'apartments/casa-orte-uno/placeholder-orte-02.jpg',
    'Wąska brukowana uliczka w Orte z kamiennymi pałacami',
    'placeholder_orte',
    1
  ),
  (
    'a1111111-1111-4111-8111-111111111103'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    'apartments/casa-orte-uno/placeholder-orte-03.jpg',
    'Dolina Tybru widziana z tufowego wzgórza Orte',
    'placeholder_orte',
    2
  ),
  (
    'a2222222-2222-4222-8222-222222222201'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    'apartments/casa-orte-due/placeholder-orte-01.jpg',
    'Piazza della Liberta w Orte w słoneczny dzień',
    'placeholder_orte',
    0
  ),
  (
    'a2222222-2222-4222-8222-222222222202'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    'apartments/casa-orte-due/placeholder-orte-02.jpg',
    'Średniowieczne mury obronne Orte na tle błękitnego nieba',
    'placeholder_orte',
    1
  ),
  (
    'a2222222-2222-4222-8222-222222222203'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    'apartments/casa-orte-due/placeholder-orte-03.jpg',
    'Kamienny detal architektoniczny w centrum historycznym Orte',
    'placeholder_orte',
    2
  )
on conflict (id) do update set
  apartment_id = excluded.apartment_id,
  storage_path = excluded.storage_path,
  alt = excluded.alt,
  source_kind = excluded.source_kind,
  display_order = excluded.display_order;


-- -----------------------------------------------------------------------------
-- 3. restaurants — 3 in `orte_area`, 2 in `rome`. Full Map_Data each.
-- -----------------------------------------------------------------------------
-- Map_Data completeness (address + place_id + latitude + longitude +
-- maps_url) satisfies Wymaganie 41 #1, which the admin validator
-- (task 3.4) enforces. The `place_id` values are demo placeholders;
-- swap them for real Google Place IDs before pushing to production so
-- `<MapEmbed>` (task 12.2) renders the real iframe.

insert into public.restaurants (
  id, slug, name, description, region, cuisine_categories, tags,
  opening_hours, phone, website, tip_for_guest,
  address, place_id, latitude, longitude, maps_url,
  published_at
) values
  (
    'b1111111-1111-4111-8111-111111111111'::uuid,
    'la-locanda-della-chiocciola',
    'La Locanda della Chiocciola',
    'Restauracja oparta o lokalne produkty i sezonowe menu, z tarasem nad doliną i historycznym kominkiem w sali głównej.',
    'orte_area',
    array['Cucina contadina', 'Kuchnia regionalna'],
    array['lokalne produkty', 'taras', 'lunch', 'rezerwacja'],
    E'Piątek i poniedziałek: 12:30 — 14:00\nSobota i niedziela: 12:30 — 14:30\nWieczory: tylko na rezerwację',
    '+39 0761 402734',
    'https://www.lachiocciola.net/ristorante/',
    'Najlepsze na regionalny lunch. Dni otwarcia są ograniczone — zarezerwuj stolik telefonicznie z wyprzedzeniem.',
    'Loc. Seripola, 01028 Orte VT, Włochy',
    'ChIJ_demo_locanda_chiocciola',
    42.4625,
    12.3892,
    'https://www.google.com/maps/search/?api=1&query=La+Locanda+della+Chiocciola+Orte',
    now()
  ),
  (
    'b2222222-2222-4222-8222-222222222222'::uuid,
    'pizzeria-eureka-orte',
    'Pizzeria Ristorante Eureka!',
    'Pizza z pieca opalanego drewnem i klasyczna kuchnia włoska. Wygodny dojazd, parking i pełne menu z opcjami wegetariańskimi.',
    'orte_area',
    array['Pizza', 'Cucina italiana'],
    array['pizza', 'rodzinnie', 'parking', 'casual'],
    E'Lunch: 12:00 — 14:15\nKolacja: 19:00 — 23:00',
    '+39 0761 402447',
    'https://www.pizzeriaeureka.com/',
    'Bezpieczny wybór na pierwszy wieczór, gdy nie chce się jechać daleko od apartamentu.',
    'Via dei Calafati 34, 01028 Orte VT, Włochy',
    'ChIJ_demo_eureka_orte',
    42.4582,
    12.3866,
    'https://www.google.com/maps/search/?api=1&query=Pizzeria+Eureka+Orte',
    now()
  ),
  (
    'b3333333-3333-4333-8333-333333333333'::uuid,
    'campo-antico-orte',
    'Campo Antico',
    'Spokojna restauracja z lokalnym klimatem, polecana na lunch lub kolację poza zatłoczonym centrum. Sezonowe dania kuchni laziale.',
    'orte_area',
    array['Cucina locale', 'Kuchnia laziale'],
    array['kolacja', 'lokalnie', 'rezerwacja', 'auto'],
    E'Wtorek — niedziela: 12:00 — 14:30 i 19:00 — 22:30\nPoniedziałek: zamknięte',
    '+39 0761 402380',
    'https://campoantico.it/',
    'Warto rezerwować wieczorem w sezonie — lokal jest popularny wśród mieszkańców.',
    'Localita Cacciarino, 01028 Orte VT, Włochy',
    'ChIJ_demo_campo_antico',
    42.4541,
    12.4012,
    'https://www.google.com/maps/search/?api=1&query=Campo+Antico+Orte',
    now()
  ),
  (
    'b4444444-4444-4444-8444-444444444444'::uuid,
    'roscioli-salumeria-con-cucina',
    'Roscioli Salumeria con Cucina',
    'Połączenie delikatesów, kuchni i baru winnego w sercu rzymskiego centrum, blisko Campo de'' Fiori. Klasyki kuchni rzymskiej w wersji premium.',
    'rome',
    array['Cucina romana', 'Salumeria'],
    array['Rzym', 'centrum', 'rezerwacja', 'wino'],
    E'Restauracja: 12:30 — 15:30 i 19:00 — 23:30\nSklep delikatesowy: 9:00 — 23:30',
    '+39 06 687 5287',
    'https://www.roscioli.com/',
    'Rezerwacja zalecana z wyprzedzeniem. Świetny przystanek po spacerze Campo de'' Fiori — Pantheon — Piazza Navona.',
    'Via dei Giubbonari 21, 00186 Roma RM, Włochy',
    'ChIJ_demo_roscioli_rome',
    41.8946,
    12.4720,
    'https://www.google.com/maps/search/?api=1&query=Roscioli+Salumeria+con+Cucina+Rome',
    now()
  ),
  (
    'b5555555-5555-4555-8555-555555555555'::uuid,
    'felice-a-testaccio',
    'Felice a Testaccio',
    'Klasyczna kuchnia rzymska w dzielnicy Testaccio. Słynne cacio e pepe, tonnarelli i tiramisù przygotowywane na sali.',
    'rome',
    array['Cucina romana'],
    array['Rzym', 'Testaccio', 'cacio e pepe', 'kolacja'],
    E'Codziennie: 12:30 — 15:30 i 19:00 — 23:30',
    '+39 06 574 6800',
    'https://feliceatestaccio.com/',
    'Najlepsza opcja na kolację po dniu zwiedzania — pamiętaj, by sprawdzić ostatni wygodny pociąg powrotny do Orte.',
    'Via Mastro Giorgio 29, 00153 Roma RM, Włochy',
    'ChIJ_demo_felice_testaccio',
    41.8794,
    12.4761,
    'https://www.google.com/maps/search/?api=1&query=Felice+a+Testaccio+Rome',
    now()
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  region = excluded.region,
  cuisine_categories = excluded.cuisine_categories,
  tags = excluded.tags,
  opening_hours = excluded.opening_hours,
  phone = excluded.phone,
  website = excluded.website,
  tip_for_guest = excluded.tip_for_guest,
  address = excluded.address,
  place_id = excluded.place_id,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  maps_url = excluded.maps_url,
  published_at = excluded.published_at,
  deleted_at = null;


-- -----------------------------------------------------------------------------
-- 4. attractions — 3 in `orte_area`, 2 in `rome`. Full Map_Data each.
-- -----------------------------------------------------------------------------
-- Same Map_Data completeness contract as restaurants. The two rome-region
-- rows (Colosseum, Pantheon) are referenced by the rome itinerary points
-- below as `linked_attraction_id`, so the public itinerary page can
-- render `<MapEmbed>` per point (Wymaganie 20 #3).

insert into public.attractions (
  id, slug, name, description, region, tags,
  practical_info, travel_info,
  address, place_id, latitude, longitude, maps_url,
  published_at
) values
  (
    'a1111111-1111-4111-8111-aaaaaaaaaaaa'::uuid,
    'orte-sotterranea',
    'Orte Sotterranea',
    'Podziemna trasa pod historycznym centrum Orte: rzymski akwedukt, średniowieczne cysterny, studnie i fragmenty miasta wykute w tufowej skale.',
    'orte_area',
    array['Orte', 'podziemia', 'historia', 'must see'],
    'Trasa z przewodnikiem trwa około 60 minut. Bilety dostępne na miejscu i online — sezonowo warto rezerwować z wyprzedzeniem.',
    'Wejście znajduje się przy Via G. Matteotti, w samym sercu centrum historycznego — dojście pieszo z każdego apartamentu BELLAORTE.',
    'Via G. Matteotti 45, 01028 Orte VT, Włochy',
    'ChIJ_demo_orte_sotterranea',
    42.4605,
    12.3867,
    'https://www.google.com/maps/search/?api=1&query=Orte+Sotterranea',
    now()
  ),
  (
    'a2222222-2222-4222-8222-aaaaaaaaaaaa'::uuid,
    'parco-dei-mostri-bomarzo',
    'Parco dei Mostri di Bomarzo',
    'Sacro Bosco di Bomarzo — manierystyczny park rzeźb z XVI wieku, z fantastycznymi stworzeniami i symbolicznymi inskrypcjami. Świetny pomysł na pół dnia z dziećmi.',
    'orte_area',
    array['Bomarzo', 'rodzinnie', 'park', 'auto'],
    'Sezon letni (kwiecień — sierpień): 8:30 — 19:00. Poza sezonem: 8:30 do zmierzchu. Bilety dostępne przy wejściu i online.',
    'Najlepiej autem — około 25 — 30 minut z Orte. Parking bezpłatny przy wejściu do parku.',
    'Loc. Giardino, 01020 Bomarzo VT, Włochy',
    'ChIJ_demo_parco_mostri',
    42.4895,
    12.2482,
    'https://www.google.com/maps/search/?api=1&query=Parco+dei+Mostri+Bomarzo',
    now()
  ),
  (
    'a3333333-3333-4333-8333-aaaaaaaaaaaa'::uuid,
    'civita-di-bagnoregio',
    'Civita di Bagnoregio',
    'Jedno z najpiękniejszych miasteczek Włoch, położone na tufowym wzgórzu i dostępne wyłącznie pieszym mostem. Spektakularne widoki i klimatyczne uliczki.',
    'orte_area',
    array['widoki', 'miasteczko', 'foto', 'auto'],
    'Wstęp do miasteczka jest płatny (drobna opłata wspierająca utrzymanie mostu i obiektu). Letni środek dnia bywa upalny — najlepiej rano lub późnym popołudniem.',
    'Około 50 — 60 minut autem z Orte. Parking u wjazdu do Bagnoregio, dalej spacer mostem.',
    'Civita di Bagnoregio, 01022 Bagnoregio VT, Włochy',
    'ChIJ_demo_civita_bagnoregio',
    42.6275,
    12.1130,
    'https://www.google.com/maps/search/?api=1&query=Civita+di+Bagnoregio',
    now()
  ),
  (
    'a4444444-4444-4444-8444-aaaaaaaaaaaa'::uuid,
    'koloseum-forum-romanum',
    'Koloseum i Forum Romanum',
    'Główny punkt antycznego Rzymu: Koloseum, Forum Romanum i Palatyn w jednym połączonym bilecie. Niezbędna rezerwacja slotu wejścia do Koloseum.',
    'rome',
    array['Rzym', 'antyk', 'must see', 'bilety'],
    'Koloseum otwiera się o 8:30. Bilety wymagają rezerwacji konkretnego slotu — kup z kilkudniowym wyprzedzeniem przez oficjalną stronę Parco archeologico del Colosseo.',
    'Z Orte pociągiem do Roma Termini lub Roma Tiburtina, dalej metrem linii B do stacji Colosseo (jeden przystanek od Termini).',
    'Piazza del Colosseo, 00184 Roma RM, Włochy',
    'ChIJ_demo_colosseum_rome',
    41.8902,
    12.4922,
    'https://www.google.com/maps/search/?api=1&query=Colosseum+Rome',
    now()
  ),
  (
    'a5555555-5555-4555-8555-aaaaaaaaaaaa'::uuid,
    'pantheon-piazza-navona',
    'Pantheon i Piazza Navona',
    'Środek spaceru po historycznym centrum Rzymu. Pantheon — najlepiej zachowana świątynia rzymska — i pobliska Piazza Navona z trzema fontannami Berniniego.',
    'rome',
    array['Rzym', 'spacer', 'centrum', 'Pantheon'],
    'Wstęp do Pantheonu jest obecnie biletowany (5 EUR). Pobierz bilet online, by ominąć kolejkę w godzinach szczytu. Piazza Navona — wstęp wolny przez całą dobę.',
    'Pantheon znajduje się 10 — 15 minut spacerem od stacji Roma Termini lub od Koloseum. Brak metra w bezpośredniej okolicy — idź pieszo lub autobusem.',
    'Piazza della Rotonda, 00186 Roma RM, Włochy',
    'ChIJ_demo_pantheon_rome',
    41.8986,
    12.4769,
    'https://www.google.com/maps/search/?api=1&query=Pantheon+Rome',
    now()
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  region = excluded.region,
  tags = excluded.tags,
  practical_info = excluded.practical_info,
  travel_info = excluded.travel_info,
  address = excluded.address,
  place_id = excluded.place_id,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  maps_url = excluded.maps_url,
  published_at = excluded.published_at,
  deleted_at = null;


-- -----------------------------------------------------------------------------
-- 5. rome_itinerary — one point per `day_part` value, all published.
-- -----------------------------------------------------------------------------
-- Each point links to either a rome-region attraction or a rome-region
-- restaurant from the seed above (matching ids hand-written in the
-- `linked_*_id` columns), so the public `/rome/itinerary` page (task
-- 13.3) can render `<MapEmbed>` per point. Rows are keyed by id so the
-- ON CONFLICT clause works without a unique constraint on `day_part`.

insert into public.rome_itinerary (
  id, day_part, title, body,
  linked_restaurant_id, linked_attraction_id,
  display_order, published_at
) values
  (
    'c1111111-1111-4111-8111-111111111111'::uuid,
    'morning',
    'Koloseum, Forum Romanum i Palatyn',
    'Zacznij dzień od antyku. Pociąg z Orte do Roma Termini, dalej metrem B na stację Colosseo. Wejście do Koloseum w pierwszym rozsądnym slocie po przyjeździe — bilet z rezerwacją kupiony z wyprzedzeniem.',
    null,
    'a4444444-4444-4444-8444-aaaaaaaaaaaa'::uuid,
    0,
    now()
  ),
  (
    'c2222222-2222-4222-8222-222222222222'::uuid,
    'noon',
    'Lunch w okolicach Campo de'' Fiori',
    'Po antycznym Rzymie przejdź pieszo do historycznego centrum. Lunch w Roscioli Salumeria con Cucina — klasyki kuchni rzymskiej w wersji premium, świeże salumi i wybór lokalnych win.',
    'b4444444-4444-4444-8444-444444444444'::uuid,
    null,
    1,
    now()
  ),
  (
    'c3333333-3333-4333-8333-333333333333'::uuid,
    'afternoon',
    'Pantheon i Piazza Navona',
    'Spacer przez serce historycznego Rzymu. Pantheon, kawa lub gelato w okolicy Piazza della Rotonda, dalej Piazza Navona z fontannami Berniniego. Tempo dyktuje pogoda.',
    null,
    'a5555555-5555-4555-8555-aaaaaaaaaaaa'::uuid,
    2,
    now()
  ),
  (
    'c4444444-4444-4444-8444-444444444444'::uuid,
    'evening',
    'Kolacja w Testaccio',
    'Wieczorem przejedź do Testaccio na klasyczną kolację rzymską w Felice a Testaccio. Sprawdź ostatni wygodny pociąg do Orte, zanim zamówisz desery — RegioExpress kursują do około 22:30.',
    'b5555555-5555-4555-8555-555555555555'::uuid,
    null,
    3,
    now()
  )
on conflict (id) do update set
  day_part = excluded.day_part,
  title = excluded.title,
  body = excluded.body,
  linked_restaurant_id = excluded.linked_restaurant_id,
  linked_attraction_id = excluded.linked_attraction_id,
  display_order = excluded.display_order,
  published_at = excluded.published_at;


-- -----------------------------------------------------------------------------
-- 6. rome_info_sections — one row per `rome_info_kind` value.
-- -----------------------------------------------------------------------------
-- The schema has `unique (kind)`; we lean on that for the ON CONFLICT
-- clause so the seed updates each fixed slot in place. All five sections
-- ship as `published_at = now()` so they appear on `/rome/info`
-- immediately (Wymaganie 21 #1).

insert into public.rome_info_sections (
  kind, title, body, display_order, published_at
) values
  (
    'transfer_from_orte',
    'Dojazd z Orte do Rzymu',
    E'Najszybsza i najpraktyczniejsza opcja to pociąg ze stacji Orte. Trenitalia i Italo obsługują kilkadziesiąt połączeń dziennie do Roma Termini i Roma Tiburtina.\n\n- Czas przejazdu pociągami RegioExpress: około 60 — 70 minut.\n- Czas przejazdu pociągami Frecciabianca/Frecciargento: około 45 — 55 minut.\n- Bilet kupisz w aplikacji Trenitalia, w automatach na stacji lub przez Italo.\n\nAuto: trasa Orte — Rzym przez A1 zajmuje od 1h do 1h 45 min w zależności od ruchu i celu w Rzymie. W samym mieście zaparkowanie bywa kosztowne — pociąg jest zwykle wygodniejszy.',
    0,
    now()
  ),
  (
    'public_transport',
    'Transport miejski w Rzymie',
    E'Rzymski system transportu publicznego prowadzi ATAC.\n\n- Metro: 3 linie (A, B/B1, C). Linia B łączy Termini z Koloseum (jeden przystanek).\n- Autobusy i tramwaje: gęsta sieć, ale tempo zależy od ruchu w godzinach szczytu.\n- Bilet jednorazowy BIT: 1,50 EUR, ważny 100 min na metro/autobus/tramwaj.\n- Bilet 24-godzinny ROMA 24H: 7 EUR (warto, jeśli planujesz minimum 4 — 5 przejazdów).\n- Aplikacja MyCicero pozwala kupić bilet z telefonu i aktywować go przed wejściem do metra.',
    1,
    now()
  ),
  (
    'tickets',
    'Bilety i wstępy do atrakcji',
    E'Większość głównych atrakcji wymaga obecnie rezerwacji slotu wejścia online.\n\n- **Koloseum / Forum / Palatyn**: bilet łączony, obowiązkowa rezerwacja slotu — kup minimum 3 — 5 dni wcześniej w sezonie.\n- **Muzea Watykańskie i Kaplica Sykstyńska**: rezerwacja online silnie zalecana, kolejki w ostatniej chwili sięgają 2 — 3 godzin.\n- **Pantheon**: od 2023 wstęp biletowany (około 5 EUR), bilet online omija kolejkę.\n- **Galeria Borghese**: limit 360 osób na turę, bilety wyprzedają się z tygodniowym wyprzedzeniem.\n\nRoma Pass (48h lub 72h) bywa opłacalny przy 3+ płatnych atrakcjach — sprawdź listę na romapass.it.',
    2,
    now()
  ),
  (
    'safety',
    'Bezpieczeństwo w Rzymie',
    E'Rzym jest bezpiecznym miastem turystycznym, ale obowiązują typowe zasady dużej metropolii.\n\n- **Kieszonkowcy**: aktywni w metrze (zwłaszcza linia A), wokół Termini, na Trastevere wieczorem i w autobusie 64. Trzymaj torbę z przodu, portfel w wewnętrznej kieszeni.\n- **Taksówki**: zamawiaj wyłącznie oficjalne białe taksówki z licznikiem (radiotaxi 06 3570) — unikaj kierowców zaczepiających pasażerów na lotnisku i przy Termini.\n- **Telefon alarmowy**: 112 (jednolity numer alarmowy w UE).\n- **Ambasada RP w Rzymie**: Via Pietro Paolo Rubens 20, tel. +39 06 362 04 200.\n- **Karta zdrowia EKUZ**: uprawnia do bezpłatnej pomocy lekarskiej w publicznych przychodniach SSN.',
    3,
    now()
  ),
  (
    'opening_hours',
    'Godziny otwarcia atrakcji',
    E'Większość atrakcji w Rzymie jest otwarta codziennie, ale są wyjątki.\n\n- **Muzea Watykańskie**: zamknięte w niedziele (poza ostatnią niedzielą miesiąca, gdy wstęp jest darmowy do 12:30).\n- **Galeria Borghese**: zamknięta w poniedziałki.\n- **Większość muzeów państwowych**: zamknięte w pierwszy poniedziałek miesiąca.\n- **Bazyliki rzymskie** (Św. Piotra, Św. Pawła za Murami, Św. Jana na Lateranie): otwarte codziennie, ale w niedziele rano — msze, zwiedzanie z ograniczeniami.\n\nLetnie godziny rozszerzone (do 19:30 — 21:00) zwykle obowiązują od końca marca do końca października. Sprawdź konkretną atrakcję przed wyjściem.',
    4,
    now()
  )
on conflict (kind) do update set
  title = excluded.title,
  body = excluded.body,
  display_order = excluded.display_order,
  published_at = excluded.published_at;


-- -----------------------------------------------------------------------------
-- 7. travel_info — one row per `travel_info_kind` value.
-- -----------------------------------------------------------------------------
-- The schema has no unique constraint on `kind`, so we use a stable id
-- per kind and ON CONFLICT (id) DO UPDATE. `external_links` is JSONB —
-- we cast a literal JSON array to satisfy the column type.

insert into public.travel_info (
  id, kind, title, body, external_links, display_order, published_at
) values
  (
    'f1111111-1111-4111-8111-111111111111'::uuid,
    'trains',
    'Pociągi z Orte',
    E'Stacja Orte to jeden z głównych węzłów linii Roma — Firenze (FL1 i Direttissima). Codziennie zatrzymuje się tu kilkadziesiąt pociągów Trenitalia oraz Italo.\n\n- **Roma Termini**: 50 — 70 minut, kilkanaście połączeń na godzinę.\n- **Firenze SMN**: 1h 30 — 2h, około 20 połączeń dziennie.\n- **Perugia**: przesiadka w Foligno, łącznie około 2h.\n- **Mediolan**: pociągi Frecciarossa około 4h, większość wymaga przesiadki w Bolonii.\n\nBilet kupisz w aplikacji Trenitalia, Italo, w automatach na stacji lub w kasie. RegioExpress (R) i Regionale (R) — bilety bez rezerwacji miejsca, ważne na konkretny dzień.',
    '[
      {"label": "Trenitalia — rozkład i bilety", "url": "https://www.trenitalia.com/"},
      {"label": "Italo — rozkład i bilety", "url": "https://www.italotreno.it/"}
    ]'::jsonb,
    0,
    now()
  ),
  (
    'f2222222-2222-4222-8222-222222222222'::uuid,
    'rome_transfer',
    'Dojazd do Rzymu z Orte',
    E'Z Orte do centrum Rzymu dojedziesz pociągiem (najszybciej i najwygodniej) lub autem (warto głównie, gdy planujesz wycieczkę poza miasto tego samego dnia).\n\n- **Pociągiem**: stacja Orte → Roma Termini lub Roma Tiburtina, 50 — 70 minut. Z Termini metrem B do Koloseum (1 przystanek) lub pieszo do większości atrakcji.\n- **Autem**: A1 Roma — Firenze, zjazd Roma Nord. Czas przejazdu 1h — 1h 45 w zależności od ruchu. W centrum Rzymu obowiązuje strefa ZTL (ograniczonego ruchu) — zaparkuj na obrzeżach (P+R Anagnina, P+R Cornelia) i przesiądź się do metra.\n\nLotnisko Fiumicino: pociąg Leonardo Express z Termini (32 minuty, 14 EUR jednorazowo) lub regionalny FL1 do Trastevere/Tiburtiny.',
    '[
      {"label": "Roma Termini — informacje dla podróżnych", "url": "https://www.romatermini.com/"},
      {"label": "ATAC — transport miejski w Rzymie", "url": "https://www.atac.roma.it/"}
    ]'::jsonb,
    1,
    now()
  ),
  (
    'f3333333-3333-4333-8333-333333333333'::uuid,
    'car_rental',
    'Wynajem samochodu',
    E'Auto przyda się przy wyjazdach do Bomarzo, Villa Lante, Civita di Bagnoregio i restauracji poza centrum Orte.\n\n- **Lotnisko Fiumicino (FCO)**: największy wybór wypożyczalni — Hertz, Avis, Europcar, Sixt, Enterprise.\n- **Lotnisko Ciampino (CIA)**: mniejszy, ale tańszy.\n- **Stacja Orte**: lokalne wypożyczalnie z ograniczonym wyborem aut, lepiej rezerwować z wyprzedzeniem.\n\nNajlepsze ceny dostaniesz przez agregatory (DiscoverCars, Rentalcars). Pamiętaj o pełnym ubezpieczeniu (CDW + Theft Protection) i o sprawdzeniu zasad dotyczących franchigia (kaucji blokowanej na karcie).\n\nW samym Rzymie auto bywa utrudnieniem — strefa ZTL, droga parking, ruchliwa komunikacja. Do miasta lepiej pociągiem.',
    '[
      {"label": "DiscoverCars — porównywarka", "url": "https://www.discovercars.com/"},
      {"label": "Hertz — Włochy", "url": "https://www.hertz.it/"}
    ]'::jsonb,
    2,
    now()
  ),
  (
    'f4444444-4444-4444-8444-444444444444'::uuid,
    'travel_directions',
    'Kierunki podróży z Orte',
    E'Orte to wygodna baza wypadowa do regionu Lacjum, Umbrii i Toskanii.\n\n- **Rzym** (60 km): pociąg 50 — 70 min lub auto 1h — 1h 45.\n- **Viterbo** (25 km): auto 30 min, pociąg z przesiadką 50 — 60 min. Stolica termiczna regionu Tuscia.\n- **Perugia** (70 km): auto 1h, pociąg z przesiadką w Foligno 2h. Stolica Umbrii.\n- **Asyż** (110 km): auto 1h 20, pociąg 2h 30. Bazylika św. Franciszka, średniowieczne centrum.\n- **Florencja** (260 km): pociąg 1h 30 — 2h, auto 2h 30 — 3h. Wycieczka jednodniowa wymagająca dyscypliny.\n\nNa start polecamy: Orte Sotterranea + centrum historyczne (pierwszy dzień), Bomarzo lub Civita di Bagnoregio (drugi dzień), Rzym (trzeci dzień).',
    '[
      {"label": "VisitLazio — region", "url": "https://www.visitlazio.com/"},
      {"label": "Visit Orte", "url": "https://www.visitaorte.com/"}
    ]'::jsonb,
    3,
    now()
  )
on conflict (id) do update set
  kind = excluded.kind,
  title = excluded.title,
  body = excluded.body,
  external_links = excluded.external_links,
  display_order = excluded.display_order,
  published_at = excluded.published_at;


-- -----------------------------------------------------------------------------
-- 8. site_settings — singleton row, id = 1.
-- -----------------------------------------------------------------------------
-- The DB enforces `id = 1` and `smallint primary key`, so there can never
-- be more than one row. We INSERT … ON CONFLICT (id) DO UPDATE so a
-- re-run resets the row to the default values without violating the
-- CHECK constraint.

insert into public.site_settings (
  id,
  contact_email,
  contact_phone,
  footer_address,
  privacy_policy_md,
  consent_text_booking,
  consent_text_review,
  consent_text_photo
) values (
  1,
  'kontakt@bellaorte.example',
  '+39 000 000 0000',
  'Orte, Prowincja Viterbo, Włochy',
  E'# Polityka prywatności BELLAORTE\n\nNiniejszy dokument opisuje, jak BELLAORTE przetwarza dane osobowe gości odwiedzających stronę i wysyłających zapytania o pobyt, opinie lub zdjęcia.\n\n## Administrator danych\n\nAdministratorem danych osobowych jest właściciel apartamentów BELLAORTE, prowadzący działalność w Orte (Prowincja Viterbo, Włochy). Kontakt: kontakt@bellaorte.example.\n\n## Zakres przetwarzanych danych\n\n- **Zapytania rezerwacyjne**: imię i nazwisko, adres email, opcjonalnie numer telefonu, treść wiadomości, daty pobytu, liczba gości.\n- **Opinie**: podpis (imię), treść komentarza, ocena 1—5, opcjonalne zdjęcie.\n- **Zdjęcia gości**: plik graficzny w formacie JPEG/PNG/WebP do 8 MB.\n\n## Cel przetwarzania\n\nDane są przetwarzane wyłącznie w celu obsługi zapytań rezerwacyjnych, prezentacji opinii i zdjęć po moderacji oraz odpowiedzi na zgłoszenia kontaktowe.\n\n## Odbiorcy danych\n\nDane nie są udostępniane podmiotom trzecim poza dostawcami infrastruktury (Supabase) niezbędnymi do działania strony.\n\n## Prawa gościa\n\nKażdy gość ma prawo dostępu do swoich danych, ich poprawiania, usunięcia oraz wniesienia sprzeciwu wobec przetwarzania. Zgłoszenia: kontakt@bellaorte.example.\n\n## Okres przechowywania\n\nDane zapytań rezerwacyjnych są przechowywane przez okres niezbędny do obsługi zgłoszenia oraz przez 12 miesięcy w celach archiwalnych. Opublikowane opinie i zdjęcia pozostają widoczne, dopóki nie zostaną wycofane przez administratora.\n\n## Pliki cookies\n\nStrona BELLAORTE używa wyłącznie technicznych plików cookies niezbędnych do działania (sesja, preferencje wyświetlania). Nie używamy cookies marketingowych ani analitycznych.\n\nNiniejsza polityka jest wstępem informacyjnym. Pełna treść zostanie opublikowana po wdrożeniu produkcyjnym.',
  'Wyrażam zgodę na przetwarzanie moich danych osobowych w celu obsługi zapytania rezerwacyjnego zgodnie z Polityką prywatności.',
  'Oświadczam, że treść opinii jest moją własną i wyrażam zgodę na publikację mojego podpisu i komentarza po zatwierdzeniu przez administratora.',
  'Oświadczam, że posiadam prawa do wgrywanego zdjęcia i wyrażam zgodę na jego publikację po zatwierdzeniu przez administratora.'
)
on conflict (id) do update set
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  footer_address = excluded.footer_address,
  privacy_policy_md = excluded.privacy_policy_md,
  consent_text_booking = excluded.consent_text_booking,
  consent_text_review = excluded.consent_text_review,
  consent_text_photo = excluded.consent_text_photo;


-- =============================================================================
-- End of seed.sql.
--
-- Sanity assertions (documentation only — no runtime checks):
--   * 2 rows in `apartments`, both with `published_at IS NOT NULL`.
--   * 6 rows in `gallery_photos` (3 per apartment), all
--     `source_kind = 'placeholder_orte'`. Zero `interior_real` rows
--     until the operator uploads real interior shots.
--   * 5 rows in `restaurants`: 3 with `region = 'orte_area'`, 2 with
--     `region = 'rome'`. Every row has address + place_id +
--     latitude + longitude + maps_url.
--   * 5 rows in `attractions`: 3 with `region = 'orte_area'`, 2 with
--     `region = 'rome'`. Every row has address + place_id +
--     latitude + longitude + maps_url.
--   * 4 rows in `rome_itinerary`, one per `day_part` value, all with
--     `published_at IS NOT NULL`. Each links to a rome-region
--     restaurant or attraction.
--   * 5 rows in `rome_info_sections`, one per `rome_info_kind` value
--     (the `unique (kind)` constraint guarantees this).
--   * 4 rows in `travel_info`, one per `travel_info_kind` value, all
--     `published_at IS NOT NULL`.
--   * 1 row in `site_settings` with `id = 1`.
--   * Zero rows in privacy-sensitive tables: `booking_inquiries`,
--     `reservations`, `calendar_blocks`, `reviews`, `guest_photos`,
--     `admin_users`. Those are populated by the live application
--     (public POST flows + admin moderation).
-- =============================================================================
