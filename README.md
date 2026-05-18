# BELLAORTE

Strona dwóch apartamentów w Orte (Włochy) wraz z przewodnikiem po regionie
i panelem administracyjnym. Bez płatności online — zapytania rezerwacyjne
potwierdzane są ręcznie mailem.

**Stack:** Next.js 16 App Router (Turbopack) · React 19 · TypeScript strict ·
Tailwind v4 (CSS-only config) · Supabase (Auth + Postgres + Storage) ·
Vitest + React Testing Library

---

## Spis treści

1. [Co tu jest](#co-tu-jest)
2. [Szybki start](#szybki-start)
3. [Wdrożenie produkcyjne](#wdrożenie-produkcyjne)
4. [Architektura](#architektura)
5. [Polecane komendy](#polecane-komendy)
6. [Audyt](#audyt)
7. [Dokumentacja źródłowa](#dokumentacja-źródłowa)

---

## Co tu jest

### Strony publiczne
| Trasa | Opis |
| --- | --- |
| `/` | Hero, karty 2 apartamentów, sekcje przewodnika |
| `/apartments` | Lista apartamentów |
| `/apartments/[slug]` | Szczegół + galeria z lightbox + kalendarz dostępności (3 miesiące) |
| `/booking` | Formularz zapytania rezerwacyjnego z preselekcją z query params |
| `/booking/confirmation?ref=...` | Strona potwierdzenia (bez PII) |
| `/guide` | Hub przewodnika |
| `/restaurants` + `/restaurants/[slug]` | Restauracje + opinie + zdjęcia gości + mapa Google |
| `/places` + `/places/[slug]` | Atrakcje analogicznie |
| `/rome` + `/rome/itinerary` + `/rome/places` + `/rome/restaurants` + `/rome/info` | Sekcja Rzymu |
| `/useful-info` | Praktyczne informacje (pociągi, dojazd, wynajem auta) |
| `/privacy` | Polityka prywatności (markdown z bazy) |

### Panel admina (`/admin/*`)
| Trasa | Opis |
| --- | --- |
| `/admin/login` | Logowanie Supabase Auth + weryfikacja `admin_users` |
| `/admin` | Dashboard (liczniki moderacji, najbliższe rezerwacje) |
| `/admin/apartments` + `[id]` | Edytor 2 apartamentów + galeria (upload/delete) |
| `/admin/calendar` | Wizualny kalendarz z modalem "dodaj blokadę" + lista |
| `/admin/reservations` | Moderacja zapytań (Zatwierdź/Odrzuć) |
| `/admin/restaurants` + `[id]` + `/new` | Pełny CMS restauracji |
| `/admin/places` + `[id]` + `/new` | Pełny CMS atrakcji |
| `/admin/rome` | Edytor planu dnia + 5 sekcji info |
| `/admin/useful-info` | Edytor wpisów `/useful-info` |
| `/admin/reviews` | Moderacja opinii (Zatwierdź/Odrzuć/Ukryj) |
| `/admin/photos` | Moderacja zdjęć z signed-URL preview + Trwale usuń |
| `/admin/settings` | Kontakt, adres stopki, polityka, teksty zgód |

### API publiczne
| Endpoint | Metoda | Rate limit |
| --- | --- | --- |
| `/api/availability` | GET | — |
| `/api/booking-inquiries` | POST | 10 / 10 min na IP |
| `/api/reviews` | POST | 20 / 60 min na IP |
| `/api/guest-photos` | POST multipart | 20 / 60 min na IP |

### API admin (`/api/admin/*`)
Pełny zestaw 16 endpointów do zarządzania apartamentami, kalendarzem,
zapytaniami, rezerwacjami, restauracjami, atrakcjami, treścią Rzymu,
opiniami, zdjęciami i ustawieniami.

---

## Szybki start

### Wymagania
- Node.js ≥ 20
- npm
- Konto Supabase (free plan wystarczy do MVP)

### Lokalna instalacja

```bash
git clone <repo>
cd bellaorte2

npm install

cp .env.example .env.local
# uzupełnij URL Supabase + klucze
```

### Uruchomienie bazy

Pełna instrukcja: [`docs/supabase-setup.md`](docs/supabase-setup.md).
W skrócie:

1. Utwórz projekt na <https://supabase.com>.
2. W SQL Editor uruchom **w tej kolejności**:
   - `supabase/schema.sql` — tabele, enumy, RPC.
   - `supabase/rls.sql` — Row Level Security.
   - `supabase/storage.sql` — buckety mediów.
   - `supabase/seed.sql` — dane demo.
3. W Authentication → Users dodaj admina, skopiuj jego UUID i:

   ```sql
   INSERT INTO admin_users (user_id) VALUES ('<uuid-z-auth>');
   ```

4. Uzupełnij `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
   SUPABASE_SERVICE_ROLE_KEY=ey...
   NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=AIza...   # opcjonalne
   ```

### Uruchom dev server

```bash
npm run dev
# → http://127.0.0.1:3000
```

> Strona działa też **bez Supabase** — strony publiczne mają fallback na
> mocki z `src/lib/mock-data.ts`. Kalendarz, formularz rezerwacji i panel
> admina wymagają jednak działającej bazy.

---

## Wdrożenie produkcyjne

### Zalecana platforma
**Vercel** — natywne wsparcie dla Next.js 16 + zmienne środowiskowe.

### Kroki

1. Połącz repo z Vercel.
2. W Vercel → Project → Settings → Environment Variables ustaw:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (tylko Production / Preview, **nie**
     Encrypted = false — Vercel domyślnie szyfruje secret env vars)
   - `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` (opcjonalne)
3. Deploy.
4. Wykonaj audyty z [`docs/audit-checklist.md`](docs/audit-checklist.md).

### Higiena sekretów
- `SUPABASE_SERVICE_ROLE_KEY` żyje wyłącznie w secret storage hostingu
  i lokalnie w `.env.local`. **Nigdy** nie commituj go do gita.
- Klucz `service_role` bypasses RLS — dlatego trafia tylko do
  `src/lib/supabase/admin.ts` z guardem `if (typeof window !== 'undefined')`.
- Po rotacji klucza w Project Settings → API zaktualizuj zmienne na
  hostingu i lokalnie.

---

## Architektura

```
bellaorte2/
├── src/
│   ├── app/
│   │   ├── (public)/          # publiczne strony (header + footer layout)
│   │   ├── admin/             # panel admina (sidebar + auth guard)
│   │   ├── api/               # publiczne route handlery
│   │   └── api/admin/         # admin route handlery (requireAdmin)
│   ├── components/
│   │   ├── public/            # SiteHeader, ApartmentCard, AvailabilityCalendar...
│   │   └── admin/             # AdminCalendar, ApartmentEditor, ReservationTable...
│   └── lib/
│       ├── auth/              # session.ts, require-admin.ts
│       ├── data/              # data layer (Supabase queries, mapping snake→camel)
│       ├── rate-limit/        # in-memory rate limiter (MVP only)
│       ├── supabase/          # browser, server, admin clients
│       ├── validation/        # czyste walidatory (booking, review, photo, ...)
│       ├── types.ts           # canonical TypeScript domain shapes
│       ├── constants.ts       # limity, enumy, RATE_LIMITS
│       └── mock-data.ts       # fallback gdy brak Supabase
├── supabase/
│   ├── schema.sql             # tabele + RPC `get_availability`
│   ├── rls.sql                # Row Level Security
│   ├── storage.sql            # buckety + storage policies
│   └── seed.sql               # dane demo (idempotentne)
├── public/placeholders/       # SVG placeholdery przed wgraniem zdjęć
└── docs/                      # design guide, PRD, technical spec, audyty
```

### Konwencje
- **TypeScript strict** wszędzie. `any` tylko gdy uzasadnione komentarzem.
- **Polskie komunikaty** w UI (Wymaganie 45). Komentarze w kodzie po angielsku.
- **Brak ceny** w UI ani w bazie (Wymagania 4, 9).
- **PII discipline** (Wymaganie 42) — żaden public endpoint nie zwraca PII.
  Service-role tylko serwer.
- **RLS jako defense-in-depth** — endpointy używają service-role + filtry
  `where` w queries.
- **Mocki nie usuwane** — pełnią rolę safety net w środowiskach bez bazy.

---

## Polecane komendy

```bash
# Praca lokalna
npm run dev                  # http://127.0.0.1:3000
npm run build                # produkcyjny build (obowiązkowy przed PR)
npm run lint
npm test                     # vitest unit + RTL

# Supabase deployment
# (patrz docs/supabase-setup.md)

# Audyty
# (patrz docs/audit-checklist.md)
```

---

## Audyt

Po każdym deploymencie produkcyjnym wykonaj 4 audyty:

1. **API publiczne (PII)** — `docs/audit-checklist.md` § 19.1
2. **RLS w Supabase** — § 19.2
3. **Dostępność (axe + NVDA)** — § 19.3
4. **Responsywność (320–1920 px)** — § 19.4

---

## Dokumentacja źródłowa

| Plik | Co zawiera |
| --- | --- |
| [`docs/PRD.md`](docs/PRD.md) | Product Requirements Document |
| [`docs/technical-spec.md`](docs/technical-spec.md) | Specyfikacja techniczna |
| [`docs/data-model.md`](docs/data-model.md) | Model danych |
| [`docs/design-guide.md`](docs/design-guide.md) | Italian Flag Theme, typografia |
| [`docs/wireframes.md`](docs/wireframes.md) | Wireframes |
| [`docs/inspirations.md`](docs/inspirations.md) | Inspiracje wizualne |
| [`docs/google-maps.md`](docs/google-maps.md) | Konfiguracja Maps Embed API |
| [`docs/content-inventory.md`](docs/content-inventory.md) | Inwentarz treści |
| [`docs/content-sources.md`](docs/content-sources.md) | Źródła treści |
| [`docs/implementation-roadmap.md`](docs/implementation-roadmap.md) | Roadmapa |
| [`docs/supabase-setup.md`](docs/supabase-setup.md) | Wdrożenie bazy |
| [`docs/audit-checklist.md`](docs/audit-checklist.md) | Audyty pre-launch |
| [`HANDOFF.md`](HANDOFF.md) | Notatki dla osoby kontynuującej projekt |
| [`.kiro/specs/bellaorte/requirements.md`](.kiro/specs/bellaorte/requirements.md) | 49 wymagań biznesowych |
| [`.kiro/specs/bellaorte/design.md`](.kiro/specs/bellaorte/design.md) | Architektura |
| [`.kiro/specs/bellaorte/tasks.md`](.kiro/specs/bellaorte/tasks.md) | Plan zadań (status) |

---

## Status MVP

99 zadań w spec → **wszystkie ukończone** (sekcje 1–20).

- Strona publiczna kompletna (35 routes)
- Panel admina kompletny (12 routes + 16 API endpointów)
- Walidacja, rate limiting, RLS, signed URLs, mocki — gotowe
- Testy: 10 passed (vitest unit + RTL kalendarza)

Aplikacja jest gotowa do produkcji po wykonaniu audytów manualnych
z `docs/audit-checklist.md`.
