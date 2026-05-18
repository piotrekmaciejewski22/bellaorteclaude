-- =============================================================================
-- BELLAORTE — Supabase Storage buckets
-- =============================================================================
--
-- WAŻNE: Ten plik tworzy WYŁĄCZNIE bucket-y. Polityki RLS na
-- `storage.objects` w aktualnym Supabase wymagają roli `supabase_storage_admin`,
-- której zwykły user SQL Editora nie ma — próba wykonania
-- `alter table storage.objects ...` lub `create policy ... on storage.objects`
-- z poziomu SQL Editora kończy się błędem `42501: must be owner of table objects`.
--
-- Z perspektywy bezpieczeństwa BELLAORTE to nie jest problem:
--   - Bucket `site-media` ma `public = true` — odczyt ma działać dla każdego.
--   - Bucket `guest-media` ma `public = false` — odczyt blokowany domyślnie,
--     a publiczny upload (POST /api/guest-photos) idzie przez Route Handler
--     używający `service_role`, który z definicji bypassuje RLS.
--
-- Jeżeli chcesz dorzucić policy ręcznie:
--   Supabase Studio → Storage → Policies → New Policy → New from template.
--   Dla `site-media` wystarczy template "Public read access".
--   Dla `guest-media` można zostawić bez policies — service_role wystarczy.
--
-- Wymagania pokryte: 39 (#1, #2, #3, #4).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Bucket creation
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update
  set name = excluded.name,
      public = excluded.public;

insert into storage.buckets (id, name, public)
values ('guest-media', 'guest-media', false)
on conflict (id) do update
  set name = excluded.name,
      public = excluded.public;


-- =============================================================================
-- KONIEC. Polityki dla storage.objects (jeśli ich potrzebujesz) dodaj
-- przez Supabase Studio → Storage → Policies. Domyślne ustawienia (bez
-- policies) plus `public = true` dla `site-media` w pełni pokrywają flow
-- BELLAORTE — czytanie publicznych zdjęć przez CDN i prywatne uploady
-- przez service_role z route handlerów Next.js.
-- =============================================================================
