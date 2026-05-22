# BELLAORTE — Podsumowanie projektu

Dokument startowy do przeniesienia projektu na inne konto / inny komputer / innego asystenta AI. Zawiera wszystko co trzeba, żeby kontynuować pracę.

---

## 1. Czym jest projekt

Strona dla dwóch apartamentów wakacyjnych w **Orte (Lazio, Włochy)**, prowadzona po polsku z włoskimi akcentami estetycznymi (magazynowy styl à la Cabana, hotele Aman). Strona zawiera:

- prezentację apartamentów,
- przewodnik po okolicy (atrakcje, restauracje, Rzym),
- blog prowadzony przez właścicieli,
- galerię „Wasze zdjęcia" wysyłaną przez gości,
- kalendarz zajętości + formularz zapytań rezerwacyjnych,
- wydarzenia lokalne i polecenia sezonowe,
- mapę z apartamentami, restauracjami i atrakcjami,
- panel admina (CMS) do zarządzania całą zawartością.

Strona w 100% **po polsku**. Włoski tylko jako dekoracja (motta typu „dolce far niente", podpisy „due dimore, due caratteri", włoska flaga jako tricolore).

---

## 2. Stack techniczny

| Warstwa            | Technologia                                                |
|--------------------|------------------------------------------------------------|
| Framework          | **Next.js 16** (App Router, React Server Components)       |
| Język              | **TypeScript** (strict)                                    |
| Style              | **Tailwind CSS v4** + customowe tokeny w `globals.css`     |
| Czcionki           | **Playfair Display** (display + italic) + **Inter** (UI)   |
| Baza danych        | **Supabase** (PostgreSQL 15) z Row Level Security          |
| Auth               | Supabase Auth (cookies + service role do bypassu RLS)      |
| Storage            | Supabase Storage — dwa buckety: `site-media`, `guest-media`|
| Mapy               | Google Maps Embed API + customowy SVG `PlacesMap`          |
| Markdown           | `react-markdown`                                           |
| Ikony              | `lucide-react` + customowe SVG (`ItalianIcons.tsx`)        |
| Testy              | Vitest + Testing Library + happy-dom                       |
| Hosting            | **Vercel** (Hobby plan, deploy z GitHub na push do `main`) |
| Środowisko lokalne | Node 20, Windows 10/11, PowerShell, `npm.cmd`              |

`package.json` skrypty:
```bash
npm run dev      # next dev na 127.0.0.1:3000
npm run build    # next build
npm run start    # next start
npm run lint     # eslint
npm run test     # vitest run
```

---

## 3. Struktura repozytorium

```
bellaorte2/
├── .env.example                # nazwy zmiennych — WYPEŁNIJ w .env.local
├── .gitignore                  # ignoruje .env.local, .next, scripts/blog-photos
├── docs/                       # PRD, design-guide, technical-spec, content-inventory
├── public/                     # statyczne assety
├── scripts/
│   └── seed-blog.ts            # wgrywa zdjęcia do Storage + tworzy 4 wpisy bloga
├── src/
│   ├── app/
│   │   ├── (public)/           # publiczne strony (apartments, blog, mapa, wydarzenia, ...)
│   │   ├── admin/              # panel admina (CMS)
│   │   └── api/                # wszystkie endpointy REST
│   ├── components/
│   │   ├── admin/              # komponenty CMS (BlogPostEditor, EventEditor, ...)
│   │   └── public/
│   │       ├── decorative/     # Wordmark, BellaorteSeal, TricoloreRule, ItalianIcons, ...
│   │       ├── HeroSection.tsx, ApartmentCard.tsx, PlaceCard.tsx, MobileNav.tsx, ...
│   │       └── PlacesMap.tsx   # interaktywna mapa SVG
│   ├── lib/
│   │   ├── auth/               # session.ts, require-admin.ts
│   │   ├── data/               # warstwa danych (apartments, blog, events, places, ...)
│   │   ├── supabase/           # server.ts (anon SSR), admin.ts (service role)
│   │   └── validation/         # Zod-style walidatory pól formularzy
│   ├── proxy.ts                # Next.js 16 proxy (zastępuje middleware) — wstrzykuje x-pathname
│   └── ...
├── supabase/
│   ├── schema.sql              # 1) podstawowe tabele + RLS
│   ├── rls.sql                 # 2) polityki RLS (jeśli odseparowane od schema)
│   ├── storage.sql             # 3) bucket creation (UI dodaje policies)
│   ├── seed.sql                # 4) startowe dane (apartamenty, atrakcje, restauracje)
│   ├── fix-admin-recursion.sql # 5) is_admin(uid) SECURITY DEFINER — KONIECZNE
│   ├── migration-fala-1.sql    # 6) hero_image_path, blog, blog_comments, community_photos
│   ├── migration-fala-2.sql    # 7) events (lokalne + sezonowe) + demo data
│   └── demo-data.sql           # 8) opcjonalne — przykładowe wpisy/komentarze/rezerwacje
├── README.md                   # instrukcje uruchomienia
├── HANDOFF.md                  # notatki dla osoby przejmującej projekt
└── PROJECT-SUMMARY.md          # ten plik
```

---

## 4. Krok po kroku — uruchomienie na nowym koncie

### 4.1. Wymagania wstępne

- Node 20+ (zalecane LTS)
- Git
- Konto **Supabase** (darmowe wystarczy)
- Konto **Vercel** (do deployu — opcjonalnie do testów lokalnych)
- Konto **GitHub** (Vercel Hobby działa tylko z publicznymi repo)

### 4.2. Sklonowanie repo

```powershell
git clone <url-repo> bellaorte2
cd bellaorte2
npm install
```

### 4.3. Stworzenie projektu Supabase

1. Wejdź na https://supabase.com → New Project.
2. Wybierz region najbliższy Włochom (np. `eu-central-1` Frankfurt).
3. Po utworzeniu projektu skopiuj z **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (legacy) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** (legacy) → `SUPABASE_SERVICE_ROLE_KEY`

   *Uwaga:* używamy **legacy** kluczy (anon/service_role), nie nowych „publishable/secret API keys". W kodzie jest to założone w `src/lib/supabase/`.

### 4.4. Wykonanie migracji SQL (kolejność jest krytyczna)

W Supabase → **SQL Editor** uruchom po kolei (każdy plik w osobnym query):

| #  | Plik                          | Co robi                                                                 |
|----|-------------------------------|-------------------------------------------------------------------------|
| 1  | `supabase/schema.sql`         | Tabele bazowe: apartments, photos, restaurants, attractions, ...        |
| 2  | `supabase/rls.sql`            | Polityki RLS (jeśli nie są w schema.sql — sprawdź zawartość)            |
| 3  | `supabase/storage.sql`        | Tworzy buckety `site-media` (publiczny) i `guest-media` (prywatny)      |
| 4  | `supabase/seed.sql`           | Startowe wiersze (apartamenty, atrakcje, restauracje)                   |
| 5  | `supabase/fix-admin-recursion.sql` | **KONIECZNE** — funkcja `is_admin(uid)` SECURITY DEFINER (bez tego pętle RLS) |
| 6  | `supabase/migration-fala-1.sql` | hero_image_path + blog + komentarze + community_photos               |
| 7  | `supabase/migration-fala-2.sql` | events (lokalne wydarzenia + polecenia sezonowe) + demo data        |
| 8  | `supabase/demo-data.sql`      | (opcjonalne) demo rezerwacje, opinie, komentarze                        |

**Pułapki, na które natknęliśmy się w trakcie:**

- W `migration-fala-2.sql` apostrofy w polskim tekście muszą być escape'owane przez **podwójny apostrof** (`''`), nie przez backslash. Już jest poprawione, ale jak wkleisz nowy tekst — pamiętaj.
- Bucket `guest-media` jest **prywatny**. Strona pobiera jego pliki przez signed URLs używając `createServiceClient()`.
- Storage policies dla bucketów wystarczy ustawić w **Supabase UI** (Storage → Policies), bo bezpośrednie SQL na `storage.objects` daje błąd „permission denied / must be owner".

### 4.5. Stworzenie konta admina

1. W Supabase → **Authentication → Users → Add user** → wpisz email + hasło, zaznacz **Auto Confirm User**.
2. Skopiuj UUID nowego użytkownika.
3. W **SQL Editor** wykonaj (z kluczem service_role, czyli normalnym query):
   ```sql
   INSERT INTO admin_users (user_id) VALUES ('TU-WKLEJ-UUID');
   ```
4. Gotowe — ten email + hasło logują do `/admin/login`.

### 4.6. Plik `.env.local`

W katalogu głównym projektu utwórz **`.env.local`** (nie commitujemy!):

```ini
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=AIza...   # opcjonalny — dla map atrakcji/restauracji
```

### 4.7. Lokalne uruchomienie

```powershell
npm run dev
```

Otwórz **http://127.0.0.1:3000** (nie `localhost` — Supabase auth cookies lubią konkretny host).

- Strona publiczna: `/`
- Login admina: `/admin/login`
- Panel admina: `/admin`

### 4.8. Deploy na Vercel

1. Wypchnij repo na **publiczny** GitHub (Hobby plan nie wspiera prywatnych repo z innymi autorami).
2. Vercel → **Add New Project** → wybierz repo.
3. W **Environment Variables** dodaj te same 4 zmienne co w `.env.local`.
4. Deploy. Auto-redeploy działa przy każdym `git push origin main`.

---

## 5. Architektura — najważniejsze decyzje projektowe

### 5.1. Trzy poziomy dostępu do bazy

| Klient                     | Plik                              | Kiedy używać                                  |
|----------------------------|-----------------------------------|-----------------------------------------------|
| **createServerClient()**   | `src/lib/supabase/server.ts`      | Czyta sesję z cookies, anonimowe SSR (RLS)    |
| **createServiceClient()**  | `src/lib/supabase/admin.ts`       | Bypass RLS — TYLKO endpointy admin po `requireAdmin()` lub publiczne POST-y (booking inquiries, photo uploads), które muszą zapisać dane bez sesji |
| **client przeglądarki**    | (tworzony ad hoc w komponentach)  | Realtime / formularze klienckie               |

### 5.2. Polski + włoski branding

- Wszystkie etykiety UI **po polsku**.
- Włoski tylko jako dekoracja (motta w `SectionDivider`, podpisy w `Wordmark`).
- Tricolore (włoska flaga) jako subtelny pasek w `TricoloreRule.tsx`.
- Customowe SVG ikony w `ItalianIcons.tsx`: `AqueductIcon`, `TowerIcon`, `CypressIcon`, `AmphoraIcon`, `OliveBranchIcon`, `RomanArchIcon`, `TuscanSunIcon`.
- Pieczęć `BellaorteSeal.tsx` — okrągła „BELLAORTE · ESTABLISHED MMXXVI".

### 5.3. RLS (Row Level Security)

- Każda tabela ma politykę publicznego SELECT (gdy `published_at IS NOT NULL`).
- Każda tabela ma admin INSERT/UPDATE/DELETE używając `is_admin(auth.uid())`.
- Funkcja `is_admin` jest **SECURITY DEFINER** żeby uniknąć rekurencji (nie odpytuje znowu `admin_users` przy każdym SELECT).

### 5.4. Storage

- `site-media` (publiczny): zdjęcia apartamentów, blog, hero strony głównej, zdjęcia restauracji/atrakcji.
- `guest-media` (prywatny): zdjęcia zatwierdzone w „Wasze zdjęcia" — pobierane przez signed URLs.

### 5.5. Mocks jako siatka bezpieczeństwa

Każda strona publiczna ma `try/catch` z fallbackiem na zahardkodowane dane jeśli `NEXT_PUBLIC_SUPABASE_URL` nie jest ustawione. To pozwala uruchomić projekt bez Supabase do podglądu designu. **Nie usuwaj tego.**

---

## 6. Najczęstsze problemy i rozwiązania

| Problem                                                    | Rozwiązanie                                                          |
|------------------------------------------------------------|----------------------------------------------------------------------|
| `ERR_TOO_MANY_REDIRECTS` na `/admin/login`                 | Sprawdź czy `is_admin()` istnieje. Uruchom `fix-admin-recursion.sql`. |
| „Brak uprawnień administracyjnych" po logowaniu            | Brak wpisu w `admin_users`. Dodaj UUID jak w 4.5.                    |
| `permission denied for table users`                        | Logujesz w SQL Editor jako anon. Nie ustawiaj `set local role` — domyślnie SQL Editor jedzie service_role. |
| `new row violates RLS policy` przy INSERT do `admin_users` | Wstaw przez SQL Editor (service_role bypass). Nie z aplikacji.       |
| Hydration warning `__processed_*` / `bis_register`         | To rozszerzenia przeglądarki. `<body suppressHydrationWarning>` w `src/app/layout.tsx` to ignoruje. |
| Apostrofy w SQL łamią migrację                             | Zamień każdy `'` w treści na `''` (PostgreSQL standard).             |
| `npm` w PowerShell daje pipeline error                     | Używaj `npm.cmd` zamiast `npm`.                                       |
| Vercel: „commit author did not have contributing access"   | Upewnij się że email w `git config` jest skojarzony z kontem GitHub przypiętym do Vercela. |

---

## 7. Stan funkcji (co działa)

### Publiczne (`/`)
- Strona główna z konfigurowalnym hero (admin może podmienić zdjęcie)
- `/apartments` + `/apartments/[slug]` — szczegóły dwóch apartamentów
- `/guide` — przewodnik
- `/blog` + `/blog/[slug]` — blog z komentarzami (moderowane przed publikacją)
- `/wasze-zdjecia` — galeria zdjęć od gości + uploader
- `/restaurants`, `/places`, `/rome`, `/useful-info` — przewodniki
- `/wydarzenia` — wydarzenia lokalne + polecenia sezonowe
- `/mapa` — interaktywna mapa wszystkich miejsc
- `/booking` — formularz zapytania rezerwacyjnego
- `/booking/confirmation` — potwierdzenie po wysłaniu
- `/privacy` — polityka prywatności

### Admin (`/admin`)
- Dashboard z metrykami
- Apartamenty (CRUD + zdjęcia)
- Kalendarz zajętości (blokady)
- Zapytania i rezerwacje
- Restauracje, Atrakcje, Rzym, Informacje praktyczne (CRUD)
- **Wydarzenia / sezony** (CRUD z hero, datami, etykietą okresu)
- Blog (CRUD wpisów + moderacja komentarzy)
- Wasze zdjęcia (moderacja: zatwierdź/odrzuć/usuń)
- Opinie (moderacja)
- Zdjęcia restauracji/atrakcji
- Ustawienia (wgrywanie hero strony głównej)

---

## 8. Co jest zaplanowane, ale nie zrobione (Wave 3)

Niezaimplementowane życzenia użytkownika z czatu:

1. **Trójjęzyczność PL/EN/IT** — przełącznik języka w nawigacji + tłumaczenia treści.
2. **Email do gości po pobycie** — automat (cron + Resend) z prośbą o opinię i zachętą do wrzucenia zdjęć.
3. **Rozszerzenie kalendarza wydarzeń lokalnych** — widok kalendarza zamiast listy.
4. **Komentarze pod blogiem** — częściowo gotowe (moderacja działa), do dopracowania UI komentarzy publicznych.

---

## 9. Konwencje, których trzymaliśmy się

- **Język UI**: polski, włoski tylko jako dekoracja.
- **Apostrofy w SQL**: zawsze `''` (podwójny apostrof), nigdy `\'`.
- **Cudzysłowy w JSX**: polskie `„…"` lub apostrofy ASCII, ale **konsekwentnie** (linter `react/no-unescaped-entities` nie lubi mieszania).
- **Daty**: `pl-PL` locale, format `numeric/long/numeric`.
- **PII**: nigdy nie zwracamy danych gości z publicznych endpointów (Wymaganie 42).
- **Branch git**: `main`. Workflow: `git add . && git commit -m "..." && git push origin main`.
- **Hosting**: Vercel auto-deploy. Hobby plan = repo musi być publiczne.
- **PowerShell**: `npm.cmd`, `npx.cmd`. Exit Code 1 z `git push` to artefakt PowerShella, nie błąd.

---

## 10. Tooling do pracy z bazą po stronie skryptów

- `scripts/seed-blog.ts` — wgrywa zdjęcia z `scripts/blog-photos/` (gitignored) do `site-media/blog/` i tworzy 4 wpisy bloga. Uruchom: `npx tsx scripts/seed-blog.ts`.
- Foldery typu `scripts/blog-photos/` są w `.gitignore` żeby nie commitować zdjęć z dysku użytkownika.

---

## 11. Najważniejsze pliki, które warto przeczytać przy starcie

| Plik                                                | Po co                                                  |
|-----------------------------------------------------|--------------------------------------------------------|
| `README.md`                                         | Szybki start                                           |
| `HANDOFF.md`                                        | Notatki przekazania                                    |
| `docs/PRD.md`                                       | Co strona ma robić (z perspektywy biznesowej)          |
| `docs/technical-spec.md`                            | Spec techniczny                                        |
| `docs/data-model.md`                                | Schemat bazy                                           |
| `docs/design-guide.md`                              | Tokeny kolorów, czcionki, motyw                        |
| `src/app/layout.tsx`                                | Root layout — Playfair, suppressHydrationWarning       |
| `src/app/globals.css`                               | Tokeny Tailwind v4 (`crema`, `olive`, `terracotta`, `gold`) |
| `src/proxy.ts`                                      | Next.js 16 proxy (zastępuje middleware) — wstrzykuje `x-pathname` |
| `src/lib/auth/session.ts`                           | `getAdminSession()` — guard panelu                     |
| `src/lib/data/events.ts`                            | Wzorcowa warstwa danych (mapowanie snake_case → camelCase) |
| `src/components/admin/EventEditor.tsx`              | Wzorzec formularza CMS (lista, edytor, upload hero)    |
| `src/components/public/decorative/`                 | Wszystkie dekoracje włoskie                            |

---

## 12. Kontekst historyczny (ostatnia praca)

**Wave 2 zakończona:** dodano tabelę `events`, publiczną stronę `/wydarzenia`, mapę `/mapa`, admin CRUD na wydarzeniach (`/admin/events/new`, `/admin/events/[id]`), linki do wydarzeń i mapy w `SiteHeader`, `SiteFooter`, `MobileNav` (mobile dziedziczy z headera) i `AdminSidebar`. Build production czysty (`npm run build` exit 0).

**Co zostało po Wave 2:**
- Commit + push zmian (wszystkie pliki z Wave 2 czekają na `git add`).
- Po deployu zweryfikuj na Vercelu, że `/wydarzenia` i `/mapa` działają (po wcześniejszym uruchomieniu `migration-fala-2.sql` na Supabase).

**Następny logiczny krok:** Wave 3 (i18n PL/EN/IT) lub dopieszczenie istniejących funkcji.

---

Powodzenia. W razie czego — wszystkie istotne decyzje są zapisane w komentarzach plików (`/**` na górze), więc przy czytaniu nie ma niespodzianek.
