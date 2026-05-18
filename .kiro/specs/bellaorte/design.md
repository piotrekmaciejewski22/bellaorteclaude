# Design Document: BELLAORTE

## Overview

BELLAORTE to aplikacja webowa dla 2 apartamentów w Orte, Włochy. Składa się z trzech warstw logicznych w jednym projekcie Next.js:

1. **Public_Site** — publiczna strona turystyczna z kalendarzem dostępności, formularzem zapytań i przewodnikiem (restauracje, miejsca, sekcja Rzym, przydatne informacje).
2. **Admin_Panel** — chroniony panel administracyjny pod `/admin` z dashboardem, CMS-em treści, moderacją opinii/zdjęć i obsługą rezerwacji.
3. **API Layer** — Route Handlers Next.js, które stanowią jedyną drogę zapisu do bazy danych dla zarówno gości publicznych (booking, review, guest photo) jak i administratorów (operacje CMS, moderacja).

Wszystko działa na jednym stosie: **Next.js App Router 16 + React 19 + TypeScript + Tailwind CSS v4 + Supabase (Postgres + Auth + Storage)**. Trasy publiczne domyślnie renderują się jako Server Components; tylko interaktywne fragmenty (kalendarz, formularze, galeria) są Client Components. Dane czytane są bezpośrednio z Supabase w Server Components, a operacje zapisu idą wyłącznie przez Route Handlers z walidacją serwerową.

Kluczowe założenia projektowe:
- **Brak cen i płatności w MVP** — żadne pole `price` nie pojawi się w schemacie, UI ani API.
- **Zafiksowane 2 apartamenty** — schemat dopuszcza więcej, ale UI panelu nie pozwala dodać trzeciego ani usunąć któregoś z dwóch (walidacja w Route Handlerach).
- **Moderacja przed publikacją** dla wszystkich treści gości (Review, GuestPhoto) — tabela ma `moderation_status` z domyślną wartością `pending`.
- **Pending na kalendarzu** — Booking_Inquiry o statusie `pending` od razu pojawia się jako żółty/oczekujący w publicznym kalendarzu, ale inny gość może go wybrać z ostrzeżeniem.
- **Brak danych osobowych w API publicznym** — `GET /api/availability` zwraca tylko statusy dni (4 wartości), nigdy danych gościa.

## Architecture

### High-level component diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Browser (Public)                           │
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────┐  │
│  │ Server Components│ │  Client Components│ │   API Calls    │  │
│  │ /, /apartments,  │ │ AvailabilityCal.  │ │POST /booking-  │  │
│  │ /restaurants/... │ │ BookingForm,      │ │     inquiries  │  │
│  │ /places/...      │ │ ReviewForm,       │ │POST /reviews   │  │
│  │ /rome, /useful…  │ │ GuestPhotoUploader│ │POST /guest-    │  │
│  └────────┬─────────┘ └─────────┬─────────┘ │     photos     │  │
│           │                     │            │GET  /availabil.│  │
└───────────┼─────────────────────┼────────────┴────────┬───────┘─┘
            │                     │                     │
            │ direct read         │ event handlers      │ fetch
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Next.js Server (Vercel/Node)                   │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Server Components   │  │       Route Handlers              │ │
│  │  data layer          │  │  /api/booking-inquiries (POST)    │ │
│  │  (src/lib/data/*)    │  │  /api/reviews (POST)              │ │
│  │                      │  │  /api/guest-photos (POST)         │ │
│  │                      │  │  /api/availability (GET)          │ │
│  │                      │  │  /api/admin/* (PATCH/POST/DELETE) │ │
│  └──────────┬───────────┘  └──────────────┬───────────────────┘ │
│             │ supabase-js                  │ supabase-js         │
│             │ (anon key)                   │ (service role +     │
│             │                              │  auth check)        │
└─────────────┼──────────────────────────────┼───────────────────┘─┘
              │                              │
              ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                            Supabase                              │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ Postgres + RLS       │  │       Auth (Admin)                │ │
│  │ apartments,          │  │  email + password                 │ │
│  │ booking_inquiries,   │  │  admin role check                 │ │
│  │ reservations,        │  │                                   │ │
│  │ calendar_blocks,     │  └──────────────────────────────────┘ │
│  │ restaurants,         │  ┌──────────────────────────────────┐ │
│  │ attractions,         │  │       Storage                     │ │
│  │ reviews,             │  │  bucket: site-media (public read) │ │
│  │ guest_photos,        │  │  bucket: guest-media (RLS read)   │ │
│  │ travel_info,         │  │                                   │ │
│  │ rome_itinerary,      │  └──────────────────────────────────┘ │
│  │ rome_info,           │                                       │
│  │ media_assets,        │                                       │
│  │ site_settings        │                                       │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
                                ▲
                                │ admin session cookie
                                │
┌─────────────────────────────────────────────────────────────────┐
│                       Browser (Admin)                            │
│  /admin/* (Server Components + Client editors)                  │
│  → wszystkie zapisy przez /api/admin/* z weryfikacją sesji      │
└─────────────────────────────────────────────────────────────────┘
```

### Stack i wersje

- **Next.js 16.x App Router** — Server/Client Components, Route Handlers, `revalidatePath` do invalidacji cache po mutacjach admina.
- **React 19** — `useActionState`, `useFormStatus` do formularzy.
- **TypeScript 5** — strict mode, brak `any` poza adapterami zewnętrznych SDK.
- **Tailwind CSS v4** — tokens kolorów flagi Włoch w `globals.css`, brak custom config (Tailwind 4 czyta z CSS).
- **Supabase JS v2** — `@supabase/supabase-js`, dwa klienci: anon (publiczny odczyt) i service role (tylko po stronie serwera, dla operacji admina).
- **lucide-react** — ikony.

### Trasy

#### Publiczne (Public_Site)

| Trasa | Tryb | Cel |
|---|---|---|
| `/` | Server | Hero, 2 karty apartamentów, CTA do `/booking`, linki do guide |
| `/apartments` | Server | Lista 2 apartamentów |
| `/apartments/[slug]` | Server + Client kalendarz | Szczegół apartamentu, galeria, AvailabilityCalendar |
| `/booking` | Server + Client formularz | BookingForm z preselekcją z query params |
| `/booking/confirmation` | Server | Strona potwierdzenia |
| `/guide` | Server | Hub przewodnika |
| `/restaurants` | Server | Lista restauracji (region: orte_area) |
| `/restaurants/[slug]` | Server + Client formularze | Szczegół restauracji |
| `/places` | Server | Lista atrakcji (region: orte_area) |
| `/places/[slug]` | Server + Client formularze | Szczegół atrakcji |
| `/rome` | Server | Hub Rzym |
| `/rome/restaurants` | Server | Lista restauracji (region: rome) |
| `/rome/places` | Server | Lista atrakcji (region: rome) |
| `/rome/itinerary` | Server | Plan zwiedzania |
| `/rome/info` | Server | Praktyczne info Rzym |
| `/useful-info` | Server | TravelInfo |
| `/privacy` | Server | Polityka prywatności |

#### Admin (Admin_Panel)

| Trasa | Cel |
|---|---|
| `/admin/login` | Logowanie (publiczne) |
| `/admin` | Dashboard |
| `/admin/apartments` | Lista 2 apartamentów (edycja, brak add/delete) |
| `/admin/apartments/[id]` | Edytor apartamentu |
| `/admin/calendar` | Kalendarz + zarządzanie blokadami |
| `/admin/reservations` | Zapytania i rezerwacje |
| `/admin/restaurants` | CMS restauracji |
| `/admin/restaurants/new`, `/admin/restaurants/[id]` | Edytor |
| `/admin/places` | CMS atrakcji |
| `/admin/places/new`, `/admin/places/[id]` | Edytor |
| `/admin/rome` | Edycja itinerary i info |
| `/admin/useful-info` | CMS TravelInfo |
| `/admin/reviews` | Moderacja Review |
| `/admin/photos` | Moderacja Guest_Photo |
| `/admin/settings` | Ustawienia strony |

#### API (Route Handlers)

| Endpoint | Metoda | Auth | Cel |
|---|---|---|---|
| `/api/availability` | GET | none | Statusy dni dla apartamentu w zakresie miesięcy |
| `/api/booking-inquiries` | POST | none + rate limit | Utwórz Booking_Inquiry |
| `/api/reviews` | POST | none + rate limit | Utwórz Review (status pending) |
| `/api/guest-photos` | POST | none + rate limit | Utwórz Guest_Photo (status pending) |
| `/api/admin/apartments/[id]` | PATCH | admin | Edycja apartamentu |
| `/api/admin/apartments/[id]/photos` | POST/DELETE | admin | Galeria apartamentu |
| `/api/admin/calendar-blocks` | POST/PATCH/DELETE | admin | Blokady |
| `/api/admin/booking-inquiries/[id]` | PATCH | admin | Status (confirmed/rejected) |
| `/api/admin/reservations/[id]` | PATCH/DELETE | admin | Edycja/anulacja |
| `/api/admin/restaurants` | POST | admin | Dodanie |
| `/api/admin/restaurants/[id]` | PATCH/DELETE | admin | Edycja/usunięcie |
| `/api/admin/places` | POST | admin | Dodanie atrakcji |
| `/api/admin/places/[id]` | PATCH/DELETE | admin | Edycja/usunięcie |
| `/api/admin/rome/itinerary` | POST/PATCH/DELETE | admin | CRUD itinerary |
| `/api/admin/rome/info` | PATCH | admin | Sekcje info |
| `/api/admin/useful-info` | POST/PATCH/DELETE | admin | CRUD TravelInfo |
| `/api/admin/reviews/[id]` | PATCH | admin | Moderacja |
| `/api/admin/guest-photos/[id]` | PATCH/DELETE | admin | Moderacja |
| `/api/admin/settings` | PATCH | admin | Ustawienia |

### Struktura projektu

```
bellaorte2/
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── README.md
├── docs/                          # PRD, design guide, technical-spec (skopiowane z bellaorte/)
├── supabase/
│   ├── schema.sql                 # cały schemat + RLS + funkcje
│   ├── seed.sql                   # 2 apartamenty, kilka restauracji/atrakcji demo
│   └── storage.sql                # buckety + policy
├── src/
│   ├── app/
│   │   ├── layout.tsx             # root, fonty, Italian_Flag_Theme tokens
│   │   ├── globals.css
│   │   ├── page.tsx               # /
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── (public)/
│   │   │   ├── layout.tsx         # SiteHeader + SiteFooter
│   │   │   ├── apartments/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── booking/
│   │   │   │   ├── page.tsx
│   │   │   │   └── confirmation/page.tsx
│   │   │   ├── guide/page.tsx
│   │   │   ├── restaurants/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── places/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── rome/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── restaurants/page.tsx
│   │   │   │   ├── places/page.tsx
│   │   │   │   ├── itinerary/page.tsx
│   │   │   │   └── info/page.tsx
│   │   │   ├── useful-info/page.tsx
│   │   │   └── privacy/page.tsx
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   ├── layout.tsx         # AdminSidebar + auth check
│   │   │   ├── page.tsx           # dashboard
│   │   │   ├── apartments/
│   │   │   ├── calendar/
│   │   │   ├── reservations/
│   │   │   ├── restaurants/
│   │   │   ├── places/
│   │   │   ├── rome/
│   │   │   ├── useful-info/
│   │   │   ├── reviews/
│   │   │   ├── photos/
│   │   │   └── settings/
│   │   └── api/
│   │       ├── availability/route.ts
│   │       ├── booking-inquiries/route.ts
│   │       ├── reviews/route.ts
│   │       ├── guest-photos/route.ts
│   │       └── admin/
│   │           ├── apartments/
│   │           ├── calendar-blocks/
│   │           ├── booking-inquiries/
│   │           ├── reservations/
│   │           ├── restaurants/
│   │           ├── places/
│   │           ├── rome/
│   │           ├── useful-info/
│   │           ├── reviews/
│   │           ├── guest-photos/
│   │           └── settings/
│   ├── components/
│   │   ├── public/
│   │   │   ├── SiteHeader.tsx
│   │   │   ├── SiteFooter.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ApartmentCard.tsx
│   │   │   ├── ApartmentGallery.tsx     # client
│   │   │   ├── AvailabilityCalendar.tsx # client
│   │   │   ├── StatusLegend.tsx
│   │   │   ├── BookingForm.tsx          # client
│   │   │   ├── GuideCard.tsx
│   │   │   ├── RestaurantCard.tsx
│   │   │   ├── PlaceCard.tsx
│   │   │   ├── MapEmbed.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   ├── ReviewForm.tsx           # client
│   │   │   ├── GuestPhotoUploader.tsx   # client
│   │   │   └── TravelInfoSection.tsx
│   │   └── admin/
│   │       ├── AdminSidebar.tsx
│   │       ├── AdminMetricCard.tsx
│   │       ├── AdminCalendar.tsx        # client
│   │       ├── ReservationTable.tsx     # client (filtry)
│   │       ├── ApartmentEditor.tsx      # client
│   │       ├── RestaurantEditor.tsx     # client
│   │       ├── PlaceEditor.tsx          # client
│   │       ├── ItineraryEditor.tsx      # client
│   │       ├── TravelInfoEditor.tsx     # client
│   │       ├── ReviewModerationQueue.tsx# client
│   │       ├── PhotoModerationQueue.tsx # client
│   │       └── SettingsForm.tsx         # client
│   └── lib/
│       ├── supabase/
│       │   ├── browser.ts         # createBrowserClient (anon)
│       │   ├── server.ts          # createServerClient (cookies)
│       │   └── admin.ts           # createServiceClient (service role)
│       ├── auth/
│       │   ├── session.ts         # getAdminSession()
│       │   └── require-admin.ts   # guard dla Route Handlers
│       ├── data/
│       │   ├── apartments.ts
│       │   ├── availability.ts    # logika 4 statusów
│       │   ├── booking.ts
│       │   ├── restaurants.ts
│       │   ├── attractions.ts
│       │   ├── reviews.ts
│       │   ├── guest-photos.ts
│       │   ├── rome.ts
│       │   ├── useful-info.ts
│       │   ├── settings.ts
│       │   └── media.ts
│       ├── validation/
│       │   ├── booking-inquiry.ts # walidacja serwerowa Wymaganie 10
│       │   ├── review.ts          # Wymaganie 23
│       │   ├── guest-photo.ts     # Wymaganie 24
│       │   ├── apartment.ts
│       │   ├── restaurant.ts
│       │   └── attraction.ts
│       ├── rate-limit/
│       │   └── memory-store.ts    # in-memory limiter (MVP)
│       ├── maps.ts                # buduje Google Maps URL
│       ├── format.ts              # daty, slugi
│       ├── types.ts               # domain types
│       └── constants.ts           # statusy, regiony, limity
└── .kiro/specs/bellaorte/         # ten spec
```

### Server vs Client Components

**Server Components (domyślnie):**
- Wszystkie strony list i szczegółu (`/apartments`, `/restaurants/[slug]`, itp.) — czytają z Supabase przez `createServerClient`
- Layouty (`SiteHeader`, `SiteFooter`, `AdminSidebar`)
- Statyczne karty (`ApartmentCard`, `RestaurantCard`, `PlaceCard`)

**Client Components (`'use client'`):**
- `AvailabilityCalendar` — wybór zakresu dat, fetch `/api/availability`
- `BookingForm`, `ReviewForm`, `GuestPhotoUploader` — walidacja, fetch
- `ApartmentGallery` — lightbox
- `AdminCalendar`, `ApartmentEditor`, `RestaurantEditor`, `PlaceEditor`, `ItineraryEditor`, `TravelInfoEditor`, `ReviewModerationQueue`, `PhotoModerationQueue`, `SettingsForm`, `ReservationTable` — wszystkie edytory admina

## Components and Interfaces

### Public components

#### `AvailabilityCalendar` (client)

```typescript
interface AvailabilityCalendarProps {
  apartmentId: string
  apartmentSlug: string
  apartmentMaxGuests: number
  initialMonths?: number  // default 3
  onRangeSelected?: (range: { checkIn: string; checkOut: string }) => void
}

// Status dnia
type DayStatus = 'available' | 'pending' | 'reserved' | 'blocked'

interface DayCell {
  date: string         // YYYY-MM-DD
  status: DayStatus
  selectable: boolean  // false dla reserved/blocked
}
```

Kalendarz pobiera statusy przez `GET /api/availability?apartmentId=...&from=YYYY-MM-DD&to=YYYY-MM-DD`. Renderuje 3 miesiące (current + 2). Wybór zakresu działa przez kliknięcie pierwszego dnia (check-in) i drugiego (check-out). Kliknięcie `reserved`/`blocked` jest blokowane z toastem. Kliknięcie `pending` jest dozwolone, ale pokazuje ostrzeżenie nad kalendarzem. Po wybraniu zakresu komponent wywołuje `onRangeSelected` lub przekierowuje do `/booking?apartmentId=...&checkIn=...&checkOut=...`.

Statusy są dostępne dla czytników ekranu jako `aria-label` (np. "10 czerwca, dostępny" / "11 czerwca, zarezerwowany, niedostępny").

#### `BookingForm` (client)

```typescript
interface BookingFormProps {
  apartments: Array<{ id: string; name: string; maxGuests: number; slug: string }>
  preselectedApartmentId?: string
  preselectedCheckIn?: string
  preselectedCheckOut?: string
}

interface BookingFormData {
  apartmentId: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  fullName: string
  email: string
  phone?: string
  message?: string
  consent: boolean
}
```

Formularz używa `useActionState` z React 19. Walidacja klientowa pełna z Wymagania 10. Submit wysyła `POST /api/booking-inquiries`. Sukces — `router.push('/booking/confirmation?ref=...')`. Konflikt 409 — komunikat o nakładającym się terminie. Limit 429 — komunikat o zbyt wielu próbach.

#### `ReviewForm` (client)

```typescript
interface ReviewFormProps {
  targetType: 'restaurant' | 'attraction'
  targetId: string
}

interface ReviewFormData {
  signature: string  // 2-60 znaków
  rating: 1 | 2 | 3 | 4 | 5
  body: string       // 10-1000 znaków
  photo?: File
  consent: boolean
}
```

Submit wysyła dwa requesty równolegle: `POST /api/reviews` i (jeśli photo) `POST /api/guest-photos` z `reviewId` z odpowiedzi. Po sukcesie pokazuje komunikat "Twoja opinia czeka na moderację" bez przekierowania.

#### `GuestPhotoUploader` (client)

```typescript
interface GuestPhotoUploaderProps {
  targetType: 'restaurant' | 'attraction'
  targetId: string
  reviewId?: string
}
```

Pole `<input type="file" accept="image/jpeg,image/png,image/webp">`. Walidacja klienta: format + rozmiar (8 MB). Submit jako `multipart/form-data` na `POST /api/guest-photos`. Pokazuje progres uploadu.

#### `MapEmbed`

```typescript
interface MapEmbedProps {
  latitude?: number
  longitude?: number
  googlePlaceId?: string
  address: string
  name: string
}
```

Server Component. Buduje URL do Google Maps (link `Otwórz w Google Maps`) oraz, jeśli klucz API jest skonfigurowany, osadza Maps Embed iframe. Bez klucza API pokazuje sam link i adres tekstowy. Bez `latitude/longitude/googlePlaceId` ale z adresem — pokazuje tylko adres tekstowy (Wymaganie 41 #5).

### Admin components

#### `AdminCalendar` (client)

Większy widok kalendarza (1 lub 12 miesięcy). Klikalność pełna: kliknięcie `available` otwiera modal "Dodaj blokadę"; kliknięcie `reserved`/`pending` otwiera szczegół rezerwacji/zapytania.

#### `ReservationTable` (client)

Tabela `Booking_Inquiry` + `Reservation` w jednym widoku. Filtry: status (`pending`/`confirmed`/`rejected`/`cancelled`), apartament. Kolumny: data zgłoszenia, apartament, daty pobytu, gość, kontakt, status, akcje. Akcje na zapytaniu: `Potwierdź` (tworzy Reservation), `Odrzuć`, `Notatka`.

#### Pozostałe edytory

`ApartmentEditor`, `RestaurantEditor`, `PlaceEditor`, `ItineraryEditor`, `TravelInfoEditor`, `SettingsForm` — formularze z polami zgodnymi z modelem danych. Każdy wysyła PATCH/POST do odpowiedniego `/api/admin/*` i po sukcesie wywołuje `router.refresh()` (Next.js invaliduje Server Component cache).

`ReviewModerationQueue`, `PhotoModerationQueue` — listy z trzema akcjami: `Zatwierdź`, `Odrzuć`, `Ukryj`.

### Data layer (`src/lib/data/*`)

Każdy moduł eksportuje funkcje do czytania z Supabase. Server Components wywołują je bezpośrednio. Route Handlery używają tych samych funkcji do zapisu (z service role).

Przykład: `src/lib/data/availability.ts`

```typescript
export type DayStatus = 'available' | 'pending' | 'reserved' | 'blocked'

export interface DayStatusEntry {
  date: string
  status: DayStatus
}

export async function getAvailability(
  client: SupabaseClient,
  apartmentId: string,
  from: string,
  to: string
): Promise<DayStatusEntry[]> {
  // 1. fetch reservations (status='active') in range
  // 2. fetch calendar_blocks in range
  // 3. fetch booking_inquiries (status='pending') in range
  // 4. for each day from..to compute status with priority:
  //    blocked > reserved > pending > available
  // returns flat array, never includes guest data
}
```

## Data Models

### Postgres schema (Supabase)

#### `apartments`
```sql
CREATE TABLE apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  max_guests INT NOT NULL CHECK (max_guests >= 1),
  bedrooms INT NOT NULL DEFAULT 1,
  bathrooms INT NOT NULL DEFAULT 1,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  house_rules TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `gallery_photos`
```sql
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,        -- ścieżka w bucket site-media
  alt_text TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN
    ('placeholder_orte','placeholder_italy','placeholder_rome','interior_real','exterior_real')),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (apartment_id IS NOT NULL)::int +
    (restaurant_id IS NOT NULL)::int +
    (attraction_id IS NOT NULL)::int = 1
  )
);
```

#### `booking_inquiries`
```sql
CREATE TYPE inquiry_status AS ENUM ('pending','confirmed','rejected','cancelled');

CREATE TABLE booking_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INT NOT NULL CHECK (adults >= 1),
  children INT NOT NULL DEFAULT 0 CHECK (children >= 0),
  guest_full_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  message TEXT,
  consent_at TIMESTAMPTZ NOT NULL,
  status inquiry_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  source_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);
CREATE INDEX ON booking_inquiries (apartment_id, check_in, check_out);
CREATE INDEX ON booking_inquiries (status);
```

#### `reservations`
```sql
CREATE TYPE reservation_status AS ENUM ('active','cancelled');

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id),
  inquiry_id UUID REFERENCES booking_inquiries(id),  -- skąd pochodzi
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_full_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  status reservation_status NOT NULL DEFAULT 'active',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);
CREATE INDEX ON reservations (apartment_id, check_in, check_out);
CREATE INDEX ON reservations (status);

-- Constraint: brak overlap między aktywnymi rezerwacjami dla tego samego apartamentu
ALTER TABLE reservations ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    apartment_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  ) WHERE (status = 'active');
```

#### `calendar_blocks`
```sql
CREATE TYPE block_reason AS ENUM ('private_stay','maintenance','cleaning','unavailable','other');

CREATE TABLE calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id),
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  reason block_reason NOT NULL DEFAULT 'unavailable',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_on > starts_on)
);
CREATE INDEX ON calendar_blocks (apartment_id, starts_on, ends_on);
```

#### `restaurants`
```sql
CREATE TYPE region_kind AS ENUM ('orte_area','rome');

CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region region_kind NOT NULL,
  description TEXT,
  cuisine_categories TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  guest_tip TEXT,
  opening_hours JSONB,            -- struktura: { mon: '12:00-22:00', ... }
  phone TEXT,
  website_url TEXT,
  address TEXT,
  google_place_id TEXT,
  google_maps_url TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `attractions`
```sql
CREATE TABLE attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region region_kind NOT NULL,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  practical_tips TEXT,
  travel_info TEXT,        -- jak dojechać / odległość
  address TEXT,
  google_place_id TEXT,
  google_maps_url TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `reviews`
```sql
CREATE TYPE moderation_status AS ENUM ('pending','approved','rejected','hidden');

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  attraction_id UUID REFERENCES attractions(id) ON DELETE SET NULL,
  signature TEXT NOT NULL CHECK (char_length(signature) BETWEEN 2 AND 60),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 10 AND 1000),
  status moderation_status NOT NULL DEFAULT 'pending',
  source_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (restaurant_id IS NOT NULL)::int + (attraction_id IS NOT NULL)::int = 1
  )
);
CREATE INDEX ON reviews (restaurant_id, status);
CREATE INDEX ON reviews (attraction_id, status);
```

#### `guest_photos`
```sql
CREATE TABLE guest_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  attraction_id UUID REFERENCES attractions(id) ON DELETE SET NULL,
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,    -- bucket guest-media
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
  size_bytes INT NOT NULL CHECK (size_bytes <= 8388608),
  status moderation_status NOT NULL DEFAULT 'pending',
  source_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (restaurant_id IS NOT NULL)::int + (attraction_id IS NOT NULL)::int = 1
  )
);
CREATE INDEX ON guest_photos (restaurant_id, status);
CREATE INDEX ON guest_photos (attraction_id, status);
```

#### `rome_itinerary`
```sql
CREATE TYPE day_part AS ENUM ('morning','noon','afternoon','evening');

CREATE TABLE rome_itinerary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_part day_part NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  linked_restaurant_id UUID REFERENCES restaurants(id),
  linked_attraction_id UUID REFERENCES attractions(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `rome_info_sections`
```sql
CREATE TYPE rome_info_kind AS ENUM (
  'travel_from_orte','public_transport','tickets','safety','attraction_hours'
);

CREATE TABLE rome_info_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind rome_info_kind UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `travel_info`
```sql
CREATE TYPE travel_info_kind AS ENUM (
  'car_rental','rome_transfer','trains','travel_directions'
);

CREATE TABLE travel_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind travel_info_kind NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  external_links JSONB NOT NULL DEFAULT '[]',  -- [{label,url},...]
  display_order INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `site_settings`
```sql
CREATE TABLE site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  footer_address TEXT NOT NULL DEFAULT 'Orte, Prowincja Viterbo, Włochy',
  privacy_policy_md TEXT NOT NULL DEFAULT '',
  consent_text_booking TEXT NOT NULL DEFAULT '',
  consent_text_review TEXT NOT NULL DEFAULT '',
  consent_text_photo TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `admin_users`
```sql
-- Korzystamy z auth.users z Supabase, dodajemy tylko mapowanie roli
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Row Level Security (RLS)

Cała baza ma RLS włączone. Polityki:

**Public read (anon):**
- `apartments`: WHERE `published_at IS NOT NULL`
- `restaurants`, `attractions`: WHERE `published_at IS NOT NULL AND deleted_at IS NULL`
- `gallery_photos`: bez warunku (linkują do publikowanych obiektów)
- `reviews`, `guest_photos`: WHERE `status = 'approved'`
- `rome_itinerary`, `rome_info_sections`, `travel_info`, `site_settings`: WHERE `published_at IS NOT NULL` (lub bez warunku dla site_settings)
- `booking_inquiries`, `reservations`, `calendar_blocks`: **NIE** ma odczytu publicznego — kalendarz korzysta z funkcji `get_availability(apartment_id, from, to)` zwracającej tylko statusy.

**Admin write:** wszystkie tabele mają polityki `WHERE auth.uid() IN (SELECT user_id FROM admin_users)` dla INSERT/UPDATE/DELETE. W praktyce wszystkie operacje admina idą przez Route Handlery używające service role, ale RLS to drugi pierścień ochrony.

**Funkcja `get_availability`:**
```sql
CREATE OR REPLACE FUNCTION public.get_availability(
  p_apartment_id UUID,
  p_from DATE,
  p_to DATE
) RETURNS TABLE(date DATE, status TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  WITH days AS (
    SELECT generate_series(p_from, p_to - 1, '1 day')::date AS date
  ),
  blocked AS (
    SELECT generate_series(starts_on, ends_on - 1, '1 day')::date AS date
    FROM calendar_blocks WHERE apartment_id = p_apartment_id
  ),
  reserved AS (
    SELECT generate_series(check_in, check_out - 1, '1 day')::date AS date
    FROM reservations WHERE apartment_id = p_apartment_id AND status = 'active'
  ),
  pending AS (
    SELECT generate_series(check_in, check_out - 1, '1 day')::date AS date
    FROM booking_inquiries WHERE apartment_id = p_apartment_id AND status = 'pending'
  )
  SELECT d.date,
    CASE
      WHEN d.date IN (SELECT date FROM blocked) THEN 'blocked'
      WHEN d.date IN (SELECT date FROM reserved) THEN 'reserved'
      WHEN d.date IN (SELECT date FROM pending)  THEN 'pending'
      ELSE 'available'
    END AS status
  FROM days d
  ORDER BY d.date;
$$;

GRANT EXECUTE ON FUNCTION public.get_availability TO anon, authenticated;
```

### Storage buckets

- **`site-media`**: public read; write tylko z service role (z `/api/admin/*`).
- **`guest-media`**: write z anon (z `/api/guest-photos` po walidacji); read przez signed URL generowane dla zatwierdzonych zdjęć.

W praktyce kod w Server Component generuje signed URL (15 min TTL) dla każdego `guest_photo` o `status='approved'` i wstawia do `<img src>`.

## Error Handling

### Public_Site

| Scenariusz | Reakcja |
|---|---|
| Trasa `/apartments/[slug]` z nieistniejącym slugiem | `notFound()` → strona 404 |
| Błąd renderowania Server Component | `error.tsx` na poziomie segmentu, link do `/` |
| Niepowodzenie `GET /api/availability` | Kalendarz pokazuje stan "Nie udało się pobrać dostępności, spróbuj ponownie" + retry |
| Walidacja `BookingForm` (klient) | Komunikaty inline przy każdym polu, blokada submit |
| 400 z `/api/booking-inquiries` | Toast + komunikat z `errors[*].field` |
| 409 (konflikt dat) z `/api/booking-inquiries` | Komunikat "Wybrany termin koliduje z istniejącą rezerwacją lub blokadą", fokus na pole dat |
| 429 (rate limit) | Komunikat "Zbyt wiele prób, spróbuj później" |
| Upload zdjęcia > 8 MB | Walidacja klienta blokuje przed wysłaniem; równolegle 413 z serwera |

### Admin_Panel

| Scenariusz | Reakcja |
|---|---|
| Brak sesji na `/admin/*` | `redirect('/admin/login?next=...')` |
| 401 z `/api/admin/*` | Wymuszone wylogowanie + redirect na login |
| Konflikt dat przy zatwierdzaniu Booking_Inquiry | 409 + komunikat "Konflikt z istniejącą rezerwacją lub blokadą" |
| Nieunikalny slug Apartment/Restaurant/Attraction | 422 + komunikat przy polu slug |
| Próba dodania trzeciego apartamentu | 422 z komunikatem "MVP obsługuje dokładnie 2 apartamenty" |
| Błąd uploadu do Storage | Toast z opisem błędu, formularz nie traci wprowadzonych danych |

### Rate limiting

In-memory limiter (`Map<ip, { count, windowStart }>`). Trzy zasoby:
- `/api/booking-inquiries`: 10 req / 10 min na IP
- `/api/reviews`: 20 req / 60 min na IP
- `/api/admin/login` (Supabase Auth proxy): 5 fail / 15 min na IP

Przekroczenie → 429 z `Retry-After`. **Uwaga produkcyjna:** in-memory działa dla pojedynczego procesu Node. Przy deploy na Vercel z kilkoma instancjami trzeba przejść na Upstash Redis lub Supabase + funkcję `check_rate_limit`. To jest udokumentowane w README jako TODO post-MVP.

## Testing Strategy

Unit testy + integracyjne na poziomie warstwy walidacji i logiki kalendarza są obowiązkowe. E2E i pełne API testy są opcjonalne dla MVP, ale strukturę testów przygotowujemy od razu.

### Stack testowy

- **Vitest** dla testów jednostkowych (czyste funkcje walidacji, format dat, build mapowych URL).
- **@testing-library/react** dla komponentów `BookingForm`, `AvailabilityCalendar`, `ReviewForm`.
- **Playwright** (opcjonalnie post-MVP) dla scenariuszy E2E.

### Co testujemy obowiązkowo

1. **Walidacja `booking-inquiry`** (`src/lib/validation/booking-inquiry.ts`):
   - puste wymagane pola → błąd
   - check_out <= check_in → błąd
   - check_in w przeszłości → błąd
   - email niepoprawny → błąd
   - adults < 1 → błąd
   - adults + children > maxGuests → błąd
   - brak zgody → błąd
   - poprawny payload → ok
2. **Walidacja `review`**: zakresy długości signature/body, rating 1–5, brak zgody.
3. **Walidacja `guest-photo`**: format MIME, rozmiar.
4. **Logika `get_availability` (smoke test SQL)**: dla zestawu reservations + blocks + inquiries oczekiwane statusy w przedziale dat z priorytetem `blocked > reserved > pending > available`.
5. **`AvailabilityCalendar` (RTL)**: render statusów, blokada kliknięcia `reserved`/`blocked`, ostrzeżenie przy `pending`, emit `onRangeSelected`.
6. **`BookingForm` (RTL)**: render z preselekcją, walidacja klienta blokuje submit, sukces submit = redirect do confirmation.

### Wymagania, które testujemy bezpośrednio

| Wymaganie | Test |
|---|---|
| Wym. 7 (4 statusy kalendarza) | unit + RTL |
| Wym. 8 (priorytet blocked > reserved > pending) | unit (logika) + smoke SQL |
| Wym. 10 (walidacja Booking_Form) | unit |
| Wym. 12 (walidacja serwerowa booking) | unit |
| Wym. 23 (walidacja Review) | unit |
| Wym. 24 (walidacja Guest_Photo) | unit |
| Wym. 25 (publiczne tylko approved) | unit (data layer) |
| Wym. 30 #6 (konflikt zatwierdzenia) | unit |
| Wym. 40 (placeholdery) | unit (selektor zdjęć) |
| Wym. 42 (brak danych osobowych w API publicznym) | unit (kontrakt `/api/availability`) |

### Co świadomie zostawiamy poza zakresem MVP testów

- Pełne testy E2E logowania admina (manualne).
- Testy wizualne (Chromatic/Percy).
- Testy obciążeniowe rate limitera.

## Wybory projektowe i kompromisy

1. **Brak ORM (np. Drizzle/Prisma)** — Supabase JS jest wystarczający dla MVP. Schema żyje w `supabase/schema.sql`, typy generujemy raz przez `supabase gen types` (lub pisane ręcznie w `src/lib/types.ts` jeśli prościej).

2. **Funkcja `get_availability` po stronie Postgresa zamiast logiki w Node** — eliminuje konieczność czytania surowych tabel `reservations`/`booking_inquiries` przez anon (patrz RLS). Public anon dostaje przez RPC tylko statusy.

3. **In-memory rate limit** zamiast Redisa — działa dla MVP single-instance. Udokumentowane jako TODO produkcyjne.

4. **Generowanie signed URL dla guest-media** zamiast publicznego bucketu — zatwierdzone zdjęcia są technicznie public-read, ale chcemy mieć kontrolę i krótkie TTL na URL-e (15 min). Zatwierdzanie/cofanie nie wymaga przenoszenia plików.

5. **Bez kont gości** — Wymaganie 23/24 nie wymagają loginu, tylko podpisu. To upraszcza UX i RLS.

6. **EXCLUDE constraint na `reservations`** zamiast polegania na walidacji w aplikacji — baza gwarantuje brak overlap między aktywnymi rezerwacjami dla tego samego apartamentu.

7. **`gallery_photos` z trzema FK i CHECK constraintem** zamiast osobnych tabel `apartment_photos`/`restaurant_photos`/`attraction_photos` — mniej duplikacji modelu, prosta walidacja "dokładnie jedno powiązanie".

8. **`source_kind` w `gallery_photos`** wymusza świadomy wybór typu zdjęcia — Wymaganie 40 (placeholdery) wymaga, by Public_Site nigdy nie pokazywał `interior_real` jako Apartment, dopóki admin go nie wgra.

9. **Sekcje Rzym jako `rome_itinerary` (lista) + `rome_info_sections` (sloty kind)** — itinerary jest dynamicznym CRUD-em, info to 5 stałych slotów (dojazd z Orte, transport miejski, bilety, bezpieczeństwo, godziny atrakcji) edytowanych w miejscu.

10. **`travel_info.kind` jako enum z 4 wartościami** — odpowiada Wymaganiu 22 (wynajem samochodu, dojazd do Rzymu, pociągi, kierunki). Dodawanie nowej kategorii to migracja enum (ALTER TYPE), świadomy wybór.

## Mapowanie wymagań do komponentów / endpointów

| Wymaganie | Kod (komponent / endpoint / model) |
|---|---|
| 1 Strona główna | `/page.tsx`, `HeroSection`, `ApartmentCard` |
| 2 Header/Footer | `SiteHeader`, `SiteFooter`, `(public)/layout.tsx` |
| 3 404/error | `not-found.tsx`, `error.tsx` |
| 4 Lista apartamentów | `/apartments/page.tsx`, `ApartmentCard` |
| 5 Szczegół apartamentu | `/apartments/[slug]/page.tsx`, `AvailabilityCalendar` |
| 6 Galeria | `ApartmentGallery` (lightbox) |
| 7 Kalendarz publiczny | `AvailabilityCalendar` + `GET /api/availability` + `get_availability()` |
| 8 Polityka pending | logika `get_availability` + UI ostrzeżenia w kalendarzu |
| 9 Booking form | `/booking/page.tsx`, `BookingForm`, `POST /api/booking-inquiries` |
| 10 Walidacja booking | `BookingForm` + `src/lib/validation/booking-inquiry.ts` |
| 11 Confirmation | `/booking/confirmation/page.tsx` |
| 12 Ochrona endpointu | `POST /api/booking-inquiries` + rate-limit + walidacja serwerowa |
| 13 Guide hub | `/guide/page.tsx` |
| 14–15 Restauracje | `/restaurants`, `/restaurants/[slug]`, `restaurants` table |
| 16–17 Miejsca | `/places`, `/places/[slug]`, `attractions` table |
| 18–21 Sekcja Rzym | `/rome/*`, `rome_itinerary`, `rome_info_sections` |
| 22 Useful info | `/useful-info/page.tsx`, `travel_info` table |
| 23 Review | `ReviewForm`, `POST /api/reviews`, `reviews` table |
| 24 Guest photo | `GuestPhotoUploader`, `POST /api/guest-photos`, `guest_photos` table |
| 25 Moderacja | `ReviewModerationQueue`, `PhotoModerationQueue`, `status` enum |
| 26 Admin login | `/admin/login`, Supabase Auth, `admin_users` table |
| 27 Dashboard | `/admin/page.tsx`, `AdminMetricCard` |
| 28 CMS apartamentów | `/admin/apartments/*`, `ApartmentEditor`, walidacja "dokładnie 2" |
| 29 Kalendarz admina | `/admin/calendar/*`, `AdminCalendar`, `calendar_blocks` |
| 30 Rezerwacje | `/admin/reservations`, `ReservationTable`, EXCLUDE constraint |
| 31 CMS restauracji | `/admin/restaurants/*`, `RestaurantEditor` |
| 32 CMS miejsc | `/admin/places/*`, `PlaceEditor` |
| 33 CMS Rzym | `/admin/rome/*`, `ItineraryEditor` |
| 34 CMS useful info | `/admin/useful-info/*`, `TravelInfoEditor` |
| 35 Moderacja review | `/admin/reviews`, `ReviewModerationQueue` |
| 36 Moderacja photos | `/admin/photos`, `PhotoModerationQueue` |
| 37 Settings | `/admin/settings`, `SettingsForm`, `site_settings` table |
| 38 Ochrona admina | middleware admin + RLS + service role + walidacja serwerowa |
| 39 Buckets | `supabase/storage.sql` |
| 40 Placeholdery | `gallery_photos.source_kind` enum + selektor w `data/media.ts` |
| 41 Google Maps | `MapEmbed`, walidacja Map_Data w `validation/restaurant.ts` |
| 42 Brak PII publicznie | RLS na `booking_inquiries`/`reservations` + `get_availability` zwraca tylko statusy |
| 43 Zgody | `site_settings.consent_text_*`, footer link `/privacy` |
| 44 Walidacja serwerowa | `src/lib/validation/*` używana w Route Handlers |
| 45 Theme | `globals.css` tokens, `(public)/layout.tsx` |
| 46 Dostępność | `aria-label`, `<label htmlFor>`, kontrast w tokens |
| 47 Responsywność | Tailwind breakpoints w komponentach |
| 48 Stack | `package.json` + struktura projektu |
| 49 Env | `.env.example` |
