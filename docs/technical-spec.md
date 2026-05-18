# Technical Spec: BELLAORTE

## 1. Cel techniczny

Specyfikacja opisuje docelowa architekture aplikacji BELLAORTE przed startem
kodowania. Produkt ma obslugiwac 2 apartamenty w Orte, publiczny kalendarz
dostepnosci, formularz rezerwacji/zapytania, przewodnik turystyczny, komentarze
i oceny gosci oraz panel admina.

MVP nie pokazuje cen i nie obsluguje platnosci.

## 2. Stack i zalozenia

- Framework: Next.js App Router.
- UI: React + TypeScript.
- Styling: Tailwind CSS.
- Dane docelowe: Supabase Postgres.
- Auth docelowo: Supabase Auth dla admina.
- Storage docelowo: Supabase Storage dla zdjec apartamentow, przewodnika i
  zdjec gosci.

Przed kodowaniem Next.js trzeba sprawdzic lokalne dokumenty w
`node_modules/next/dist/docs/`, szczegolnie routing, Server/Client Components,
Route Handlers, formularze i obrazy.

## 3. Struktura tras

Publiczne trasy MVP:

- `/` - strona glowna.
- `/apartments` - lista 2 apartamentow.
- `/apartments/[slug]` - szczegol apartamentu.
- `/booking` - pelny kalendarz i formularz wyboru dat.
- `/booking/confirmation` - potwierdzenie wyslania.
- `/guide` - hub przewodnika.
- `/restaurants` - polecane restauracje.
- `/restaurants/[slug]` - szczegol restauracji.
- `/places` - miejsca do zwiedzania.
- `/places/[slug]` - szczegol miejsca.
- `/rome` - hub RZYM.
- `/rome/restaurants` - restauracje w Rzymie.
- `/rome/places` - polecane miejsca w Rzymie.
- `/rome/itinerary` - plan zwiedzania Rzymu.
- `/rome/info` - praktyczne informacje o Rzymie.
- `/useful-info` - praktyczne informacje: samochod, pociagi, dojazdy.

Trasy admina:

- `/admin` - dashboard.
- `/admin/apartments` - zarzadzanie apartamentami.
- `/admin/calendar` - zarzadzanie kalendarzem.
- `/admin/reservations` - rezerwacje i zapytania.
- `/admin/restaurants` - restauracje.
- `/admin/places` - miejsca do zwiedzania.
- `/admin/rome` - tresci RZYM.
- `/admin/useful-info` - przydatne informacje.
- `/admin/reviews` - komentarze i oceny.
- `/admin/photos` - moderacja zdjec gosci.
- `/admin/settings` - ustawienia strony.

API/Route Handlers docelowo:

- `POST /api/booking-inquiries` - wyslanie zapytania/rezerwacji.
- `GET /api/availability` - publiczna dostepnosc terminow.
- `POST /api/reviews` - dodanie komentarza i oceny.
- `POST /api/guest-photos` - dodanie zdjecia goscia.
- `PATCH /api/admin/*` - operacje admina po wdrozeniu auth.

## 4. Warstwy aplikacji

### Public UI

Publiczne strony powinny byc domyslnie Server Components. Interaktywne elementy
takie jak kalendarz, wybor zakresu dat, formularz rezerwacji, oceny i upload
zdjec powinny byc Client Components.

### Admin UI

Panel admina powinien miec osobny layout z nawigacja boczna lub gorna. Widoki
admina moga laczyc Server Components do pobierania danych z Client Components
dla formularzy, filtrow, kalendarza i akcji moderacyjnych.

### Data Access

Docelowo logika dostepu do danych powinna byc w `src/lib/` lub odpowiedniku:

- `apartments` - pobieranie i edycja apartamentow,
- `availability` - obliczanie statusow kalendarza,
- `booking` - tworzenie zapytan i rezerwacji,
- `guide` - restauracje, miejsca, RZYM i przydatne informacje,
- `reviews` - komentarze, oceny i moderacja,
- `media` - zdjecia i storage.

## 5. Komponenty kluczowe

Publiczne:

- `SiteHeader`
- `SiteFooter`
- `HeroSection`
- `ApartmentCard`
- `ApartmentSummary`
- `AvailabilityCalendar`
- `BookingForm`
- `GuideCard`
- `RestaurantCard`
- `PlaceCard`
- `ReviewList`
- `ReviewForm`
- `GuestPhotoUploader`
- `StatusLegend`

Admin:

- `AdminLayout`
- `AdminSidebar`
- `AdminMetricCard`
- `AdminCalendar`
- `ReservationTable`
- `ApartmentEditor`
- `GuidePostEditor`
- `RestaurantEditor`
- `PlaceEditor`
- `ReviewModerationQueue`
- `PhotoModerationQueue`

Zasady:

- Kalendarz, formularze i uploady sa interaktywne, wiec powinny byc Client
  Components.
- Widoki list i stron szczegolu powinny preferowac Server Components, jesli nie
  wymagaja natychmiastowej interakcji.
- Publiczny kalendarz nie moze pokazywac danych osobowych gosci.

## 6. Kalendarz i rezerwacje

Statusy publiczne:

- `available` - wolne.
- `pending` - oczekuje na decyzje admina.
- `reserved` - zarezerwowane.
- `blocked` - zablokowane przez admina.

Zrodla statusu:

- `reservations` z aktywnym statusem zajmuja zakres dat.
- `booking_inquiries` ze statusem `pending` moga oznaczac zakres jako oczekujacy.
- `calendar_blocks` oznaczaja zakres jako zablokowany.

Regula MVP:

- Domyslnie wyslane zapytanie tworzy `booking_inquiry` ze statusem `pending`.
- Czy `pending` blokuje wybor terminu dla kolejnych gosci pozostaje decyzja do
  potwierdzenia. Do pierwszej implementacji rekomendacja: pokazac jako
  `pending`, ale nie traktowac jak finalnie `reserved`.

Zakres dat:

- Data przyjazdu wlacznie.
- Data wyjazdu jako koniec pobytu, zwykle bez zajecia nocy po wyjezdzie.
- Walidacja musi odrzucic zakres pusty, date wyjazdu przed przyjazdem i zakres
  nachodzacy na `reserved` albo `blocked`.

## 7. Komentarze, oceny i zdjecia gosci

Miejsca, gdzie goscie moga dodac tresc:

- restauracje,
- miejsca do zwiedzania,
- wybrane podstrony RZYM, jesli admin wlaczy komentarze.

Zasady:

- Ocena 1-5.
- Komentarz wymaga imienia/podpisu i tresci.
- Zdjecie goscia jest opcjonalne.
- Domyslny status tresci goscia: `pending`.
- Publicznie widoczne sa tylko tresci `approved`.
- Admin moze zatwierdzic, odrzucic, ukryc lub usunac.

## 8. Zdjecia i media

Na starcie:

- mozna uzyc losowych zdjec Orte, Wloch, Rzymu i okolicy,
- nie wolno uzywac losowych zdjec wnetrz jako finalnych zdjec apartamentow,
- placeholdery musza byc latwe do wymiany w panelu admina pozniej.

Docelowo storage:

- bucket `site-media` dla zdjec strony i przewodnika,
- bucket `guest-photos` dla zdjec gosci,
- osobne metadane w tabeli `media_assets`.

## 9. Bezpieczenstwo i prywatnosc

- Dane kontaktowe gosci sa prywatne i widoczne tylko w panelu admina.
- Publiczny kalendarz pokazuje tylko status dat.
- Tresci od gosci wymagaja moderacji przed publikacja.
- Upload zdjec powinien ograniczac format i rozmiar.
- Panel admina musi wymagac logowania.
- Operacje admina musza byc zabezpieczone po stronie serwera, nie tylko UI.

## 10. Stany bledow

Publiczne:

- brak dostepnych terminow,
- zakres dat nachodzi na rezerwacje,
- formularz ma brakujace pola,
- wyslanie zapytania sie nie powiodlo,
- komentarz lub zdjecie czeka na moderacje.

Admin:

- brak uprawnien,
- konflikt rezerwacji,
- blad zapisu tresci,
- blad uploadu zdjecia,
- probowana publikacja bez wymaganych pol.

## 11. Dane demo przed Supabase

Pierwsza implementacja moze uzyc lokalnych danych demo:

- 2 apartamenty,
- kilka rezerwacji i blokad,
- kilka restauracji,
- kilka miejsc,
- wpisy RZYM,
- przydatne informacje,
- przykladowe komentarze zatwierdzone i oczekujace.

Dane demo powinny miec taki sam ksztalt jak przyszly model Supabase, zeby
migracja byla prosta.

## 12. Kryteria techniczne MVP

- Strony publiczne renderuja sie bez bledow.
- Sa 2 apartamenty i brak cen.
- Kalendarz pokazuje statusy terminow.
- Formularz odrzuca niepoprawne zakresy dat.
- Panel admina ma widoki zgodne z roadmapa, nawet jesli na start dziala na
  danych demo.
- Komentarze, oceny i zdjecia maja przeplyw moderacji.
- Publicznie nie widac danych osobowych rezerwacji.
