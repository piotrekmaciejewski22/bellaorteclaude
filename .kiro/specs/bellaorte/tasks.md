`````````````````````````````````````````````````````# Implementation Plan: BELLAORTE

- [x] 1. Inicjalizacja projektu Next.js i konfiguracja stosu
- [x] 1.1 Utwórz projekt Next.js 16 App Router w `bellaorte2/` z TypeScriptem, Tailwind v4, ESLintem i strukturą `src/`
  - Wygeneruj scaffold Next.js (z TS, Tailwind, ESLint, App Router, src dir, alias `@/*`)
  - W `package.json` dodaj skrypty `dev` (port 3000, host 127.0.0.1), `build`, `start`, `serve`, `preview`, `lint`
  - W `tsconfig.json` włącz `strict: true`
  - Skonfiguruj Tailwind v4 (CSS-only config) w `src/app/globals.css` — zarejestruj plugin w `postcss.config.mjs`
  - Dodaj `lucide-react` jako zależność
  - _Wymagania: 48_

- [x] 1.2 Skonfiguruj Italian_Flag_Theme i fonty w `globals.css` i root layout
  - Dodaj tokeny CSS: `--ivory`, `--italian-green`, `--terracotta`, `--ink`, `--muted`, `--border`
  - Załaduj Cormorant Garamond (display) i Inter (UI) przez `next/font/google`
  - W `src/app/layout.tsx` ustaw zmienne fontów na `<html>`, ustaw lang="pl"
  - W `globals.css` zdefiniuj utility classes dla nagłówków display i tekstu UI
  - _Wymagania: 45_

- [x] 1.3 Dodaj `.env.example` i klienty Supabase (browser, server, admin)
  - Stwórz `.env.example` z `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`
  - W `src/lib/supabase/browser.ts` utwórz `createBrowserClient` (anon)
  - W `src/lib/supabase/server.ts` utwórz `createServerClient` (cookies-aware)
  - W `src/lib/supabase/admin.ts` utwórz `createServiceClient` (service role, tylko serwer, dodaj guard `if (typeof window !== 'undefined') throw`)
  - Dodaj `@supabase/supabase-js` jako zależność
  - _Wymagania: 48, 49_

- [x] 1.4 Skonfiguruj globalne typy domeny i stałe w `src/lib/types.ts` i `src/lib/constants.ts`
  - W `types.ts` zdefiniuj typy: `DayStatus`, `Apartment`, `BookingInquiry`, `Reservation`, `CalendarBlock`, `Restaurant`, `Attraction`, `Review`, `GuestPhoto`, `TravelInfo`, `RomeItineraryItem`, `RomeInfoSection`, `SiteSettings`, `AdminUser`, `GalleryPhoto`, `Region`, `ModerationStatus`, `InquiryStatus`, `ReservationStatus`, `BlockReason`, `SourceKind`, `DayPart`, `RomeInfoKind`, `TravelInfoKind`
  - W `constants.ts` zdefiniuj: `MAX_REVIEW_BODY = 1000`, `MIN_REVIEW_BODY = 10`, `MAX_SIGNATURE = 60`, `MIN_SIGNATURE = 2`, `MAX_PHOTO_BYTES = 8 * 1024 * 1024`, `ALLOWED_PHOTO_MIME = ['image/jpeg','image/png','image/webp']`, `RATE_LIMITS`
  - _Wymagania: 48_

- [x] 2. Schemat bazy danych Supabase i polityki RLS
- [x] 2.1 Utwórz `supabase/schema.sql` z tabelami domenowymi i CHECK constraintami
  - Włącz rozszerzenia `pgcrypto`, `btree_gist`
  - Zdefiniuj enumy: `inquiry_status`, `reservation_status`, `block_reason`, `region_kind`, `moderation_status`, `day_part`, `rome_info_kind`, `travel_info_kind`
  - Utwórz tabele: `apartments`, `gallery_photos`, `booking_inquiries`, `reservations` (z EXCLUDE constraint), `calendar_blocks`, `restaurants`, `attractions`, `reviews`, `guest_photos`, `rome_itinerary`, `rome_info_sections`, `travel_info`, `site_settings` (singleton CHECK id=1), `admin_users`
  - Dodaj indeksy: `(apartment_id, check_in, check_out)`, `(status)`, `(restaurant_id, status)`, `(attraction_id, status)`
  - Dodaj kolumnę `source_kind` w `gallery_photos` z CHECK na 5 wartości (`placeholder_orte`, `placeholder_italy`, `placeholder_rome`, `interior_real`, `exterior_real`)
  - Dodaj CHECK w `gallery_photos`, `reviews`, `guest_photos`, że dokładnie jedno z `apartment_id`/`restaurant_id`/`attraction_id` jest NOT NULL
  - _Wymagania: 30, 40, 41, 42, 48_

- [x] 2.2 Dodaj funkcję RPC `get_availability` w `schema.sql`
  - Funkcja `get_availability(p_apartment_id, p_from, p_to)` zwraca `(date DATE, status TEXT)` z priorytetem `blocked > reserved > pending > available`
  - Użyj `generate_series` na zakresach z `calendar_blocks`, `reservations` (status='active'), `booking_inquiries` (status='pending')
  - `SECURITY DEFINER`, `STABLE`, `GRANT EXECUTE TO anon, authenticated`
  - _Wymagania: 7, 8, 42_

- [x] 2.3 Włącz RLS i utwórz polityki dla wszystkich tabel
  - Public read na `apartments` WHERE `published_at IS NOT NULL`
  - Public read na `restaurants`, `attractions` WHERE `published_at IS NOT NULL AND deleted_at IS NULL`
  - Public read na `gallery_photos`
  - Public read na `reviews`, `guest_photos` WHERE `status = 'approved'`
  - Public read na `rome_itinerary`, `rome_info_sections`, `travel_info`, `site_settings` (z odpowiednimi warunkami)
  - **Brak public read** na `booking_inquiries`, `reservations`, `calendar_blocks` (dostęp tylko przez RPC `get_availability` lub service role)
  - Admin write: `auth.uid() IN (SELECT user_id FROM admin_users)` dla wszystkich tabel
  - _Wymagania: 38, 42_

- [x] 2.4 Utwórz `supabase/storage.sql` z bucketami i policy
  - Bucket `site-media`: `public = true`, write tylko service role
  - Bucket `guest-media`: `public = false`, write z anon przez API, read przez signed URL
  - _Wymagania: 39_

- [x] 2.5 Utwórz `supabase/seed.sql` z danymi demo
  - 2 apartamenty (slugi `casa-orte-uno`, `casa-orte-due`) z opisami i `published_at = now()`
  - Po 3 zdjęcia placeholderowe na apartament (`source_kind = 'placeholder_orte'`)
  - 5 restauracji (3 orte_area, 2 rome) z Map_Data
  - 5 atrakcji (3 orte_area, 2 rome) z Map_Data
  - 4 itinerary points (morning, noon, afternoon, evening)
  - 5 rome_info_sections (po jednym z każdego `kind`)
  - 4 travel_info (po jednym z każdego `kind`)
  - 1 wiersz site_settings z domyślnymi treściami
  - _Wymagania: 4, 14, 16, 18, 20, 21, 22_

- [x] 2.6 Dodaj `docs/supabase-setup.md` z instrukcją wdrożenia bazy
  - Krok 1: utwórz projekt Supabase
  - Krok 2: w SQL Editor uruchom kolejno `schema.sql`, `rls.sql`, `storage.sql`, `seed.sql`
  - Krok 3: w Authentication → Users dodaj admina i wpisz jego `id` do `admin_users`
  - Krok 4: skopiuj `.env.example` do `.env.local`, uzupełnij URL i klucze
  - _Wymagania: 26, 49_

- [x] 3. Walidacja serwerowa (czysta, testowalna)
- [x] 3.1 Utwórz `src/lib/validation/booking-inquiry.ts` z funkcją `validateBookingInquiry(payload, apartment)`
  - Sprawdź wymagane pola (apartmentId, checkIn, checkOut, adults, fullName, email, consent)
  - Sprawdź `checkOut > checkIn`
  - Sprawdź `checkIn >= today`
  - Sprawdź format email (regex)
  - Sprawdź `adults >= 1`
  - Sprawdź `adults + children <= apartment.maxGuests`
  - Sprawdź `consent === true`
  - Zwracaj `{ ok: true } | { ok: false, errors: Array<{field, message}> }`
  - Komunikaty PL zgodne z Wymaganiem 10
  - _Wymagania: 10, 12, 44_

- [x] 3.2 Utwórz `src/lib/validation/review.ts` z funkcją `validateReview(payload)`
  - Walidacja: `signature` 2-60, `body` 10-1000, `rating` integer 1-5, `consent === true`, `targetType in ['restaurant','attraction']`, `targetId UUID`
  - _Wymagania: 23, 44_

- [x] 3.3 Utwórz `src/lib/validation/guest-photo.ts` z funkcją `validateGuestPhoto(file, payload)`
  - Walidacja: `file.size <= 8 * 1024 * 1024`, `file.type in ALLOWED_PHOTO_MIME`, `targetType`, `targetId`, opcjonalny `reviewId UUID`
  - _Wymagania: 24, 44_

- [x] 3.4 Utwórz walidatory dla apartamentu, restauracji, atrakcji
  - `validation/apartment.ts`: nazwa, slug (kebab-case regex), maxGuests >= 1, bedrooms >= 0, bathrooms >= 0
  - `validation/restaurant.ts`: nazwa, slug, region in ['orte_area','rome'], wymagane Map_Data (adres + (placeId LUB latlng))
  - `validation/attraction.ts`: nazwa, slug, region, Map_Data jak wyżej
  - _Wymagania: 28, 31, 32, 41_

- [x] 3.5 Napisz testy walidacji w `src/lib/validation/__tests__/`
  - Vitest jako runner; dodaj `vitest`, `@vitest/ui` do devDependencies; skrypt `test` w package.json
  - Test booking-inquiry: 8 case'ów (każdy błąd osobno + happy path)
  - Test review: 5 case'ów
  - Test guest-photo: 3 case'y
  - Test apartment/restaurant/attraction: po 3 case'y
  - _Wymagania: 10, 23, 24_

- [x] 4. Logika kalendarza i rate limiting
- [x] 4.1 Utwórz `src/lib/data/availability.ts` z funkcją `getAvailability(client, apartmentId, from, to)`
  - Wywołaj RPC `get_availability` przez `supabase.rpc('get_availability', {...})`
  - Mapuj wynik na `DayStatusEntry[]`
  - Eksportuj typ `DayStatus` i `DayStatusEntry`
  - _Wymagania: 7, 8, 42_

- [x] 4.2 Utwórz `src/lib/rate-limit/memory-store.ts` z funkcją `checkRateLimit(key, limit, windowMs)`
  - Map<string, {count, windowStart}> w module scope
  - Zwraca `{ allowed: boolean, retryAfter?: number }`
  - Wyciąganie IP w helperze `getClientIp(request)` z nagłówków `x-forwarded-for`, `x-real-ip`, fallback do `request.ip`
  - W komentarzu zaznacz, że to MVP-only i potrzeba Redis dla multi-instance
  - Dodaj test jednostkowy: w oknie 1s, limit 3, czwarte żądanie odrzucone
  - _Wymagania: 12, 23 (rate limit), 26, 44_

- [x] 4.3 Utwórz `src/lib/data/booking.ts` z `createBookingInquiry(client, payload, ip)`
  - Sprawdź konflikt z `reservations` (active) i `calendar_blocks` przez query `WHERE apartment_id = ... AND daterange(check_in, check_out, '[)') && daterange($from, $to, '[)')`
  - Jeśli konflikt — rzuć `ConflictError`
  - INSERT do `booking_inquiries` z `consent_at = now()`, `status = 'pending'`, `source_ip = ip`
  - Zwróć rekord
  - _Wymagania: 9, 10 #5, 30 #6_

- [x] 5. Route handlery publiczne
- [x] 5.1 Endpoint `GET /api/availability`
  - Plik `src/app/api/availability/route.ts`
  - Czyta query params `apartmentId`, `from`, `to`
  - Waliduje UUID i daty
  - Wywołuje `getAvailability` z server clientem (anon)
  - Zwraca `{ days: DayStatusEntry[] }`
  - **Nigdy** nie zwraca danych gościa
  - _Wymagania: 7, 42_

- [x] 5.2 Endpoint `POST /api/booking-inquiries`
  - Plik `src/app/api/booking-inquiries/route.ts`
  - Rate limit 10/10min na IP (zwróć 429 + `Retry-After`)
  - Pobierz apartament dla `maxGuests`
  - Wywołaj `validateBookingInquiry(payload, apartment)` — błąd 400 z listą `errors`
  - Wywołaj `createBookingInquiry` — `ConflictError` → 409, sukces → 201 z `{ id }`
  - _Wymagania: 9, 10, 12, 44_

- [x] 5.3 Endpoint `POST /api/reviews`
  - Plik `src/app/api/reviews/route.ts`
  - Rate limit 20/60min na IP
  - Walidacja `validateReview`
  - Sprawdź, że `targetId` istnieje (Restaurant lub Attraction) i jest opublikowany
  - INSERT do `reviews` z `status = 'pending'`
  - Zwróć 201 z `{ id }`
  - _Wymagania: 23, 25, 44_

- [x] 5.4 Endpoint `POST /api/guest-photos`
  - Plik `src/app/api/guest-photos/route.ts`
  - `multipart/form-data` parsing przez `request.formData()`
  - Rate limit (taki sam pool jak reviews)
  - Walidacja `validateGuestPhoto`
  - Sprawdź istnienie targetu
  - Upload pliku do bucketa `guest-media` przez service client (path: `targetType/targetId/uuid.ext`)
  - INSERT do `guest_photos` z `status = 'pending'`, `storage_path`, `mime_type`, `size_bytes`
  - Zwróć 201 z `{ id }`
  - _Wymagania: 24, 25, 39, 44_

- [x] 6. Auth admina i guard
- [x] 6.1 Strona `/admin/login`
  - Plik `src/app/admin/login/page.tsx` (Server Component) + komponent klient `LoginForm.tsx`
  - Formularz email + password
  - Submit przez Server Action wywołujący `supabase.auth.signInWithPassword`
  - Po sukcesie sprawdź, że `user.id` jest w `admin_users` — jeśli nie, wyloguj i pokaż "Brak uprawnień"
  - Po pełnym sukcesie redirect do `/admin` (lub `?next=...`)
  - Komunikat błędu generyczny "Nieprawidłowy email lub hasło"
  - _Wymagania: 26_

- [x] 6.2 Helper `src/lib/auth/session.ts` i `src/lib/auth/require-admin.ts`
  - `getAdminSession()` — czyta sesję z cookies przez server client, zwraca `null` lub `{ userId }` jeśli `userId` jest w `admin_users`
  - `requireAdmin(request)` w Route Handlerach — rzuca 401 jeśli brak sesji admina
  - _Wymagania: 26, 38_

- [x] 6.3 Layout `/admin/layout.tsx` z guardem
  - Server Component
  - Wywołuje `getAdminSession()`; jeśli null, `redirect('/admin/login?next=' + pathname)`
  - Renderuje `<AdminSidebar>` + `<main>{children}</main>`
  - _Wymagania: 26, 38_

- [x] 7. Layouty publiczne i strony statyczne
- [x] 7.1 Komponenty `SiteHeader` i `SiteFooter`
  - `SiteHeader.tsx` (Server) z logo BELLAORTE, menu (`/apartments`, `/guide`, `/rome`, `/useful-info`, `/booking`)
  - Klient `MobileNav.tsx` dla menu mobilnego (< 768px)
  - `SiteFooter.tsx` (Server) z lokalizacją, linkiem do `/privacy`, danymi kontaktowymi z `site_settings`
  - _Wymagania: 2, 47_

- [x] 7.2 Layout `(public)/layout.tsx` i `not-found.tsx`, `error.tsx`
  - Layout z `SiteHeader`, `<main>`, `SiteFooter`
  - `not-found.tsx` z linkami do `/` i `/apartments`
  - `error.tsx` z komunikatem PL i linkiem do `/`, loguje błąd po stronie serwera (console.error w try/catch)
  - _Wymagania: 2, 3_

- [x] 7.3 Strona `/privacy`
  - Renderuje `site_settings.privacy_policy_md` (markdown → HTML przez prosty parser lub `react-markdown`)
  - Dodaj `react-markdown` do dependencies
  - _Wymagania: 43_

- [x] 8. Strona główna i lista apartamentów
- [x] 8.1 Komponent `ApartmentCard`
  - Server Component
  - Props: apartament + status najbliższej dostępności (string)
  - Wyświetla: zdjęcie (pierwsze z gallery), nazwę, max_guests, bedrooms, bathrooms, status, link do `/apartments/[slug]`
  - **Brak ceny w UI**
  - _Wymagania: 4_

- [x] 8.2 Strona główna `/page.tsx`
  - Server Component
  - Pobiera 2 apartamenty (`getApartments()`)
  - Dla każdego liczy najbliższą dostępność (`computeNextAvailability`)
  - Renderuje `<HeroSection>` + 2 `<ApartmentCard>` + CTA `Sprawdź dostępność` → `/booking` + linki nawigacyjne do `/apartments`, `/guide`, `/restaurants`, `/places`, `/rome`, `/useful-info`
  - _Wymagania: 1_

- [x] 8.3 Strona `/apartments`
  - Server Component, lista 2 apartamentów (tylko `published_at IS NOT NULL`)
  - Każdy `<ApartmentCard>` z linkiem do `/apartments/[slug]`
  - _Wymagania: 4_

- [x] 9. Szczegół apartamentu i kalendarz publiczny
- [x] 9.1 Komponent `ApartmentGallery` (client)
  - Props: lista zdjęć (URL + alt)
  - Renderuje miniatury + lightbox (modal)
  - Galeria responsywna: < 768px scroll poziomy lub kolumna; ≥ 768px grid
  - Walidacja: pokazuje wyłącznie zdjęcia z `gallery_photos.source_kind` ∈ {`placeholder_orte`, `placeholder_italy`, `placeholder_rome`, `exterior_real`} dla apartamentu, **chyba że** istnieją zdjęcia `interior_real` — wtedy pokazuj również interior
  - Każde `<img>` ma `alt`
  - _Wymagania: 5, 6, 40, 46 #5, 47_

- [x] 9.2 Komponent `StatusLegend`
  - Server Component
  - Pokazuje 4 statusy z kolorami i tekstem (Wolne, Oczekuje, Zarezerwowane, Zablokowane)
  - _Wymagania: 7_

- [x] 9.3 Komponent `AvailabilityCalendar` (client)
  - Renderuje 3 miesiące w gridzie 7-kol
  - Fetch `GET /api/availability` na mount oraz przy zmianie zakresu miesięcy
  - Każdy dzień: kolor wg statusu + `aria-label` z datą i statusem (PL)
  - Klik na `available`/`pending` w zakresie min. 1 noc, max wg apartamentu — wybór zakresu
  - Klik na `reserved`/`blocked` — toast "Termin niedostępny"
  - Klik na `pending` — toast/banner "Termin tymczasowo zarezerwowany przez innego gościa"
  - Po wybraniu zakresu → przycisk "Sprawdź dostępność" → `router.push('/booking?apartmentId=...&checkIn=...&checkOut=...')`
  - Touch target min 40x40 px
  - _Wymagania: 7, 8, 46 #4, 47 #3_

- [x] 9.4 Strona `/apartments/[slug]`
  - Server Component
  - `getApartmentBySlug(slug)` — jeśli null, `notFound()`
  - Renderuje: nazwę, opis, udogodnienia, zasady pobytu, `<ApartmentGallery>`, `<StatusLegend>`, `<AvailabilityCalendar>`, CTA do `/booking?apartmentId=...`
  - **Brak ceny**
  - _Wymagania: 5, 6_

- [x] 9.5 Komponentowy test `AvailabilityCalendar` (RTL)
  - Mock fetch zwraca przykładowe statusy
  - Test 1: kliknięcie `reserved` jest blokowane
  - Test 2: kliknięcie `pending` pokazuje ostrzeżenie ale dopuszcza zaznaczenie
  - Test 3: aria-label zawiera status w tekście
  - _Wymagania: 7, 8, 46_

- [x] 10. Booking form i potwierdzenie
- [x] 10.1 Komponent `BookingForm` (client)
  - Pola: apartament (select 1 z 2), checkIn (date), checkOut (date), adults, children, fullName, email, phone (opt), message (opt), consent (checkbox)
  - Preselekcja z query params (`apartmentId`, `checkIn`, `checkOut`)
  - Walidacja klienta zgodna z Wym. 10 (8 reguł)
  - Submit → `fetch('/api/booking-inquiries')` POST JSON
  - 200/201 → `router.push('/booking/confirmation?ref=...')`
  - 400 → komunikaty inline z `errors[*]`
  - 409 → komunikat o konflikcie, fokus na pola dat
  - 429 → komunikat "Zbyt wiele prób"
  - **Brak pól ceny / płatności**
  - _Wymagania: 9, 10, 11_

- [x] 10.2 Strona `/booking`
  - Server Component
  - Pobiera 2 apartamenty
  - Renderuje `<BookingForm apartments={...} />` z query params jako preselect
  - _Wymagania: 9_

- [x] 10.3 Strona `/booking/confirmation`
  - Server Component
  - Czyta query `?ref=...`, pobiera Booking_Inquiry przez service client (publicznie nie pokazujemy danych — tylko podsumowanie nieosobowe: apartament, daty, liczba gości)
  - Komunikat "Twoje zapytanie zostało wysłane. Termin wymaga ręcznego potwierdzenia. Odpowiedź przyjdzie e-mailem."
  - Linki do `/` i `/apartments`
  - **Brak ceny**
  - _Wymagania: 11_

- [x] 11. Hub przewodnika i strony Useful Info
- [x] 11.1 Strona `/guide`
  - Server Component
  - Linki do `/restaurants`, `/places`, `/rome`, `/useful-info` z opisami
  - Sekcja "Polecane" z 3 kartami restauracji + 3 kartami atrakcji (najnowsze published)
  - _Wymagania: 13_

- [x] 11.2 Strona `/useful-info`
  - Server Component
  - Pobiera `travel_info` (published, sortowane po `display_order`)
  - Renderuje sekcje pogrupowane po `kind` (car_rental, rome_transfer, trains, travel_directions)
  - Linki zewnętrzne otwierane w nowej karcie z `rel="noopener noreferrer"`
  - _Wymagania: 22_

- [x] 12. Restauracje i miejsca (publiczne)
- [x] 12.1 Komponent `RestaurantCard` i `PlaceCard`
  - Server Components
  - Props: obiekt + średnia ocena (lub "Brak ocen")
  - Renderuje miniaturkę z `gallery_photos`, nazwę, opis (truncate), kategorie/tagi, średnią
  - _Wymagania: 14, 16_

- [x] 12.2 Komponent `MapEmbed`
  - Server Component
  - Buduje `https://www.google.com/maps/search/?api=1&query=lat,lng` lub `?query_place_id=`
  - Jeśli `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` ustawione i są coords/placeId — renderuje `<iframe>` z Maps Embed API
  - Bez klucza — sam link "Otwórz w Google Maps" + adres
  - Bez Map_Data — tylko adres tekstowy
  - _Wymagania: 41_

- [x] 12.3 Komponent `ReviewList`
  - Server Component
  - Props: lista review (status='approved')
  - Renderuje sygnaturę, ocenę (gwiazdki), tekst, datę
  - _Wymagania: 15, 17_

- [x] 12.4 Komponent `ReviewForm` (client)
  - Pola: signature, rating (1-5 stars), body, photo (opt), consent
  - Walidacja klienta wg Wym. 23
  - Submit → `POST /api/reviews`; jeśli photo, równolegle `POST /api/guest-photos` z `reviewId` z odpowiedzi
  - Sukces → komunikat "Twoja opinia czeka na moderację" + reset formularza
  - _Wymagania: 23, 24, 25_

- [x] 12.5 Komponent `GuestPhotoUploader` (client) standalone
  - Props: targetType, targetId
  - File input + walidacja (mime, size)
  - Submit → `POST /api/guest-photos` (multipart)
  - Komunikat o moderacji
  - _Wymagania: 24, 25_

- [x] 12.6 Strony `/restaurants`, `/restaurants/[slug]`
  - `/restaurants/page.tsx`: lista restauracji z `region='orte_area'`, filtry po cuisine_categories i tags (Server Component + Client filterer dla checkboxów)
  - `/restaurants/[slug]/page.tsx`: pobiera restaurant; jeśli null, `notFound()`. Renderuje: nazwę, opis, kategorie, tagi, godziny, telefon, www, wskazówkę, `<MapEmbed>`, galeria (admin photos + approved guest photos), `<ReviewList>`, `<ReviewForm>`
  - _Wymagania: 14, 15_

- [x] 12.7 Strony `/places`, `/places/[slug]`
  - Analogicznie do restauracji, region='orte_area'
  - Strona szczegółu z opisem, tagami, wskazówkami praktycznymi, info dojazdowym, `<MapEmbed>`, galerią, `<ReviewList>`, `<ReviewForm>`
  - _Wymagania: 16, 17_

- [x] 13. Sekcja Rzym
- [x] 13.1 Strona `/rome`
  - Server Component
  - Linki do `/rome/restaurants`, `/rome/places`, `/rome/itinerary`, `/rome/info`
  - Sekcja "Dojazd z Orte" — krótki tekst statyczny w pliku komponentu z czasem pociągu/samochodu
  - _Wymagania: 18_

- [x] 13.2 Strony `/rome/restaurants` i `/rome/places`
  - Renderują listy restauracji/atrakcji z `region='rome'` używając tych samych komponentów co w obszarze Orte
  - Strony szczegółu używają tych samych routes (`/restaurants/[slug]`, `/places/[slug]`) — slug i region oddzielają zawartość
  - _Wymagania: 19_

- [x] 13.3 Strona `/rome/itinerary`
  - Server Component
  - Pobiera `rome_itinerary` (published, sort po `day_part`, `display_order`)
  - Renderuje 4 grupy (poranek, południe, popołudnie, wieczór) z punktami
  - Każdy punkt linkuje do `linked_restaurant_id` lub `linked_attraction_id` jeśli ustawione
  - `<MapEmbed>` dla każdego punktu z linkowanym obiektem
  - _Wymagania: 20_

- [x] 13.4 Strona `/rome/info`
  - Server Component
  - Pobiera `rome_info_sections` (5 sekcji)
  - Renderuje każdą sekcję z tytułem i body (markdown)
  - _Wymagania: 21_

- [x] 14. Admin: dashboard i CMS apartamentów
- [x] 14.1 Komponent `AdminSidebar` i `AdminMetricCard`
  - Sidebar (Server) z linkami do wszystkich sekcji `/admin/*`
  - Metric card (Server) — tytuł, liczba, link, kolor
  - _Wymagania: 27_

- [x] 14.2 Strona `/admin` (dashboard)
  - Server Component (auth via layout)
  - Pobiera liczniki: `pending` inquiries, `pending` reviews, `pending` guest photos, najbliższe rezerwacje
  - Renderuje 3 metric cards + tabelę najbliższych rezerwacji + skróty do sekcji
  - _Wymagania: 27_

- [x] 14.3 Strony `/admin/apartments` i `/admin/apartments/[id]`
  - Lista 2 apartamentów (tabela)
  - Edytor — pola: nazwa, slug, opis, max_guests, bedrooms, bathrooms, amenities (multi-input), house_rules, published_at toggle
  - Sekcja galerii: lista zdjęć z miniaturami, przycisk dodaj (file input → POST `/api/admin/apartments/[id]/photos`), przycisk usuń (DELETE)
  - **Brak pola ceny**
  - _Wymagania: 28_

- [x] 14.4 Endpoint `PATCH /api/admin/apartments/[id]`
  - Auth admin
  - Walidacja `validateApartment` (slug unikalny, max_guests >= 1)
  - UPDATE w `apartments`
  - `revalidatePath('/apartments')` i `/`
  - _Wymagania: 28, 38, 44_

- [x] 14.5 Endpoint `POST /api/admin/apartments/[id]/photos` i `DELETE /api/admin/apartments/[id]/photos/[photoId]`
  - Auth admin
  - POST: walidacja MIME/size, upload do `site-media/apartments/[id]/`, INSERT `gallery_photos` z wybranym `source_kind` (z payload)
  - DELETE: pobierz `storage_path`, usuń z bucketa, DELETE z tabeli
  - _Wymagania: 28 #3-4, 39, 40_

- [x] 14.6 Walidacja "dokładnie 2 apartamenty" w API admina
  - W endpointach jeśli istnieje `POST /api/admin/apartments` — zwracaj 422 z komunikatem "MVP obsługuje dokładnie 2 apartamenty"
  - DELETE również zwraca 422 (nie pozwala usunąć)
  - _Wymagania: 28 #6_

- [x] 15. Admin: kalendarz, zapytania i rezerwacje
- [x] 15.1 Komponent `AdminCalendar` (client)
  - Renderuje kalendarz z 4 statusami (jak public ale z większą gęstością)
  - Klik `available` → modal "Dodaj blokadę" (apartament, dates, reason, note) → POST `/api/admin/calendar-blocks`
  - Klik `reserved` → modal ze szczegółem rezerwacji (dane gościa)
  - Klik `pending` → modal ze szczegółem zapytania + akcje "Zatwierdź"/"Odrzuć"
  - Klik `blocked` → modal z reason/note + "Usuń blokadę"
  - _Wymagania: 29_

- [x] 15.2 Strona `/admin/calendar`
  - Server Component
  - Renderuje `<AdminCalendar>` + selektor apartamentu + przełącznik widoku miesięczny/lista
  - _Wymagania: 29_

- [x] 15.3 Endpointy `/api/admin/calendar-blocks` (POST, PATCH, DELETE)
  - Auth admin
  - POST: walidacja zakresu, sprawdź konflikt z `reservations` (active) — 409 jeśli koliduje
  - DELETE: usuń blokadę
  - _Wymagania: 29 #3-4_

- [x] 15.4 Strona `/admin/reservations` z `<ReservationTable>`
  - Server Component pobiera `booking_inquiries` + `reservations` (z dołączonym apartamentem)
  - Client component `ReservationTable` — filtry po statusie i apartamencie
  - Akcje: Zatwierdź (POST `/api/admin/booking-inquiries/[id]` z body `{action: 'confirm'}`), Odrzuć (`{action: 'reject'}`), Notatka (PATCH z `admin_note`)
  - Kolumna z anulowaniem rezerwacji (DELETE `/api/admin/reservations/[id]`)
  - **Tylko panel widzi dane gościa**
  - _Wymagania: 30_

- [x] 15.5 Endpoint `PATCH /api/admin/booking-inquiries/[id]`
  - Auth admin
  - `action='confirm'`: sprawdź konflikt z `reservations` active i `calendar_blocks` — 409 jeśli koliduje. INSERT do `reservations` (z EXCLUDE constraint database podwójnie zabezpiecza). UPDATE inquiry status='confirmed'
  - `action='reject'`: UPDATE status='rejected'
  - `admin_note` w body — UPDATE pola
  - `revalidatePath('/admin/reservations')`, `/admin/calendar`
  - _Wymagania: 30 #3-4, #6_

- [x] 15.6 Endpoint `PATCH/DELETE /api/admin/reservations/[id]`
  - PATCH: UPDATE pól (admin_note, dat — z walidacją konfliktów)
  - DELETE: UPDATE status='cancelled' (soft, EXCLUDE constraint zwalnia daterange)
  - _Wymagania: 30 #5_

- [x] 16. Admin: CMS restauracji, miejsc, Rzym, useful info
- [x] 16.1 Strony i edytory `/admin/restaurants*`
  - `/admin/restaurants`: lista (Server) z filtrem po regionie i statusie
  - `/admin/restaurants/new` i `/admin/restaurants/[id]`: edytor (client) ze wszystkimi polami z tabeli + galeria
  - Endpointy `POST /api/admin/restaurants`, `PATCH/DELETE /api/admin/restaurants/[id]`
  - DELETE = soft (UPDATE `deleted_at = now()`), `gallery_photos` pozostają (linkowane), `reviews`/`guest_photos` zostają z `restaurant_id` ale nie pokazują się publicznie (publiczny SELECT filtruje WHERE `deleted_at IS NULL`)
  - Walidacja Map_Data wymagana (Wym. 41 #1)
  - _Wymagania: 31, 41_

- [x] 16.2 Strony i edytory `/admin/places*`
  - Analogicznie do restauracji
  - Endpointy `POST /api/admin/places`, `PATCH/DELETE /api/admin/places/[id]`
  - _Wymagania: 32, 41_

- [x] 16.3 Strona i edytor `/admin/rome`
  - Sekcja itinerary: lista 4 part-of-day, każdy z edytowalnymi punktami (drag-to-reorder), dodaj/usuń punkt
  - Sekcja info: 5 stałych slotów (po `kind`) z polami title + body, edycja inline
  - Endpointy `POST/PATCH/DELETE /api/admin/rome/itinerary`, `PATCH /api/admin/rome/info`
  - _Wymagania: 33_

- [x] 16.4 Strona i edytor `/admin/useful-info`
  - Lista pozycji `travel_info` z drag-to-reorder
  - Edytor z polami: kind, title, body, external_links (lista par {label,url}), published_at toggle
  - Endpointy `POST/PATCH/DELETE /api/admin/useful-info`
  - _Wymagania: 34_

- [x] 17. Admin: moderacja review i guest photos
- [x] 17.1 Strona `/admin/reviews`
  - Server Component pobiera reviews z dołączonym targetem
  - Client `ReviewModerationQueue` — filtry (status, rating, target), karty z akcjami `Zatwierdź`/`Odrzuć`/`Ukryj`
  - Endpoint `PATCH /api/admin/reviews/[id]` z `{status: 'approved'|'rejected'|'hidden'}` + `revalidatePath('/restaurants/[slug]', '/places/[slug]')` (dynamic — można `revalidatePath('/restaurants', 'layout')`)
  - _Wymagania: 35_

- [x] 17.2 Strona `/admin/photos`
  - Server Component pobiera `guest_photos`; dla każdego generuje signed URL (15 min) do podglądu
  - Client `PhotoModerationQueue` z miniaturkami, akcje status + Trwale usuń (DELETE z bucketa + tabeli)
  - Endpoint `PATCH /api/admin/guest-photos/[id]`, `DELETE /api/admin/guest-photos/[id]`
  - DELETE wymaga potwierdzenia w UI (modal "Czy na pewno?")
  - _Wymagania: 36_

- [x] 17.3 Generowanie signed URL dla guest photos w publicznych widokach
  - Helper `src/lib/data/guest-photos.ts` `getApprovedGuestPhotosWithUrls(targetType, targetId)` — zwraca approved photos z signed URL
  - Używany w `/restaurants/[slug]` i `/places/[slug]` w sekcji galerii
  - _Wymagania: 39 #4_

- [x] 18. Admin: settings i Rzym info
- [x] 18.1 Strona `/admin/settings`
  - Server Component pobiera `site_settings`
  - Client `SettingsForm` — pola: contact_email (walidacja), contact_phone, footer_address, privacy_policy_md (textarea), consent_text_booking, consent_text_review, consent_text_photo
  - Endpoint `PATCH /api/admin/settings` z walidacją emaila + `revalidatePath('/', 'layout')`
  - _Wymagania: 37_

- [x] 19. Hardening: walidacja serwerowa, RLS, dostępność
- [x] 19.1 Audyt API publicznego — żadnych danych osobowych w odpowiedziach
  - Przejdź przez `/api/availability`, `/api/booking-inquiries` (response tylko `{id}`), `/api/reviews`, `/api/guest-photos`
  - Sprawdź, że żaden endpoint nie zwraca pól `guest_full_name`, `guest_email`, `guest_phone`, `message` w odpowiedzi anon
  - Dodaj test integracyjny weryfikujący kontrakt każdego endpointu
  - _Wymagania: 42_

- [x] 19.2 Sprawdzenie RLS na wszystkich tabelach
  - Manualny test: zaloguj się jako anon przez Supabase Studio → SELECT wszystkich tabel → sprawdź, że `booking_inquiries`, `reservations`, `calendar_blocks` zwracają 0 wierszy
  - Sprawdź, że `reviews`/`guest_photos` zwracają tylko `approved`
  - _Wymagania: 38, 42_

- [x] 19.3 Audyt dostępności
  - Każdy formularz: każde pole ma `<label htmlFor>` lub `aria-label`
  - Każde zdjęcie w galerii ma `alt`
  - Kalendarz: testować z czytnikiem (NVDA/VoiceOver) — status musi być słyszalny
  - Kontrast: weryfikuj tokeny w Italian_Flag_Theme przez axe DevTools
  - Tabulator przechodzi przez całą BookingForm i pozwala wysłać bez myszki
  - _Wymagania: 46_

- [x] 19.4 Responsywność — manual test
  - 320, 375, 768, 1024, 1440, 1920 px
  - Brak poziomego scroll
  - Apartment_Listing 1-col < 768, 2-col ≥ 1024
  - Kalendarz touch target ≥ 40x40
  - _Wymagania: 47_

- [x] 20. Dokumentacja, README i finalizacja
- [x] 20.1 Skopiuj/zaktualizuj `docs/` z `bellaorte/` do `bellaorte2/`
  - Zachowaj: PRD.md, design-guide.md, technical-spec.md (z aktualizacjami z design.md), data-model.md (sync z schema.sql), implementation-roadmap.md, supabase-setup.md (uaktualnij), google-maps.md, content-inventory.md, content-sources.md, inspirations.md
  - _Wymagania: 48_

- [x] 20.2 Zaktualizuj `README.md`
  - Sekcja Start (npm install, dev, build, preview)
  - Sekcja Supabase (link do `docs/supabase-setup.md`, kolejność migracji)
  - Sekcja Admin (jak utworzyć admina i wpisać do `admin_users`)
  - Sekcja Google Maps (zmienna env)
  - Sekcja TODO post-MVP: rate limit Redis, czeście zdjęcia wnętrz, SEO/OG, monitoring błędów
  - _Wymagania: 48, 49_

- [x] 20.3 Build + lint + test pełny przebieg
  - `npm run lint` zwraca 0 błędów
  - `npm run build` przechodzi
  - `npm run test` (vitest) wszystkie testy zielone
  - Manualny test scenariusza E2E:
    - Wejście na `/` → wybór apartamentu → kalendarz → wybór dat → wysłanie booking → confirmation
    - Wejście na restaurację → dodanie review + photo → komunikat o moderacji
    - Login admin → moderacja review → potwierdzenie booking → kalendarz pokazuje reserved
  - _Wymagania: 1, 7, 9, 11, 14, 23, 25, 30, 35_
