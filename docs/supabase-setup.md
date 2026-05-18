# Wdrożenie bazy Supabase dla BELLAORTE

Ten dokument opisuje, jak postawić projekt Supabase od zera dla aplikacji
BELLAORTE (folder `bellaorte2`). Po wykonaniu czterech kroków poniżej baza
ma kompletny schemat, polityki RLS, buckety mediów oraz dane demo, a
aplikacja Next.js może się z nią połączyć przez `.env.local`.

Wszystkie pliki SQL żyją w katalogu `bellaorte2/supabase/` i są jedynym
źródłem prawdy o bazie. Nie używamy migracji typu „diff”, ani CLI
`supabase db push`. Wystarczy SQL Editor w Supabase Studio.

> Zakres: Wymaganie 26 (logowanie do panelu admina) oraz Wymaganie 49
> (zmienne środowiskowe i sekrety) z `requirements.md`.

## Krok 1 — Utwórz projekt Supabase

1. Zaloguj się na <https://supabase.com> i otwórz organizację, w której ma
   żyć projekt BELLAORTE.
2. Kliknij **New project** i uzupełnij:
   - **Name** — np. `bellaorte` lub `bellaorte-prod`.
   - **Database password** — wygeneruj silne hasło i zapisz je w menedżerze
     haseł. Hasło jest potrzebne tylko do bezpośredniego dostępu do bazy
     przez `psql`; aplikacja go nie używa.
   - **Region** — najbliższy gościom (np. `eu-central-1` Frankfurt dla
     Europy). Region wpływa na latencję i koszty transferu mediów.
   - **Pricing plan** — Free wystarczy do MVP; produkcyjnie planuj Pro.
3. Poczekaj, aż provisioning bazy się zakończy (zwykle ~2 minuty).
4. Po utworzeniu projektu zapisz w bezpiecznym miejscu trzy wartości
   dostępne w **Project Settings → API**:
   - `Project URL` (np. `https://xxxxx.supabase.co`),
   - `anon` `public` API key,
   - `service_role` `secret` API key.

   Klucz `service_role` daje pełny dostęp do bazy z pominięciem RLS i
   **nigdy** nie może trafić do kodu klienckiego ani do repozytorium
   (Wymaganie 49 #2).

## Krok 2 — Uruchom pliki SQL w SQL Editor

Schemat bazy jest podzielony na cztery pliki, które należy uruchomić w
**dokładnie tej kolejności**. Każdy plik zakłada, że poprzednie zostały
już wykonane.

| Krok | Plik                  | Co robi                                                                             |
| ---- | --------------------- | ----------------------------------------------------------------------------------- |
| 2.1  | `supabase/schema.sql` | Włącza rozszerzenia, tworzy enumy, tabele domenowe, indeksy oraz funkcję `get_availability`. |
| 2.2  | `supabase/rls.sql`    | Włącza Row Level Security na każdej tabeli i deklaruje polityki dla `anon` oraz `authenticated`. |
| 2.3  | `supabase/storage.sql`| Tworzy buckety `site-media` i `guest-media` oraz polityki dostępu do `storage.objects`. |
| 2.4  | `supabase/seed.sql`   | Wstawia dane demo (2 apartamenty, restauracje, atrakcje, treści Rzymu, ustawienia). |

Procedura dla każdego pliku jest identyczna:

1. W Supabase Studio otwórz **SQL Editor → + New query**.
2. Otwórz lokalny plik z `bellaorte2/supabase/` i skopiuj całą jego
   zawartość do edytora.
3. Kliknij **Run** i sprawdź, czy nie pojawiły się błędy.
4. Po sukcesie przejdź do następnego pliku w kolejności z tabeli.

Dlaczego ta kolejność jest ważna:

- `rls.sql` referuje tabele utworzone w `schema.sql`.
- `storage.sql` zakłada, że tabele i polityki RLS już istnieją (część
  bucket policy sprawdza obecność wpisów w `admin_users`).
- `seed.sql` wstawia rekordy z `published_at = now()`, więc działa
  poprawnie tylko po włączeniu RLS — w innym wypadku wpisy demo nie
  trafią pod właściwe polityki publicznego odczytu.

Jeśli któryś krok zwróci błąd, **nie** uruchamiaj kolejnych plików.
Najpierw popraw przyczynę (zwykle: pominięty wcześniejszy plik albo
ręczna modyfikacja w Studio, która rozsynchronizowała stan z plikami w
repo) i ponów ten sam krok od początku w czystym, świeżym projekcie.

> Idempotencja: pliki SQL są pisane jako jednorazowy bootstrap dla
> świeżego projektu, nie jako wielokrotnie odpalane migracje. Jeśli
> potrzebujesz „zresetować” bazę, najprościej skasować projekt Supabase
> i utworzyć go ponownie.

## Krok 3 — Dodaj pierwszego administratora

Logowanie do panelu `/admin` wymaga, aby `auth.uid()` zalogowanego
użytkownika był obecny w tabeli `admin_users` (Wymaganie 26 #2). Tabela
nie ma żadnych domyślnych wpisów — admina trzeba dodać ręcznie po
postawieniu bazy.

1. W Supabase Studio otwórz **Authentication → Users → Add user → Create
   new user**.
2. Wpisz:
   - **Email** — adres służbowy administratora (ten sam, którym będzie
     się logować).
   - **Password** — silne hasło (min. 12 znaków, zapisane w menedżerze
     haseł).
   - **Auto Confirm User** — zaznacz, aby od razu mieć aktywne konto bez
     potwierdzania emaila.
3. Po utworzeniu użytkownika skopiuj jego `id` (UUID) z listy w
   **Authentication → Users**. UUID ma postać
   `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.
4. Wróć do **SQL Editor** i uruchom:

   ```sql
   insert into public.admin_users (user_id)
   values ('<UUID-z-Authentication-Users>');
   ```

   Tabela `admin_users` ma tylko dwie kolumny: `user_id` (klucz główny i
   FK do `auth.users.id`) oraz `created_at`. Email administratora żyje
   w `auth.users` i nie jest duplikowany w `public`.

5. Sprawdź, że wpis się dodał i poprawnie linkuje się z Authentication:

   ```sql
   select au.user_id, u.email, au.created_at
   from public.admin_users au
   join auth.users u on u.id = au.user_id;
   ```

Po tym kroku panel admina wpuści tylko to jedno konto. Kolejnych
adminów dodaje się tym samym schematem (utworzyć użytkownika w
Authentication, dorzucić wiersz do `admin_users`).

## Krok 4 — Skonfiguruj `.env.local`

Aplikacja Next.js czyta sekrety wyłącznie ze zmiennych środowiskowych
(Wymaganie 49 #3, #4). Plik `.env.example` w repo jest szablonem — jego
kopia w `.env.local` nigdy nie trafia do gita (jest w `.gitignore`).

1. W folderze `bellaorte2/` skopiuj szablon:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Na macOS/Linux odpowiednikiem jest `cp .env.example .env.local`.

2. Otwórz `.env.local` i uzupełnij wartości skopiowane z **Project
   Settings → API** w kroku 1:

   - `NEXT_PUBLIC_SUPABASE_URL` — `Project URL`.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `anon` `public` API key.
     Bezpieczny do ekspozycji w przeglądarce, bo jest ograniczony przez
     RLS z `rls.sql`.
   - `SUPABASE_SERVICE_ROLE_KEY` — `service_role` `secret` API key.
     **Tylko serwer.** Używany w `src/lib/supabase/admin.ts` przez
     `createServiceClient()` z guardem na `typeof window !== 'undefined'`.
   - `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` — klucz Google Maps Embed API.
     Może zostać pusty na czas dewelopmentu — wtedy `MapEmbed` pokazuje
     sam link do Google Maps zamiast osadzonego iframe (Wymaganie 41).

3. Zrestartuj `npm run dev`. Next.js przeładowuje zmienne środowiskowe
   tylko przy starcie procesu.

Walidacja, że konfiguracja działa:

- `GET /api/availability?apartmentId=<uuid>&from=YYYY-MM-DD&to=YYYY-MM-DD`
  zwraca listę dni z poprawnymi statusami (`available`, `pending`,
  `reserved`, `blocked`).
- Strona `/apartments` wyświetla 2 apartamenty z seedu.
- Logowanie w `/admin/login` na konto utworzone w Kroku 3 prowadzi do
  `/admin` zamiast pętli logowania.

## Bezpieczeństwo i higiena sekretów

- `SUPABASE_SERVICE_ROLE_KEY` żyje wyłącznie w `.env.local` (lokalnie)
  oraz w sekretnym storage hostingu (np. Vercel → Environment
  Variables → Production). Nigdy nie wkładaj tego klucza do `.env.example`,
  do kodu klienta ani do repozytorium (Wymaganie 49 #2).
- Klucze `anon` są bezpieczne w przeglądarce, ale skuteczność tej
  bezpieczności zależy od tego, że `rls.sql` został uruchomiony i RLS
  jest włączone na każdej tabeli. Po Kroku 2 zweryfikuj w Studio:
  **Database → Tables**, że ikona kłódki jest aktywna na każdej tabeli z
  `public`.
- Po rotacji któregokolwiek klucza w **Project Settings → API → Reset
  service role key / anon key** zaktualizuj `.env.local` lokalnie oraz
  zmienne na hostingu i zrestartuj aplikację.

## Co dalej

Po wykonaniu czterech kroków baza jest gotowa do pracy z aplikacją z
folderu `bellaorte2`. Kolejne zadania spec-a (`tasks.md`) — między
innymi route handlery publiczne (sekcja 5), auth admina (sekcja 6) oraz
panel admina (sekcje 14–18) — zakładają, że ten dokument został
wykonany w całości.
