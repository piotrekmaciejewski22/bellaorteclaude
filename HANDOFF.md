# BELLAORTE — Handoff dla kolejnego modelu

**Cel dokumentu:** opisać dokładnie, co zostało zrobione, co trzeba dokończyć i jak,
żeby tańszy model AI (Sonnet, Haiku, Gemini Flash itp.) mógł kontynuować
implementację bez tracenia kontekstu na re-discovery.

**Daty/wersje stosu:** Next.js 16.2.4 (App Router, Turbopack), React 19.2.4,
TypeScript strict, Tailwind v4 (CSS-only config), Supabase (`@supabase/ssr` 0.10).

**Projekt:** `c:\Users\macie\Desktop\CODEX\bellaorte2\`

---

## 1. Kontekst spec-a

Pełny spec leży w `.kiro/specs/bellaorte/`:
- `requirements.md` — 49 wymagań biznesowych (Wym. 1–49). Pisane po polsku.
- `design.md` — architektura, schematy, komponenty.
- `tasks.md` — 99 zadań w 20 sekcjach. Status `[x]` = ukończone, `[ ]` = do zrobienia.

**Czytaj te pliki przed pisaniem czegokolwiek.** Każdy task ma w treści listę
"_Wymagania: N, M, K_" — to numery z `requirements.md` które dany task pokrywa.

---

## 2. Co JEST zrobione (do nie ruszania)

### Sekcja 1 — Init projektu (1.1–1.4) ✅
- Next.js 16 App Router z TS strict, Tailwind v4
- Italian Flag Theme tokeny CSS w `src/app/globals.css`
- Fonty: Cormorant Garamond (display) + Inter (UI) przez `next/font/google`
- `.env.example` + 3 klienty Supabase: `src/lib/supabase/{browser,server,admin}.ts`
- Typy domeny: `src/lib/types.ts`
- Stałe: `src/lib/constants.ts` (limity walidacji, RATE_LIMITS, ALLOWED_PHOTO_MIME)

### Sekcja 2 — Baza Supabase (2.1–2.6) ✅
Cztery pliki SQL w `bellaorte2/supabase/`:
- `schema.sql` — tabele, enumy, indeksy, RPC `get_availability`
- `rls.sql` — wszystkie polityki RLS, separacja anon vs admin
- `storage.sql` — buckety `site-media` (public) i `guest-media` (private signed)
- `seed.sql` — dane demo (2 apartamenty, 5 restauracji, 5 atrakcji, Rzym, settings)

Procedura wdrożenia: `docs/supabase-setup.md`. **Nie modyfikuj plików SQL** — zmiana
schemy wymaga koordynacji z route handlerami i testami integracyjnymi.

### Sekcja 3 — Walidacja (3.1–3.5) ✅
Pliki w `src/lib/validation/`:
- `booking-inquiry.ts`, `review.ts`, `guest-photo.ts`, `apartment.ts`,
  `restaurant.ts`, `attraction.ts`
- Każdy zwraca `{ ok: true } | { ok: false, errors: [{field, message}] }`
- Komunikaty PL, brak deps na Supabase/React/Zod
- Testy: `src/lib/validation/__tests__/*.test.ts` (vitest). Run: `npm test`

### Sekcja 4 — Data layer + rate limit (4.1–4.3) ✅
- `src/lib/data/availability.ts` — `getAvailability(client, apartmentId, from, to)` woła RPC
- `src/lib/data/booking.ts` — `createBookingInquiry(client, payload, ip)` z `ConflictError`
- `src/lib/data/apartments.ts` — `getApartments`, `getApartmentBySlug`, `getApartmentGallery`, `publicSiteMediaUrl`
- `src/lib/rate-limit/memory-store.ts` — `checkRateLimit(key, limit, windowMs)`, `getClientIp(request)`. **MVP only** — single instance.

### Sekcja 5 — Public API (częściowo) ✅
- 5.1 `GET /api/availability` ✅
- 5.2 `POST /api/booking-inquiries` ✅
- 5.3 `POST /api/reviews` ❌ TODO
- 5.4 `POST /api/guest-photos` ❌ TODO

### Sekcja 6 — Auth admina (6.1–6.3) ✅
- `src/lib/auth/session.ts` — `getAdminSession()`
- `src/lib/auth/require-admin.ts` — `requireAdmin()` dla route handlerów
- `src/app/admin/login/page.tsx` + `LoginForm.tsx` (client)
- `src/app/admin/layout.tsx` z guardem (redirect → login jeśli brak sesji)

### Sekcja 7–8 — Layouty publiczne (7.1, 8.1–8.3) ✅ z mockami
- `SiteHeader`, `SiteFooter`, `MobileNav` (`src/components/public/`)
- `(public)/layout.tsx` (root)
- Strona główna `/` z hero + 2 kartami apartamentów
- `/apartments` lista
- ApartmentCard z mockami (placeholderowe SVG w `public/placeholders/`)

**TODO:** task 7.2 dokończenie (`not-found.tsx`, `error.tsx`), 7.3 (`/privacy`).

### Sekcja 9 — Szczegół apartamentu (9.2–9.4) ✅
- `AvailabilityCalendar.tsx` (3 miesiące, fetch `/api/availability`, pełna a11y)
- `StatusLegend.tsx`
- `/apartments/[slug]/page.tsx` — szczegół z galerią mockową, kalendarzem, info

**TODO:** 9.1 prawdziwa galeria z lightbox (mock obecnie), 9.5 testy RTL kalendarza.

### Sekcja 10 — Booking (10.1–10.3) ✅
- `BookingForm.tsx` (client) — pełna walidacja, mapping błędów serwera
- `/booking` — z preselect z query params
- `/booking/confirmation` — podsumowanie bez PII

### Sekcja 14–15 — Admin krytyczny ✅ częściowo
- 14.1 `AdminSidebar` ✅
- 14.2 `/admin` dashboard ✅
- 15.2 `/admin/calendar` (lista MVP) ✅
- 15.4 `/admin/reservations` z `ReservationTable` ✅
- 15.5 `PATCH /api/admin/booking-inquiries/[id]` ✅ (confirm/reject z konfliktem)

---

## 3. Co ZOSTAŁO do zrobienia (priorytetyzowane)

### ✅ Wszystkie priorytety 🔴 są ukończone

Te zostały zrobione w drugiej sesji Opus:
- 7.2 `not-found.tsx` + `error.tsx` ✅
- 7.3 `/privacy` (ReactMarkdown + fallback) ✅
- 14.3 `/admin/apartments` + edytor ✅
- 14.4 `PATCH /api/admin/apartments/[id]` ✅
- 14.5 `POST /api/admin/apartments/[id]/photos` + DELETE ✅
- 14.6 Guard "exactly 2 apartments" → 422 ✅
- 15.3 `/api/admin/calendar-blocks` POST/PATCH/DELETE ✅
- 15.6 `PATCH/DELETE /api/admin/reservations/[id]` ✅

### 🟡 PRIORYTET ŚREDNI — wartość biznesowa, ale nie blokuje uruchomienia

#### Task 5.3 — `POST /api/reviews`
Wzorzec jak `/api/booking-inquiries`:
- Rate limit `RATE_LIMITS.reviewsPerHour` (z constants.ts)
- Walidacja przez `validateReview`
- Sprawdź czy `targetType` + `targetId` istnieje (Restaurant lub Attraction, published)
- INSERT do `reviews` z `status='pending'`, `consent_at=now()`, `source_ip`
- Zwróć `201 { id }`

#### Task 5.4 — `POST /api/guest-photos`
Multipart parsing przez `request.formData()`. Walidacja przez `validateGuestPhoto`. Upload do bucketa `guest-media` (private). INSERT do `guest_photos` z `status='pending'`. Wzorzec uploadu: jak w 14.5 ale bucket = `'guest-media'`.

#### Task 11.1 — `/guide`
Server Component, prosty hub z linkami do 4 podstron (`/restaurants`, `/places`, `/rome`, `/useful-info`). Sekcja "Polecane" — fetch 3 ostatnio opublikowane restauracje + 3 atrakcje.

#### Task 11.2 — `/useful-info`
Pobiera `travel_info` z bazy (published, sortowane po `display_order`), grupuje po `kind` (`car_rental`, `rome_transfer`, `trains`, `travel_directions`). Dla każdej sekcji renderuje tytuł, body (markdown), lista linków zewnętrznych z `rel="noopener noreferrer"`.

#### Task 12.1–12.7 — Restauracje i miejsca publiczne
6 plików:
- `RestaurantCard.tsx`, `PlaceCard.tsx` — analogicznie do `ApartmentCard`
- `MapEmbed.tsx` — buduje URL `https://www.google.com/maps/search/?api=1&query=lat,lng` lub `?query_place_id=`. Z kluczem `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` renderuje `<iframe>`. Bez klucza — sam link.
- `ReviewList.tsx` (server) — lista approved reviews
- `ReviewForm.tsx` (client) — analogicznie do BookingForm, POST `/api/reviews`
- `GuestPhotoUploader.tsx` (client) — file input + multipart fetch
- Strony `/restaurants`, `/restaurants/[slug]`, `/places`, `/places/[slug]`

Dane pobierane z `restaurants` / `attractions` przez nowe helpery w `src/lib/data/`. Wzorzec:
```ts
// src/lib/data/restaurants.ts
export async function getRestaurants(client, region?: 'orte_area' | 'rome') {
  let q = client.from('restaurants').select('*').not('published_at','is',null).is('deleted_at', null);
  if (region) q = q.eq('region', region);
  return q.then(/* map snake → camel */);
}
```

#### Task 13.1–13.4 — Sekcja Rzym
Czterostronicowa sekcja dla treści z tabel `restaurants` (region='rome'), `attractions` (region='rome'), `rome_itinerary`, `rome_info_sections`. Strony szczegółu (`/restaurants/[slug]`) działają już dla obu regionów.

#### Task 16.1–16.4 — Admin CMS dla restauracji/atrakcji/Rzymu/info
Edytory formularzowe analogiczne do edytora apartamentu (14.3). Każdy ma własny endpoint POST/PATCH/DELETE. Soft-delete dla restaurants/attractions (UPDATE `deleted_at`). Walidacja przez gotowe walidatory `validateRestaurant`, `validateAttraction`.

#### Task 17.1–17.3 — Moderacja
- 17.1 `/admin/reviews` — kolejka z akcjami zatwierdź/odrzuć/ukryj. Endpoint `PATCH /api/admin/reviews/[id]` ze statusem.
- 17.2 `/admin/photos` — analogicznie + Trwale usuń (DELETE z bucketa).
- 17.3 Helper signed URL: `getApprovedGuestPhotosWithUrls(targetType, targetId)`. Pattern:
```ts
const { data } = await client.storage.from('guest-media').createSignedUrl(path, 60 * 15);
```

#### Task 18.1 — `/admin/settings`
Formularz pól `site_settings`. Endpoint `PATCH /api/admin/settings`. Po sukcesie `revalidatePath('/', 'layout')`.

### 🟢 PRIORYTET NISKI — polish, testy, hardening

- 9.1 `ApartmentGallery` z lightbox (obecnie mock)
- 9.5 Testy RTL dla `AvailabilityCalendar`
- 15.1 `AdminCalendar` client component (wizualny kalendarz z modal-ami) — obecnie lista MVP
- 19.1 Audyt API — testy integracyjne że żaden public endpoint nie zwraca PII
- 19.2 Manualny test RLS w Supabase Studio
- 19.3 Audyt dostępności (axe DevTools, NVDA)
- 19.4 Manualny test responsywności (320–1920 px)
- 20.1 Skopiuj `docs/` z `bellaorte/` do `bellaorte2/`
- 20.2 README.md z opisem projektu i instrukcji deploy
- 20.3 Pełen run: `npm run lint && npm test && npm run build`

---

## 4. Konwencje, na które kolejny model musi uważać

### TypeScript strict
`tsconfig.json` ma `strict: true`. Każde `any`, `as` musi być uzasadnione komentarzem.

### Polskie komunikaty
Wszystkie teksty UI po polsku (Wymaganie 45). Komentarze w kodzie po angielsku jest OK.

### Brak ceny / brak płatności
**Wymaganie 4 + 9:** żaden komponent ani tabela bazy nie zawiera ceny. Cały flow rezerwacji to "wyślij zapytanie → admin potwierdza ręcznie".

### PII discipline (Wymaganie 42)
Public endpointy NIGDY nie zwracają guest PII (full_name, email, phone, message). Test: każdy endpoint w `src/app/api/*` (oprócz `/api/admin/*`) powinien zwracać tylko `{ id }` lub agregaty bez PII.

### Service-role tylko serwer
`createServiceClient()` w `src/lib/supabase/admin.ts` ma guard `if (typeof window !== 'undefined') throw`. Nigdy nie importuj go z client component (`'use client'`).

### RLS jako defense-in-depth
W route handlerach które używają service-role wciąż dodawaj filtry `where` w query. RLS jest ostatnią linią obrony, nie pierwszą.

### Mocki vs. Supabase
Strony publiczne (`/`, `/apartments`, `/apartments/[slug]`, `/booking`) mają fallback na mocki z `src/lib/mock-data.ts` jeśli env var Supabase nie jest ustawiony. To pozwala dev preview bez bazy. Po podłączeniu produkcji **nie usuwaj mocków** — działają jako safety net.

### Kolory i tokeny
Wszystkie kolory pochodzą z `@theme` w `src/app/globals.css`. Użyj utility classes: `bg-ivory`, `bg-italian-green`, `text-cypress`, `text-terracotta`, `bg-soft-green`, `border-border`, `text-muted`. Nie wprowadzaj nowych hex-ów inline.

### Fonty
- `heading-display` / `heading-section` — Cormorant Garamond
- `text-ui` (default) — Inter
- `text-eyebrow` — mała kicker label uppercase

---

## 5. Komendy

```bash
# Praca lokalna
npm run dev              # http://127.0.0.1:3000
npm test                 # vitest unit tests
npm run lint
npm run build            # produkcyjny build, obowiązkowy przed PR

# Supabase
# 1) Stwórz projekt na supabase.com
# 2) W SQL Editor odpal: schema.sql → rls.sql → storage.sql → seed.sql
# 3) Authentication → Add user → skopiuj UUID
# 4) INSERT INTO admin_users (user_id) VALUES ('<uuid>')
# 5) Skopiuj .env.example do .env.local i wypełnij
```

---

## 6. Ostrzeżenia / pułapki

1. **PowerShell + npm** — wywołania `npm run X` z PowerShell w pipeline (`| Select-Object`) wywalają się. Używaj `npm.cmd` jeśli musisz pipe-ować.
2. **Tasks tooling** — Kiro `task_update` może czasem łapać EPERM (lock pliku meta). Wtedy edytuj `.kiro/specs/bellaorte/tasks.md` ręcznie zmieniając `[ ]` → `[x]`.
3. **Next.js 16 turbopack** — czasem cache miesza w dev mode. Jeśli widzisz dziwne 500-tki, ubij dev server, usuń `.next/`, odpal ponownie.
4. **`useSearchParams` Promise** — w Next.js 16 `searchParams` w Server Component to **Promise**. Zawsze: `const params = await searchParams;`
5. **`cookies()` Promise** — to samo: `const cookieStore = await cookies();`
6. **Supabase joins typing** — Postgrest zwraca `apartments: {...} | {...}[] | null`. Zawsze normalizuj przez Array.isArray check (zobacz `loadSummary` w `/booking/confirmation`).
7. **`request.ip` nie istnieje** w nowszym Next.js. Używaj tylko `getClientIp` z headers (jest to udokumentowane w `memory-store.ts`).

---

## 7. Co NIE jest udokumentowane w spec, ale wynika z implementacji

- Mocki SVG dla apartamentów są w `public/placeholders/`. Po podłączeniu Supabase + bucket, te ścieżki będą przesłaniane przez prawdziwe URL-e z `gallery_photos.storage_path`.
- `MOCK_NEXT_AVAILABLE` w `mock-data.ts` to placeholder dla "najbliższego wolnego terminu" pokazywanego na karcie. Należy zastąpić funkcją która liczy to z `getAvailability` (przeskanować pierwszych 60 dni, znaleźć pierwszy `available`).
- Sidebar admina (`AdminSidebar`) linkuje do stron które jeszcze nie istnieją (`/admin/restaurants`, `/admin/places`, `/admin/rome`, `/admin/reviews`, `/admin/photos`, `/admin/settings`). Dopóki te strony nie powstaną, kliknięcie da 404 — to świadoma decyzja, bo lepiej widzieć pełną strukturę nawigacji niż linki znikające.

---

## 8. Pierwsze kroki nowego modelu

1. Przeczytaj `requirements.md`, `design.md`, `tasks.md` w `.kiro/specs/bellaorte/`.
2. Przeczytaj ten plik (HANDOFF.md) całość.
3. Odpal `npm run build` żeby się upewnić że projekt się kompiluje.
4. Wybierz pierwszy task z 🔴 lub 🟡 (zgodnie z priorytetami biznesowymi).
5. Skopiuj wzorzec z najbardziej podobnego pliku już istniejącego (np. dla nowego endpointu admin patrz `src/app/api/admin/booking-inquiries/[id]/route.ts`).
6. Po każdym ukończonym tasku: `npm run build` musi przejść, `npm test` musi przejść, oznaczyć `[x]` w `tasks.md`.

Powodzenia.
