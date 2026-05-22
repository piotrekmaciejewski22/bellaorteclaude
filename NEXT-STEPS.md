# BELLAORTE — Kolejne kroki i taski

Ten dokument opisuje **co zostało do zrobienia**, w jakiej kolejności i z jakim podejściem. Czytaj razem z `PROJECT-SUMMARY.md`.

Kolejność jest celowa: najpierw rzeczy które **odblokowują testowanie produkcyjne**, potem rozbudowa funkcji, na końcu polish.

---

## FAZA 0 — Domknięcie Wave 2 (KONIECZNE PRZED CZYMKOLWIEK INNYM)

Te 4 kroki mają wszystkie pliki gotowe na dysku. Trzeba tylko wykonać.

### Krok 0.1. Uruchom migrację bazy

W Supabase → **SQL Editor** uruchom plik:

```
supabase/migration-fala-2.sql
```

**Co tworzy:** tabelę `events` (lokalne wydarzenia + polecenia sezonowe), polityki RLS, 4 demo wpisy.

**Sprawdzenie sukcesu:** w SQL Editor:
```sql
select kind, title, display_period from public.events order by kind, display_order;
```
Powinno zwrócić 4 wiersze (2× `local`, 2× `seasonal`).

**Jeśli wywali apostrofem** → już raz to naprawiliśmy, ale gdyby się powtórzyło: zamień każdy pojedynczy `'` w tekście wartości na `''` (podwójny apostrof).

### Krok 0.2. Test lokalny

```powershell
cd c:\Users\macie\Desktop\CODEX\bellaorte2
npm run dev
```

Otwórz w kolejności i potwierdź że działa:
- http://127.0.0.1:3000/wydarzenia → widzi się Festa di San Faustino + Sagra delle Castagne + 2 sezonowe
- http://127.0.0.1:3000/mapa → widać piny apartamentów, restauracji, atrakcji
- http://127.0.0.1:3000/admin/events → lista wydarzeń, przycisk „Nowy wpis"
- http://127.0.0.1:3000/admin/events/new → formularz tworzenia
- Edycja istniejącego: na liście kliknij „Edytuj" → wjedź w `/admin/events/[id]` → zmień tytuł → zapisz → wróć → tytuł zmieniony
- Test usunięcia: utwórz wpis testowy, wejdź w edycję, kliknij „Usuń" → wpis znika

### Krok 0.3. Commit + push

```powershell
git status                 # zobacz co się zmieniło
git add .
git commit -m "Wave 2: events admin CRUD + nav links + project docs"
git push origin main
```

Vercel zrobi auto-redeploy. Po ~2 minutach sprawdź produkcję pod tymi samymi URL-ami.

### Krok 0.4. Smoke test produkcyjny

Na deploy URL z Vercela:
- `/wydarzenia` — czy są 4 wpisy (musisz wcześniej uruchomić `migration-fala-2.sql` na **produkcyjnej** Supabase, jeśli to inny projekt niż lokalna).
- `/mapa` — czy mapa się ładuje
- `/admin/events` — zaloguj się i sprawdź CRUD

Jeśli wszystko zielone → **Wave 2 zamknięta**. Idziemy do Fazy 1.

---

## FAZA 1 — Trójjęzyczność PL/EN/IT (Wave 3, część 1)

**Po co:** strona jest dla apartamentów we Włoszech, więc goście niemówiący po polsku (Włosi, anglojęzyczni) muszą rozumieć ofertę.

**Skala:** to największy task w Wave 3. Realnie 4-8h pracy z AI.

### Decyzja architektoniczna

**Rekomendacja:** użyj `next-intl` (najpopularniejsza biblioteka i18n dla Next.js App Router).

**Alternatywa:** ręczny system z `cookies()` + JSON message files — szybsze do wdrożenia, ale gorzej skaluje. Jeśli masz mało czasu, idź ręcznie.

### Taski

#### 1.1. Setup biblioteki

```powershell
npm install next-intl
```

Stwórz strukturę:
```
src/
├── i18n/
│   ├── config.ts          # locales: ['pl', 'en', 'it'], defaultLocale: 'pl'
│   ├── request.ts         # ładowanie wiadomości
│   └── messages/
│       ├── pl.json
│       ├── en.json
│       └── it.json
```

#### 1.2. Refaktor routingu

Next.js i18n w App Router wymaga albo:
- **Subpath routing**: `/`, `/en`, `/it` (zalecane — działa bez middleware'u)
- **Domain routing**: `bellaorte.pl`, `bellaorte.com`, `bellaorte.it` (nie polecam dla MVP)

Wybierz **subpath**. Zmienia to strukturę plików:

```
src/app/
├── [locale]/              # nowy
│   ├── (public)/
│   ├── admin/             # admin zostaje po polsku — to CMS dla siostry, nie dla gości
│   └── layout.tsx
└── ...
```

Tu trzeba uważać: admin **nie powinien** być w `[locale]` — admin jest tylko po polsku. Można albo:
- zostawić admin w `src/app/admin/` (poza `[locale]`),
- LUB wrzucić wszystko do `[locale]` ale dla admina ignorować locale.

**Rekomendacja:** zostaw admin poza `[locale]`. Mniej refaktora.

#### 1.3. Przełącznik języka

Komponent `LanguageSwitcher.tsx` w `src/components/public/`:
- 3 flagi (PL 🇵🇱, EN 🇬🇧, IT 🇮🇹) jako małe SVG (nie używaj emoji — różnie się renderują)
- Po kliknięciu zmienia routing na `/{locale}/...`
- Zapisuje wybór w cookie `NEXT_LOCALE` (next-intl tego pilnuje)
- Umieść w `SiteHeader` po prawej, blisko „Rezerwacja"

#### 1.4. Wyciągnięcie tekstów

Najbardziej żmudny task. Każdy hardkodowany string w `src/app/(public)/**` i `src/components/public/**` musi pójść do `messages/pl.json`, `en.json`, `it.json`.

**Strategia minimalizacji bólu:**

- Zacznij od najważniejszych stron (kolejność): `/`, `/apartments`, `/booking`, `/blog`, `/wydarzenia`, `/mapa`, reszta.
- Strukturuj klucze hierarchicznie: `home.hero.title`, `apartments.list.heading`, itp.
- Włoskie motta dekoracyjne (np. „dolce far niente") **zostawiaj jako stałe** — to element brandingu, nie tekst do tłumaczenia.

Przykład:
```json
// pl.json
{
  "home": {
    "hero": { "title": "Dwa apartamenty w sercu Tuscia" },
    "cta": { "book": "Sprawdź dostępność" }
  }
}
```

```tsx
// HeroSection.tsx
import { useTranslations } from 'next-intl';
export function HeroSection() {
  const t = useTranslations('home.hero');
  return <h1>{t('title')}</h1>;
}
```

#### 1.5. Treści dynamiczne (blog, events)

Treść z bazy (blog posts, events) **nie tłumaczy się automatycznie**. Dwa podejścia:

**Opcja A (proste):** Pole `language` w tabelach `blog_posts` i `events` (`'pl' | 'en' | 'it'`). Każdy wpis istnieje w jednej wersji językowej. UI filtruje po wybranym locale.

**Opcja B (lepsze UX):** Pole `translations jsonb` z mapą `{ pl: {...}, en: {...}, it: {...} }`. Admin widzi 3 zakładki w edytorze.

Dla MVP: **Opcja A**. Migracja:
```sql
alter table blog_posts add column language text not null default 'pl';
alter table events add column language text not null default 'pl';
create index blog_posts_lang_idx on blog_posts (language, published_at desc);
create index events_lang_idx on events (language, kind);
```

W warstwie danych (`src/lib/data/blog.ts`, `src/lib/data/events.ts`) dodaj filtr `.eq('language', locale)`.

#### 1.6. Tłumaczenie treści

Możesz:
- Sam przetłumaczyć teksty UI (`messages/en.json`, `it.json`).
- Wpisy bloga zostawić tylko po polsku, dodawać tłumaczenia stopniowo.
- Użyć GPT/Claude do pierwszego draftu, potem ręczna korekta.

#### 1.7. Test akceptacyjny

- Przełączasz na EN → strona w angielskim, włoskie motta zostają, admin niezmieniony.
- Przełączasz na IT → strona w włoskim, dekoracyjne motta nadal jako akcent (subtelny duplikat).
- Cofasz na PL → wszystko po polsku.
- URL zmienia się na `/en/apartments`, `/it/wydarzenia` itp.

---

## FAZA 2 — Email do gości po pobycie

**Po co:** automat który zachęci gości do wystawienia opinii i wrzucenia zdjęć po wyjeździe.

### Decyzja architektoniczna

- **Resend** do wysyłki (najprostszy, darmowe 3000 maili/mies.).
- **Vercel Cron Jobs** do uruchamiania (darmowe na Hobby, 1 cron/dzień).

### Taski

#### 2.1. Setup Resend

1. Załóż konto na https://resend.com.
2. Dodaj domenę albo użyj `onboarding@resend.dev` na początek.
3. W `.env.local` i Vercel env vars:
   ```ini
   RESEND_API_KEY=re_...
   RESEND_FROM=Bellaorte <hi@bellaorte.pl>
   ```
4. `npm install resend`.

#### 2.2. Tabela kontaktów gości

W tej chwili `booking_inquiries` przechowuje email pytającego, ale nie wiemy czy gość rzeczywiście był. Trzeba dodać tabelę `reservations` (jeśli nie ma) z `email`, `end_date`, `email_sent_at`.

Sprawdź w `supabase/schema.sql` — może już jest. Jeśli nie:

```sql
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid references apartments(id),
  guest_name text not null,
  guest_email text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'confirmed',
  follow_up_email_sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table reservations enable row level security;
-- + polityki admin only (jak inne tabele)
```

#### 2.3. Endpoint cron

`src/app/api/cron/post-stay-emails/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  // Vercel Cron wysyła nagłówek Authorization: Bearer ${CRON_SECRET}
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const client = createServiceClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Znajdź rezerwacje które skończyły się 2-3 dni temu i jeszcze nie dostały maila
  const today = new Date().toISOString().slice(0, 10);
  const threeDaysAgo = new Date(Date.now() - 3 * 86400_000).toISOString().slice(0, 10);

  const { data } = await client
    .from('reservations')
    .select('*')
    .eq('status', 'confirmed')
    .gte('end_date', threeDaysAgo)
    .lt('end_date', today)
    .is('follow_up_email_sent_at', null);

  for (const r of data ?? []) {
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: r.guest_email,
      subject: 'Grazie! Jak wspominacie pobyt w Bellaorte?',
      html: `<!-- szablon HTML — zachęta do opinii + linka do /wasze-zdjecia -->`,
    });
    await client
      .from('reservations')
      .update({ follow_up_email_sent_at: new Date().toISOString() })
      .eq('id', r.id);
  }

  return NextResponse.json({ sent: data?.length ?? 0 });
}
```

#### 2.4. Konfiguracja Vercel Cron

`vercel.json` w głównym katalogu:

```json
{
  "crons": [
    {
      "path": "/api/cron/post-stay-emails",
      "schedule": "0 10 * * *"
    }
  ]
}
```

Codziennie o 10:00 UTC. Vercel automatycznie wstrzykuje `Authorization: Bearer ${CRON_SECRET}` jeśli ustawisz tę zmienną w env.

#### 2.5. Szablon HTML maila

Stwórz `src/emails/post-stay.tsx` (React Email opcjonalnie, albo zwykły HTML string). Zawartość:
- „Grazie za Wasz pobyt!" (po polsku, ewentualnie też EN/IT jak Faza 1 gotowa)
- Link do wystawienia opinii (formularz `/booking/review/[token]` lub po prostu mailto)
- Link do `/wasze-zdjecia#upload` z prośbą o zdjęcia
- Stopka z kontaktem

#### 2.6. Test

- Wstaw ręcznie do `reservations` rezerwację z `end_date` = wczoraj, `guest_email` = twój email, `follow_up_email_sent_at` = NULL.
- Wywołaj endpoint lokalnie: `curl -H "Authorization: Bearer DEV" http://127.0.0.1:3000/api/cron/post-stay-emails` (z `CRON_SECRET=DEV` w `.env.local`).
- Sprawdź czy mail przyszedł.
- Sprawdź czy `follow_up_email_sent_at` zostało wypełnione (drugie wywołanie powinno wysłać 0 maili).

---

## FAZA 3 — Komentarze publiczne pod blogiem

**Stan obecny:** moderacja działa w adminie (zatwierdzanie/odrzucanie). Brakuje publicznego wyświetlania zatwierdzonych komentarzy + formularza dodawania nowych.

### Taski

#### 3.1. Wyświetlanie zatwierdzonych komentarzy

W `src/app/(public)/blog/[slug]/page.tsx` na dole posta:
- Pobierz `blog_comments` gdzie `post_id = current` AND `status = 'approved'`.
- Sortuj po `created_at` rosnąco.
- Wyświetl jako listę: imię (lub „Anonimowy gość"), data, treść.

#### 3.2. Formularz dodawania

Komponent `BlogCommentForm.tsx` (klient):
- Pola: imię (opcjonalne), email (do moderacji, nie pokazywane), treść.
- POST do `/api/blog-comments` (już istnieje).
- Walidacja: treść 10-2000 znaków.
- Po wysłaniu: komunikat „Dziękujemy! Komentarz pojawi się po moderacji."
- Honeypot (ukryte pole `website` — jeśli wypełnione → bot, ignoruj).

#### 3.3. Powiadomienie admina

Przy każdym nowym komentarzu wyślij email do siostry (przez Resend, jeśli skonfigurowany w Fazie 2):
- Temat: „Nowy komentarz pod wpisem [tytuł]"
- Link do `/admin/blog-comments`

Endpoint już ma walidację, dorzuć logikę wysyłki maila po sukcesie.

#### 3.4. Anti-spam minimum

- Honeypot (już opisany).
- Rate limiting per IP (1 komentarz/min) — można ręcznie w endpoincie, albo użyć `@upstash/ratelimit` z darmowym Upstash Redis.
- Jeśli treść zawiera URL → automatycznie `status = 'pending'` (już tak jest, ale zweryfikuj).

---

## FAZA 4 — Kalendarz wydarzeń lokalnych

**Po co:** widok kalendarza zamiast listy wydarzeń. Widać miesiąc, kropki na dniach z wydarzeniami, klik → szczegóły.

### Taski

#### 4.1. Komponent kalendarza

`src/components/public/EventsCalendar.tsx` (klient):
- Siatka miesięczna (jak `AvailabilityCalendar` ale prostszy).
- Pobiera `events` przez prop.
- Dni z wydarzeniami → mała kropka (kolor wg `kind`: terracotta dla `local`, olive dla `seasonal`).
- Klik w dzień → modal/drawer ze szczegółami wydarzeń tego dnia.
- Strzałki ← → do nawigacji między miesiącami.

#### 4.2. Integracja na `/wydarzenia`

Dodaj zakładkę / przełącznik na górze strony:
- „Lista" (obecny widok)
- „Kalendarz" (nowy widok)

LocalStorage zapamiętuje wybór.

#### 4.3. Mobilna wersja

Na telefonach kalendarz miesięczny jest za mały — pokaż **listę** zgrupowaną po miesiącach.

---

## FAZA 5 — Polish i bugfixy (rozproszone)

Drobne rzeczy, które zauważyliśmy ale ich nie naprawiliśmy:

### 5.1. Zamiana `<img>` na `<Image>` (lint warnings)

Linter krzyczy o:
- `src/app/(public)/page.tsx:338`
- `src/app/(public)/places/[slug]/page.tsx:172`
- `src/app/(public)/restaurants/[slug]/page.tsx:214`
- `src/components/admin/PhotoModerationQueue.tsx:122`
- `src/components/public/CommunityGallery.tsx:66, 133`

Każdy `<img>` zamień na `<Image fill unoptimized>` z next/image (lub `width/height` jeśli wymiary znane). `unoptimized` bo Supabase Storage URL-e nie są w `next.config.ts` jako allowed domains — alternatywnie dodaj domeny do `images.remotePatterns`.

### 5.2. Nieescape'owane apostrofy w JSX

- `src/app/(public)/page.tsx:382:114` — jeden `"` do zamiany na `&quot;`.
- `src/components/public/HeroSection.tsx:105:77` — jeden `'` do zamiany na `&apos;`.

Quick fix.

### 5.3. Nieużywane importy/zmienne

- `scripts/seed-blog.ts:36` — `PhotoUpload` unused.
- `src/components/admin/ItineraryEditor.tsx:45` — `setInfoSections` unused.
- `src/components/public/AvailabilityCalendar.tsx:84-85` — `_apartmentSlug`, `_apartmentMaxGuests` unused.

Albo użyj, albo usuń.

### 5.4. Cache mapy `/mapa`

Strona ma `dynamic = 'force-dynamic'`. Jeśli zmiany w restauracjach/atrakcjach są rzadkie, można dać `revalidate = 600` (10 min ISR) i zyskać szybkość.

### 5.5. Performance — bundle size

Po skończeniu Wave 3 uruchom:
```powershell
npm run build
```
i sprawdź sekcję „First Load JS shared by all". Jeśli > 200kB, zoptymalizuj — głównie `react-markdown` i `lucide-react` (importuj per-icon zamiast całej paczki, ale lucide robi to automatycznie przy tree-shake).

### 5.6. SEO

- Każda strona publiczna potrzebuje `generateMetadata()` z `title`, `description`, `openGraph`.
- `src/app/sitemap.ts` — generuj sitemap dynamicznie z apartamentów, blog postów, atrakcji, wydarzeń.
- `public/robots.txt` — pozwól wszystkim, blokuj `/admin/*` i `/api/*`.

### 5.7. A11y

- Sprawdź `aria-label` na przyciskach z samymi ikonami.
- Test klawiaturą: czy fokus widoczny na każdym interaktywnym elemencie?
- `<html lang="pl">` (lub dynamicznie po Fazie 1).

---

## FAZA 6 — Opcjonalne rozszerzenia (nice to have)

### 6.1. Newsletter

Formularz „zapisz się" w stopce → tabela `newsletter_subscribers` → automatycznie wysyła nowe wpisy bloga raz w miesiącu (cron + Resend).

### 6.2. Integracja z iCal

- Eksport zajętości apartamentów jako `.ics` URL → siostra wkleja w swoim Google Calendar.
- Import bloków z Airbnb/Booking.com przez ich `.ics` feed (wymaga dodatkowego cron joba).

### 6.3. Dashboard z metrykami

Dodaj na `/admin` wykresy:
- Liczba zapytań rezerwacyjnych w miesiącu (chart.js albo recharts)
- Najpopularniejsze posty bloga (po liczbie odsłon — wymaga tracking)
- Zdjęcia gości czekające na moderację

### 6.4. PWA

Dodaj manifest + service worker → strona instalowalna na telefonie. Dla blogu offline-first.

---

## Kolejność wykonania (rekomendacja)

| Priorytet | Faza                       | Szacunek czasu | Wartość biznesowa             |
|-----------|----------------------------|----------------|-------------------------------|
| 🔴 KRYTYCZNY | Faza 0: domknięcie Wave 2 | 30 min         | Odblokowuje testy produkcji   |
| 🟠 WYSOKI   | Faza 5: polish + bugfixy   | 2-3h           | Eliminuje błędy buildu / SEO  |
| 🟠 WYSOKI   | Faza 3: komentarze bloga    | 3-4h           | Strona już ma moderację — tylko UI |
| 🟡 ŚREDNI   | Faza 1: i18n               | 6-10h          | Otwiera rynek EN/IT           |
| 🟡 ŚREDNI   | Faza 2: email po pobycie    | 3-5h           | Konwersja na opinie/zdjęcia   |
| 🟢 NISKI    | Faza 4: kalendarz wydarzeń  | 4-6h           | UX, ale lista też wystarcza   |
| 🟢 NISKI    | Faza 6: newsletter, iCal    | 2-8h każdy     | Nice to have                  |

**Najpilniejsza ścieżka jeśli masz tylko 1 dzień:** 0 → 5 → 3.

**Najwartościowsza ścieżka jeśli masz tydzień:** 0 → 5 → 3 → 1 → 2.

---

## Jak rozmawiać z AI w nowym oknie

Gdy zaczniesz nową sesję na innym koncie / w innym chacie, zacznij od:

> Mam projekt **Bellaorte** w `c:\...\bellaorte2`. Przeczytaj `PROJECT-SUMMARY.md` i `NEXT-STEPS.md` — to opisuje co to jest i co zostało do zrobienia. Chcę zacząć od **Fazy [X]: [nazwa]**.

To wystarczy, żeby AI wiedziało:
- Co to jest projekt (z `PROJECT-SUMMARY.md`).
- Co już działa.
- Co masz zrobione i czego nie ruszać.
- Co jest następne i jak to zrobić (ten plik).

Przy każdej fazie zacznij od **Kroku 0** (uruchom `npm run dev`, sprawdź że działa lokalnie, zrób branch git jeśli boisz się popsuć `main`).

---

## Standardy do zachowania (powtórka z PROJECT-SUMMARY)

- Nie usuwaj **mocków** w stronach publicznych (siatka bezpieczeństwa).
- Nie usuwaj **`suppressHydrationWarning`** z `<body>` (browser extensions).
- Apostrofy w SQL: `''`, nigdy `\'`.
- W PowerShell: `npm.cmd`, nie `npm`.
- Repo: branch `main`, push triggeruje deploy na Vercel.
- Admin = tylko polski (CMS dla siostry). Publiczna strona = PL/EN/IT po Fazie 1.
- PII gości nigdy nie wyciekają z publicznych endpointów.

---

To wszystko. Plan jest „goal-oriented" — każda faza dostarcza widoczną wartość użytkownikowi.
