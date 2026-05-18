# BELLAORTE — Audit checklists

Ten dokument zbiera 4 manualne audyty wymagane przez sekcję 19 spec-a.
Każdy audyt ma listę kontrolną do zaznaczenia ręcznie po wdrożeniu
produkcyjnym (Wymagania 38, 42, 46, 47).

---

## 19.1 — Audyt API publicznego (PII)

**Cel:** Żaden endpoint publiczny nie zwraca danych osobowych gościa
(Wymaganie 42).

### Endpointy do sprawdzenia

| Endpoint | Metoda | Sprawdź |
| --- | --- | --- |
| `/api/availability` | GET | Odpowiedź zawiera tylko `{ days: [{date, status}] }`. Żadnych imion, emaili, telefonów. |
| `/api/booking-inquiries` | POST 201 | Odpowiedź zawiera **tylko** `{ id }`. Brak `guest_full_name`, `guest_email`, `guest_phone`, `message`. |
| `/api/booking-inquiries` | POST 400/409/429 | Odpowiedź to `{ error }` lub `{ errors: [{ field, message }] }` — brak PII. |
| `/api/reviews` | POST 201 | Odpowiedź zawiera **tylko** `{ id }`. |
| `/api/guest-photos` | POST 201 | Odpowiedź zawiera **tylko** `{ id }`. |

### Procedura

1. Uruchom `npm run dev` lokalnie z podpiętym Supabase.
2. Wykonaj każdy endpoint przy pomocy `curl` lub Postmana z poprawnymi
   danymi i sprawdź odpowiedź:

   ```bash
   # Booking inquiry — sukces
   curl -X POST http://127.0.0.1:3000/api/booking-inquiries \
     -H "content-type: application/json" \
     -d '{"apartmentId":"<uuid>","checkIn":"2026-06-01","checkOut":"2026-06-05","adults":2,"fullName":"Jan Kowalski","email":"jan@example.com","consent":true}'
   # Oczekiwana odpowiedź: {"id":"<uuid>"}
   ```

3. Sprawdź w narzędziach developerskich (Network), że odpowiedź NIE
   zawiera pola `guest_full_name`, `guest_email`, `guest_phone`,
   `message`, `source_ip`, `consent_at`.

### Status

- [ ] `/api/availability` — zwraca tylko `{ days }` z `{ date, status }`
- [ ] `/api/booking-inquiries` 201 — zwraca tylko `{ id }`
- [ ] `/api/booking-inquiries` 400 — zwraca `{ errors }` bez PII
- [ ] `/api/booking-inquiries` 409 — zwraca `{ error }` bez PII
- [ ] `/api/reviews` 201 — zwraca tylko `{ id }`
- [ ] `/api/guest-photos` 201 — zwraca tylko `{ id }`

---

## 19.2 — Audyt RLS w Supabase Studio

**Cel:** Anonimowy klient (anon key) nie widzi prywatnych tabel
(Wymagania 38, 42).

### Procedura

1. W Supabase Studio otwórz **SQL Editor**.
2. Przełącz role na `anon` (jeśli jest opcja) lub uruchom zapytania
   ze świeżego klienta z anon key.
3. Wykonaj poniższe zapytania jedno po drugim. Każde MUSI zwrócić
   `0 rows`.

```sql
-- Te tabele nie mogą zwracać żadnych wierszy dla anon:
SELECT count(*) FROM booking_inquiries;
SELECT count(*) FROM reservations;
SELECT count(*) FROM calendar_blocks;
SELECT count(*) FROM admin_users;

-- Te zwracają tylko approved:
SELECT count(*) FROM reviews WHERE status != 'approved';
SELECT count(*) FROM guest_photos WHERE status != 'approved';

-- Te zwracają tylko opublikowane i nie soft-deleted:
SELECT count(*) FROM apartments WHERE published_at IS NULL;
SELECT count(*) FROM restaurants WHERE published_at IS NULL OR deleted_at IS NOT NULL;
SELECT count(*) FROM attractions WHERE published_at IS NULL OR deleted_at IS NOT NULL;
SELECT count(*) FROM rome_itinerary WHERE published_at IS NULL;
SELECT count(*) FROM rome_info_sections WHERE published_at IS NULL;
SELECT count(*) FROM travel_info WHERE published_at IS NULL;
```

### Sprawdź też z poziomu klienta JS

```js
import { createClient } from '@supabase/supabase-js';
const supa = createClient(URL, ANON_KEY);

// Każde z tych powinno zwrócić data: [], error: null
console.log(await supa.from('booking_inquiries').select('*'));
console.log(await supa.from('reservations').select('*'));
console.log(await supa.from('calendar_blocks').select('*'));
console.log(await supa.from('admin_users').select('*'));
```

### Status

- [ ] `booking_inquiries` — anon zwraca `data: []`
- [ ] `reservations` — anon zwraca `data: []`
- [ ] `calendar_blocks` — anon zwraca `data: []`
- [ ] `admin_users` — anon zwraca `data: []`
- [ ] `reviews` — anon zwraca tylko `status='approved'`
- [ ] `guest_photos` — anon zwraca tylko `status='approved'`
- [ ] `apartments`, `restaurants`, `attractions` — tylko opublikowane
- [ ] RPC `get_availability` jest dostępna dla anon

---

## 19.3 — Audyt dostępności

**Cel:** Strona spełnia podstawowe wymagania WCAG (Wymaganie 46).

### Narzędzia

- **axe DevTools** (Chrome extension) — automatyczny skan kontrastu i
  ARIA.
- **NVDA** (Windows) lub **VoiceOver** (macOS) — czytnik ekranu.
- **Klawiatura** — Tab, Shift+Tab, Enter, Escape, strzałki.

### Procedura — skan automatyczny

1. Zainstaluj rozszerzenie **axe DevTools** w Chrome.
2. Odpal `npm run dev` lokalnie.
3. Dla każdej z poniższych stron uruchom axe scan i zanotuj liczbę
   naruszeń poziomu A i AA:

| Strona | Naruszenia A | Naruszenia AA |
| --- | --- | --- |
| `/` | __ | __ |
| `/apartments` | __ | __ |
| `/apartments/casa-orte-uno` | __ | __ |
| `/booking` | __ | __ |
| `/restaurants` | __ | __ |
| `/restaurants/<slug>` | __ | __ |
| `/rome/itinerary` | __ | __ |
| `/admin/login` | __ | __ |
| `/admin` | __ | __ |
| `/admin/reservations` | __ | __ |

**Cel:** 0 naruszeń poziomu A i AA na każdej stronie.

### Procedura — czytnik ekranu

1. Włącz NVDA (Windows) lub VoiceOver (macOS, Cmd+F5).
2. Przejdź przez `/apartments/casa-orte-uno`, słuchaj jak czytnik
   wymawia kalendarz dostępności:

   **Oczekiwane:** Każdy dzień jest wymawiany z datą i statusem
   (np. "10 czerwca, wolny" lub "11 czerwca, zarezerwowany,
   niedostępny").

3. Przejdź przez `/booking` — czytnik powinien wymawiać każde pole
   z etykietą i wymaganiem.

### Procedura — klawiatura

1. Na każdej stronie naciskaj Tab i Shift+Tab — wszystkie linki,
   przyciski, pola formularzy są dostępne.
2. Na `/booking` wypełnij cały formularz tylko klawiaturą i wyślij
   przez Enter — musi się udać.
3. Na `/apartments/<slug>` otwórz lightbox galerii klawiszem Enter,
   zamknij Escape, przewiń strzałkami.
4. W kalendarzu publicznym fokus widoczny na każdym dniu
   (focus-visible outline italian-green).

### Procedura — kontrast

1. axe DevTools sygnalizuje każdy fail kontrastu.
2. Tokeny do weryfikacji:
   - `text-cypress` (#223126) na `bg-ivory` (#f8f4ec) — **AAA**
   - `text-italian-green` (#1f6f43) na `bg-soft-green` (#e8f1ea) — **AA**
   - `text-italian-red` (#b43a32) na `bg-flag-white` (#ffffff) — **AA**
   - `text-muted` (#5b6660) na `bg-ivory` (#f8f4ec) — **AA**

### Status

- [ ] axe scan: 0 naruszeń A na publicznych stronach
- [ ] axe scan: 0 naruszeń AA na publicznych stronach
- [ ] Czytnik ekranu wymawia statusy kalendarza
- [ ] Cały booking-form wypełnialny tylko klawiaturą
- [ ] Lightbox galerii działa klawiszami
- [ ] Każdy `<img>` ma `alt` (sprawdź View Source)
- [ ] Każde pole formularza ma `<label htmlFor>` lub `aria-label`
- [ ] Touch target kalendarza ≥ 40x40 px (CSS już to zapewnia)

---

## 19.4 — Audyt responsywności

**Cel:** Strona działa bezbłędnie na 320 — 1920 px (Wymaganie 47).

### Procedura

1. W Chrome DevTools włącz Device Toolbar (Ctrl+Shift+M).
2. Dla każdej rozdzielczości przejdź przez kluczowe strony:

| Rozdzielczość | Urządzenie | Sprawdź |
| --- | --- | --- |
| 320×568 | iPhone SE | Brak poziomego scroll, hamburger menu działa |
| 375×667 | iPhone 8 | Karty apartamentów 1-kolumnowe, kalendarz scrolluje |
| 768×1024 | iPad portrait | Karty 2-kolumnowe, dashboard admina przejrzysty |
| 1024×768 | iPad landscape | Apartment listing 2-kolumnowy |
| 1440×900 | Laptop | Wszystko czytelne, brak wymuszonych łamań |
| 1920×1080 | Desktop | Max-w-6xl działa, treść wyśrodkowana |

### Lista kontrolna

- [ ] 320 px — brak poziomego scrolla na żadnej publicznej stronie
- [ ] 320 px — hamburger menu otwiera się i zamyka
- [ ] 375 px — karty apartamentów czytelne, 1-kolumnowe
- [ ] 375 px — kalendarz dostępności scrolluje horyzontalnie i jest klikalny
- [ ] 768 px — karty apartamentów 2-kolumnowe (md breakpoint Tailwind)
- [ ] 768 px — admin sidebar widoczny obok contentu
- [ ] 1024 px — apartment_listing 2-kolumnowy z odpowiednią ilością gutter
- [ ] 1440 px — kalendarz publiczny pokazuje 3 miesiące w rzędzie
- [ ] 1920 px — treść nie rozjeżdża się na boki (max-w-6xl)
- [ ] Touch targets ≥ 40×40 px na każdym breakpoincie (kalendarz, hamburger)
- [ ] Stopka czytelna i kompletna na każdej szerokości

### Bonus — Lighthouse

```bash
# Uruchom Lighthouse na localhost:3000
# (Chrome DevTools → Lighthouse → Generate report)
```

**Oczekiwane wyniki:**
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 90

---

## Wnioski

Po wykonaniu wszystkich 4 audytów: zaznacz wszystkie kratki ✅, zapisz
datę audytu i podpis osoby weryfikującej.

**Audyt wykonał:** _______________________
**Data:** _______________________
**Wersja aplikacji:** _______________________
