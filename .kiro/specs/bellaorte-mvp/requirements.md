# Requirements Document

## Introduction

BELLAORTE MVP to publiczna strona, system rezerwacji oraz interaktywny przewodnik turystyczny dla 2 apartamentów w Orte we Włoszech (01028 Orte, Prowincja Viterbo). Aplikacja ma trzy główne pętle: (1) gość publiczny wybiera apartament, sprawdza kalendarz dostępności i wysyła zapytanie o rezerwację bez płatności i bez widocznych cen, (2) gość interaktywny dodaje komentarze, oceny i zdjęcia do restauracji oraz miejsc, (3) admin/właściciel zarządza wszystkimi treściami, kalendarzem, rezerwacjami i moderacją w panelu administracyjnym.

MVP nie obsługuje płatności online, nie pokazuje cen w UI, nie integruje się z Airbnb/Booking i nie udostępnia kont gości. Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (Postgres + Auth + Storage). Język interfejsu: polski. Hosting docelowy: Vercel + Supabase.

Niniejszy dokument definiuje wymagania funkcjonalne i niefunkcjonalne dla wszystkich ról użytkowników oraz wszystkich obszarów funkcjonalnych: strona główna, apartamenty, kalendarz, rezerwacje, przewodnik (restauracje, miejsca, Rzym, przydatne informacje), moderacja treści gości, panel administracyjny, media, bezpieczeństwo, wydajność, dostępność, SEO, responsywność i internacjonalizacja.

## Glossary

- **Public_Site**: Publiczna część aplikacji BELLAORTE dostępna dla niezalogowanych gości pod ścieżkami `/`, `/apartments`, `/booking`, `/guide`, `/restaurants`, `/places`, `/rome`, `/useful-info`.
- **Admin_Panel**: Część aplikacji dostępna pod `/admin/*`, wymagająca uwierzytelnienia jako Admin_User.
- **Public_Guest**: Anonimowy użytkownik przeglądający Public_Site w celu znalezienia apartamentu i sprawdzenia dostępności.
- **Interactive_Guest**: Anonimowy użytkownik dodający komentarze, oceny lub zdjęcia do restauracji, miejsc lub wpisów przewodnika.
- **Admin_User**: Zalogowany użytkownik panelu administracyjnego z rolą `owner`, `admin` lub `editor`.
- **Apartment**: Jeden z 2 apartamentów BELLAORTE; rekord w tabeli `apartments` z polami: `id`, `slug`, `name`, `shortDescription`, `description`, `locationLabel`, `maxGuests`, `bedrooms`, `bathrooms`, `amenities`, `houseRules`, `isPublished`, `sortOrder`.
- **Booking_Inquiry**: Zapytanie o rezerwację wysłane przez Public_Guest; rekord w tabeli `booking_inquiries` ze statusem `new`, `pending`, `inReview`, `confirmed`, `declined` lub `cancelled`.
- **Reservation**: Potwierdzona rezerwacja utworzona przez Admin_User na podstawie Booking_Inquiry; rekord w tabeli `reservations` ze statusem `confirmed`, `cancelled` lub `completed`.
- **Calendar_Block**: Blokada terminu utworzona przez Admin_User bez danych gościa; rekord w tabeli `calendar_blocks` ze statusem `blocked`, `maintenance` lub `privateStay`.
- **Calendar_Status**: Publiczny status dnia w kalendarzu; jedna z czterech wartości: `available`, `pending`, `reserved`, `blocked`.
- **Availability_Calendar**: Komponent UI prezentujący Calendar_Status dni dla wybranego Apartamentu w widoku miesięcznym.
- **Booking_Form**: Formularz wysyłania Booking_Inquiry pod ścieżką `/booking` z polami: apartament, data przyjazdu, data wyjazdu, liczba dorosłych, liczba dzieci, imię i nazwisko, email, telefon (opcjonalnie), wiadomość (opcjonalnie), zgoda na kontakt.
- **Restaurant**: Polecana restauracja zarządzana przez Admin_User; rekord w tabeli `restaurants`.
- **Attraction**: Miejsce do zwiedzania w Orte, okolicy lub Rzymie; rekord w tabeli `attractions`.
- **Guide_Post**: Wpis przewodnikowy w sekcjach `guide`, `rome`, `romeItinerary`, `romeInfo` lub `usefulInfo`; rekord w tabeli `guide_posts`.
- **Travel_Info**: Praktyczna informacja transportowa (wynajem samochodu, dojazd do Rzymu, pociągi, kierunki podróży) udostępniana pod ścieżką `/useful-info`.
- **Review**: Komentarz i ocena (1-5) gościa przypięte do Restaurant, Attraction lub Guide_Post; rekord w tabeli `reviews`.
- **Guest_Photo**: Zdjęcie dodane przez Interactive_Guest powiązane z Review lub bezpośrednio z Restaurant/Attraction; rekord w tabeli `guest_photos`.
- **Moderation_Status**: Status moderacji treści gościa; jedna z wartości: `pending`, `approved`, `rejected`, `hidden`.
- **Media_Asset**: Zdjęcie lub plik mediów; rekord w tabeli `media_assets` zawierający bucket Supabase Storage, ścieżkę, alt text i typ.
- **Site_Media_Bucket**: Bucket Supabase Storage `site-media` przeznaczony dla zdjęć strony, apartamentów i przewodnika.
- **Guest_Media_Bucket**: Bucket Supabase Storage `guest-photos` przeznaczony dla zdjęć dodawanych przez Interactive_Guest.
- **Site_Settings**: Globalne ustawienia strony przechowywane w tabeli `site_settings`: nazwa strony, lokalizacja, kontakt, język domyślny, języki obsługiwane, tryb rezerwacji.
- **RLS**: Row Level Security w Supabase Postgres ograniczająca dostęp do danych na poziomie wierszy.
- **Date_Range**: Para dat (`checkInDate`, `checkOutDate`), gdzie `checkInDate` to dzień przyjazdu włącznie, a `checkOutDate` to dzień wyjazdu (noc po `checkOutDate` nie jest zajmowana).
- **Italian_Flag_Palette**: Paleta kolorów oparta na fladze Włoch w wersji premium: `italianGreen` (#1F6F43), `flagWhite` (#FFFFFF), `ivory` (#F8F4EC), `italianRed` (#B43A32), `terracotta` (#B85C38), `cypress` (#223126).

## Requirements

### Requirement 1: Strona główna BELLAORTE

**User Story:** Jako Public_Guest, chcę zobaczyć stronę główną BELLAORTE z marką, lokalizacją Orte, kaflami 2 apartamentów i wejściami do przewodnika, aby szybko zrozumieć ofertę i przejść do sprawdzenia dostępności lub planowania pobytu.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/`, THE Public_Site SHALL wyrenderować nazwę marki "BELLAORTE" w sekcji hero.
2. WHEN Public_Guest otwiera ścieżkę `/`, THE Public_Site SHALL wyświetlić etykietę lokalizacji "01028 Orte, Prowincja Viterbo, Włochy" w sekcji hero.
3. WHEN Public_Guest otwiera ścieżkę `/`, THE Public_Site SHALL wyświetlić dokładnie 2 kafle Apartamentów odpowiadające rekordom w tabeli `apartments` z `isPublished = true`, posortowane po polu `sortOrder` rosnąco.
4. WHEN Public_Guest otwiera ścieżkę `/`, THE Public_Site SHALL wyświetlić CTA "Sprawdź dostępność" prowadzące do ścieżki `/booking`.
5. WHEN Public_Guest otwiera ścieżkę `/`, THE Public_Site SHALL wyświetlić linki nawigacyjne do `/restaurants`, `/places`, `/rome` oraz `/useful-info` w sekcji "Przewodnik".
6. THE Public_Site SHALL renderować stronę główną w trybie Server-Side Rendering w Next.js App Router.
7. THE Public_Site SHALL NOT wyświetlać żadnej ceny ani symbolu waluty na stronie głównej.
8. THE Public_Site SHALL NOT wyświetlać zdjęć udających wnętrza apartamentów; zdjęcia hero i kafli SHALL być oznaczone w bazie jako `isPlaceholder = true` do czasu zastąpienia realnymi materiałami.

### Requirement 2: Lista apartamentów

**User Story:** Jako Public_Guest, chcę zobaczyć listę 2 apartamentów BELLAORTE z podstawowymi informacjami i statusem najbliższej dostępności, aby porównać oferty i wybrać apartament do szczegółowego obejrzenia.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/apartments`, THE Public_Site SHALL wyświetlić listę wszystkich Apartamentów z `isPublished = true`, posortowanych po `sortOrder` rosnąco.
2. THE Public_Site SHALL renderować dla każdego Apartamentu na liście: nazwę, krótki opis (`shortDescription`), liczbę gości (`maxGuests`), liczbę sypialni (`bedrooms`), liczbę łazienek (`bathrooms`) oraz zdjęcie hero.
3. THE Public_Site SHALL renderować dla każdego Apartamentu na liście link do ścieżki `/apartments/{slug}` z wartością `slug` z rekordu Apartamentu.
4. THE Public_Site SHALL renderować dla każdego Apartamentu na liście CTA "Sprawdź termin" prowadzące do ścieżki `/booking?apartment={slug}`.
5. WHERE liczba opublikowanych Apartamentów wynosi mniej niż 2, THE Public_Site SHALL wyświetlić komunikat informacyjny "Apartamenty są w trakcie aktualizacji" zamiast brakujących kafli.
6. THE Public_Site SHALL NOT wyświetlać cen, kosztów ani symboli walut na liście apartamentów.

### Requirement 3: Strona szczegółów apartamentu

**User Story:** Jako Public_Guest, chcę zobaczyć szczegółową stronę pojedynczego apartamentu z opisem, galerią, udogodnieniami, zasadami pobytu i kalendarzem, aby ocenić ofertę i sprawdzić dostępność wybranego terminu.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/apartments/{slug}` ze slug istniejącego, opublikowanego Apartamentu, THE Public_Site SHALL wyświetlić jego nazwę, pełny opis (`description`), `locationLabel`, `maxGuests`, `bedrooms` i `bathrooms`.
2. THE Public_Site SHALL wyświetlić listę udogodnień Apartamentu pobraną z relacji `apartment_amenities` -> `amenities` z `isPublished = true`.
3. THE Public_Site SHALL wyświetlić zasady pobytu (`houseRules`) Apartamentu jako sformatowany tekst.
4. THE Public_Site SHALL wyświetlić galerię zdjęć Apartamentu pobraną z `apartment_photos` posortowaną po `sortOrder` rosnąco.
5. THE Public_Site SHALL wyświetlić Availability_Calendar dla wybranego Apartamentu na stronie szczegółów.
6. THE Public_Site SHALL wyświetlić CTA "Sprawdź dostępność" lub "Wyślij zapytanie" prowadzące do `/booking?apartment={slug}`.
7. IF Public_Guest otwiera ścieżkę `/apartments/{slug}` ze slug nieistniejącym lub należącym do Apartamentu z `isPublished = false`, THEN THE Public_Site SHALL zwrócić odpowiedź HTTP 404 i wyświetlić stronę błędu z linkiem powrotu do `/apartments`.
8. THE Public_Site SHALL NOT wyświetlać cen, kosztów ani symboli walut na stronie szczegółów apartamentu.
9. THE Public_Site SHALL renderować stronę szczegółów apartamentu w trybie Server-Side Rendering z generacją statyczną dla istniejących slug.

### Requirement 4: Publiczny kalendarz dostępności

**User Story:** Jako Public_Guest, chcę zobaczyć kalendarz dostępności dla wybranego apartamentu w widoku miesięcznym z czterema statusami, aby sprawdzić, które terminy są wolne, oczekujące, zarezerwowane lub zablokowane.

#### Acceptance Criteria

1. THE Availability_Calendar SHALL wyświetlać widok miesięczny obejmujący wszystkie dni wybranego miesiąca dla wybranego Apartamentu.
2. THE Availability_Calendar SHALL przypisywać każdemu dniu jeden z czterech statusów: `available`, `pending`, `reserved`, `blocked`.
3. THE Availability_Calendar SHALL oznaczać dzień jako `reserved` jeśli istnieje Reservation dla tego Apartamentu ze statusem `confirmed` lub `completed`, której Date_Range obejmuje ten dzień.
4. THE Availability_Calendar SHALL oznaczać dzień jako `blocked` jeśli istnieje Calendar_Block dla tego Apartamentu, którego zakres dat obejmuje ten dzień.
5. THE Availability_Calendar SHALL oznaczać dzień jako `pending` jeśli istnieje Booking_Inquiry dla tego Apartamentu ze statusem `pending` lub `inReview`, której Date_Range obejmuje ten dzień, i nie jest już oznaczony jako `reserved` ani `blocked`.
6. THE Availability_Calendar SHALL oznaczać pozostałe dni jako `available`.
7. THE Availability_Calendar SHALL wyświetlać legendę z czterema statusami i opisami w języku polskim: "Wolne", "Oczekuje", "Zarezerwowane", "Zablokowane".
8. THE Availability_Calendar SHALL pozwalać Public_Guest na nawigację do następnego i poprzedniego miesiąca za pomocą przycisków sterujących.
9. THE Availability_Calendar SHALL renderować statusy dni w sposób odróżnialny zarówno kolorem, jak i ikoną/teksturą lub etykietą tekstową dla użytkowników z zaburzeniami widzenia barw.
10. THE Availability_Calendar SHALL NOT wyświetlać żadnych danych osobowych Gościa (imię, email, telefon, wiadomość) ani identyfikatorów Booking_Inquiry/Reservation.
11. WHEN Public_Guest klika dzień ze statusem `available`, THE Availability_Calendar SHALL pozwolić rozpocząć wybór Date_Range.
12. IF Public_Guest próbuje wybrać dzień ze statusem `reserved` lub `blocked` jako część Date_Range, THEN THE Availability_Calendar SHALL odrzucić ten wybór i wyświetlić komunikat "Termin jest niedostępny".
13. WHEN Public_Guest wybierze pełny Date_Range w Availability_Calendar, THE Availability_Calendar SHALL przekazać `apartmentSlug`, `checkInDate` i `checkOutDate` do Booking_Form.

### Requirement 5: Endpoint dostępności apartamentu

**User Story:** Jako frontend Public_Site, chcę pobrać statusy dni dla wybranego apartamentu i zakresu miesiąca w jednym żądaniu, aby Availability_Calendar mógł wyrenderować stan terminów bez ujawniania danych gości.

#### Acceptance Criteria

1. WHEN klient wysyła `GET /api/availability?apartmentSlug={slug}&month={YYYY-MM}`, THE Public_Site SHALL zwrócić listę dni miesiąca z polem `date` i polem `status` o jednej z wartości: `available`, `pending`, `reserved`, `blocked`.
2. THE Public_Site SHALL obliczać status każdego dnia zgodnie z regułami zdefiniowanymi w wymaganiu 4 (Reservation, Calendar_Block, Booking_Inquiry pending/inReview).
3. THE Public_Site SHALL NOT zwracać w odpowiedzi pól z danymi osobowymi gości (`displayName`, `email`, `phone`), wiadomościami (`message`), notatkami admina (`adminNotes`), ani identyfikatorami rekordów źródłowych.
4. IF parametr `apartmentSlug` jest pusty lub nie odpowiada żadnemu Apartamentowi z `isPublished = true`, THEN THE Public_Site SHALL zwrócić odpowiedź HTTP 404 z polem `error` zawierającym opis błędu.
5. IF parametr `month` ma format inny niż `YYYY-MM` lub miesiąc poza zakresem 01-12, THEN THE Public_Site SHALL zwrócić odpowiedź HTTP 400 z polem `error` zawierającym opis błędu.
6. THE Public_Site SHALL ustawiać nagłówek `Cache-Control` z dyrektywą `public, max-age=60` dla odpowiedzi sukcesu, aby umożliwić krótkie buforowanie publicznych statusów.

### Requirement 6: Formularz rezerwacji/zapytania

**User Story:** Jako Public_Guest, chcę wysłać zapytanie o rezerwację wybranego apartamentu i terminu poprzez formularz, aby admin mógł rozpatrzyć moje zapytanie i potwierdzić rezerwację.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/booking`, THE Public_Site SHALL wyrenderować Booking_Form z polami: wybór apartamentu, data przyjazdu, data wyjazdu, liczba dorosłych, liczba dzieci, imię i nazwisko, email, telefon (opcjonalnie), wiadomość (opcjonalnie), zgoda na kontakt.
2. WHEN ścieżka `/booking` zawiera parametry `apartment={slug}`, `checkIn={YYYY-MM-DD}` i/lub `checkOut={YYYY-MM-DD}`, THE Booking_Form SHALL wstępnie wypełnić odpowiednie pola.
3. THE Booking_Form SHALL wyświetlać pełny Availability_Calendar dla aktualnie wybranego Apartamentu, aby Public_Guest mógł zmienić wybór dat bez przeładowania strony.
4. THE Booking_Form SHALL wymagać wartości w polach: apartament, data przyjazdu, data wyjazdu, liczba dorosłych (>= 1), imię i nazwisko, email, zgoda na kontakt.
5. THE Booking_Form SHALL walidować email zgodnie z wzorcem RFC 5321 (zawiera `@` i domenę z co najmniej jednym znakiem przed i po kropce).
6. THE Booking_Form SHALL walidować, że `checkOutDate` jest datą późniejszą niż `checkInDate`.
7. THE Booking_Form SHALL walidować, że Date_Range nie nakłada się na żaden dzień ze statusem `reserved` ani `blocked` dla wybranego Apartamentu.
8. THE Booking_Form SHALL walidować, że `checkInDate` nie jest wcześniejsza niż dzisiejsza data.
9. THE Booking_Form SHALL walidować, że suma `adultCount + childCount` nie przekracza `maxGuests` wybranego Apartamentu.
10. IF którekolwiek pole obowiązkowe jest puste lub niepoprawne, THEN THE Booking_Form SHALL wyświetlić komunikat błędu obok danego pola w języku polskim oraz uniemożliwić wysłanie formularza.
11. WHEN Public_Guest wysyła poprawnie wypełniony Booking_Form, THE Public_Site SHALL utworzyć rekord w tabeli `guests` (lub powiązać z istniejącym po `email`) i utworzyć rekord w tabeli `booking_inquiries` ze statusem `new`.
12. WHEN Booking_Inquiry zostanie utworzona, THE Public_Site SHALL przekierować Public_Guest do ścieżki `/booking/confirmation` z parametrem identyfikującym zapytanie.
13. THE Booking_Form SHALL NOT wyświetlać cen, kosztów, symboli waluty ani opcji płatności online.
14. WHEN Public_Guest zaznacza pole "zgoda na kontakt", THE Booking_Form SHALL zarejestrować znacznik czasu zgody w polu `consentAt` przesyłanym razem z zapytaniem.
15. WHILE Booking_Form jest w trakcie wysyłania, THE Booking_Form SHALL wyświetlać wskaźnik ładowania i blokować ponowne kliknięcie przycisku wysyłki.

### Requirement 7: Endpoint tworzenia zapytań rezerwacyjnych

**User Story:** Jako Public_Site, chcę przesłać dane Booking_Form do serwera, aby utrwalić Booking_Inquiry i ochronić integralność danych przed nadużyciami.

#### Acceptance Criteria

1. WHEN klient wysyła `POST /api/booking-inquiries` z poprawnym ciałem JSON zawierającym pola wymagane przez Booking_Form, THE Public_Site SHALL utworzyć rekord Booking_Inquiry ze statusem `new` i zwrócić odpowiedź HTTP 201 z polem `inquiryId`.
2. THE Public_Site SHALL waliduje ciało żądania serwerowo, niezależnie od walidacji w Booking_Form, i SHALL stosować te same reguły walidacji co Booking_Form.
3. IF ciało żądania jest niepoprawne, THEN THE Public_Site SHALL zwrócić odpowiedź HTTP 400 z polem `errors` zawierającym mapę nazw pól na komunikaty błędów.
4. IF Date_Range w ciele żądania nakłada się na zakres ze statusem `reserved` lub `blocked`, THEN THE Public_Site SHALL zwrócić odpowiedź HTTP 409 z polem `error` o wartości "Wybrany termin jest niedostępny".
5. THE Public_Site SHALL stosować ograniczenie częstotliwości (rate limit) na poziomie 5 żądań na adres IP w ciągu 1 godziny dla tego endpointu.
6. IF rate limit zostanie przekroczony, THEN THE Public_Site SHALL zwrócić odpowiedź HTTP 429 z polem `error` o wartości "Zbyt wiele zapytań. Spróbuj ponownie później".
7. THE Public_Site SHALL stosować ochronę CSRF dla endpointu `POST /api/booking-inquiries` poprzez weryfikację nagłówka `Origin` z dozwoloną listą domen aplikacji.
8. THE Public_Site SHALL sanitizować pole `message` w ciele żądania, usuwając tagi HTML przed zapisem do bazy danych.
9. WHEN Booking_Inquiry zostaje utworzona, THE Public_Site SHALL zarejestrować w logach serwera identyfikator zapytania i znacznik czasu, ale NOT SHALL logować pełnych danych osobowych gościa.

### Requirement 8: Strona potwierdzenia rezerwacji

**User Story:** Jako Public_Guest, po wysłaniu Booking_Form chcę zobaczyć stronę potwierdzającą wysłanie zapytania z informacją o dalszych krokach, aby mieć pewność, że moja prośba została odebrana.

#### Acceptance Criteria

1. WHEN Public_Guest jest przekierowany na ścieżkę `/booking/confirmation`, THE Public_Site SHALL wyświetlić tytuł "Dziękujemy za zapytanie".
2. THE Public_Site SHALL wyświetlić informację, że zapytanie zostało odebrane i czeka na potwierdzenie przez właściciela.
3. THE Public_Site SHALL wyświetlić informację o przewidywanym czasie reakcji właściciela jako "do 48 godzin".
4. THE Public_Site SHALL wyświetlić podsumowanie zapytania zawierające: nazwę wybranego Apartamentu, `checkInDate`, `checkOutDate`, liczbę dorosłych i dzieci.
5. THE Public_Site SHALL wyświetlić linki nawigacyjne do `/`, `/guide`, `/restaurants`, `/places`.
6. THE Public_Site SHALL NOT wyświetlać emaila, telefonu ani wiadomości Public_Guest na stronie potwierdzenia.

### Requirement 9: Hub przewodnika

**User Story:** Jako Public_Guest, chcę zobaczyć stronę hub przewodnika z linkami do restauracji, miejsc, sekcji Rzym i przydatnych informacji, aby zaplanować pobyt w Orte i okolicy.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/guide`, THE Public_Site SHALL wyświetlić cztery sekcje z kafelkami prowadzącymi do `/restaurants`, `/places`, `/rome` i `/useful-info`.
2. THE Public_Site SHALL wyświetlić dla każdego kafla nagłówek, krótki opis i zdjęcie pobrane z Site_Media_Bucket.
3. THE Public_Site SHALL renderować stronę hub przewodnika w trybie Server-Side Rendering.
4. THE Public_Site SHALL wyświetlić listę najnowszych Guide_Post z `isPublished = true` posortowanych po `publishedAt` malejąco, ograniczoną do 6 wpisów.

### Requirement 10: Lista restauracji

**User Story:** Jako Public_Guest, chcę zobaczyć listę polecanych restauracji w okolicy z podstawowymi informacjami i średnią oceną, aby wybrać miejsce na obiad lub kolację.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/restaurants`, THE Public_Site SHALL wyświetlić listę wszystkich Restaurantów z `isPublished = true`, posortowanych po `sortOrder` rosnąco.
2. THE Public_Site SHALL wyświetlić dla każdego Restaurantu na liście: nazwę, krótki opis, `locationLabel`, kategorię kuchni (`cuisineType`), zdjęcie hero oraz średnią ocenę liczona z Reviews ze statusem `approved`.
3. THE Public_Site SHALL wyświetlić dla każdego Restaurantu liczbę zatwierdzonych Reviews.
4. THE Public_Site SHALL renderować dla każdego Restaurantu link do ścieżki `/restaurants/{slug}`.
5. WHERE Public_Guest stosuje filtr po polu `area` lub `cuisineType`, THE Public_Site SHALL ograniczyć listę do Restaurantów spełniających wybrane filtry.

### Requirement 11: Strona szczegółów restauracji

**User Story:** Jako Public_Guest, chcę zobaczyć szczegółową stronę restauracji z opisem, lokalizacją, mapą, zdjęciami i opiniami innych gości, aby ocenić, czy odwiedzić to miejsce.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/restaurants/{slug}` ze slug istniejącego Restaurantu z `isPublished = true`, THE Public_Site SHALL wyświetlić jego nazwę, pełny opis, `address`, `cuisineType` i `area`.
2. THE Public_Site SHALL wyświetlić link do mapy zewnętrznej z polem `mapUrl` Restaurantu, otwierający się w nowej karcie.
3. THE Public_Site SHALL wyświetlić zdjęcie hero z pola `heroMediaAssetId` oraz galerię zatwierdzonych Guest_Photos z `Moderation_Status = approved`.
4. THE Public_Site SHALL wyświetlić listę Reviews ze statusem `approved` posortowanych po `createdAt` malejąco, w tym `authorName`, `rating`, `comment` i datę utworzenia.
5. THE Public_Site SHALL wyświetlić średnią ocenę i liczbę zatwierdzonych Reviews na stronie szczegółów.
6. THE Public_Site SHALL wyświetlić formularz dodania Review wraz z opcjonalnym uploadem Guest_Photo.
7. IF Public_Guest otwiera ścieżkę `/restaurants/{slug}` ze slug nieistniejącym lub `isPublished = false`, THEN THE Public_Site SHALL zwrócić odpowiedź HTTP 404.

### Requirement 12: Lista miejsc do zwiedzania

**User Story:** Jako Public_Guest, chcę zobaczyć listę atrakcji w Orte i okolicy z opisami i ocenami, aby zaplanować wycieczki w trakcie pobytu.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/places`, THE Public_Site SHALL wyświetlić listę wszystkich Attractions z `isPublished = true` i polem `area` należącym do zbioru {`orte`, `surroundings`, `umbria`, `tuscany`, `viterbo`}, posortowanych po `sortOrder` rosnąco.
2. THE Public_Site SHALL wyświetlić dla każdej Attraction: nazwę, krótki opis, `locationLabel`, kategorię (`category`), szacowany czas zwiedzania (`estimatedVisitTime`), wskazówkę dojazdu (`travelHint`) i zdjęcie hero.
3. THE Public_Site SHALL renderować dla każdej Attraction link do ścieżki `/places/{slug}`.
4. THE Public_Site SHALL wyświetlić średnią ocenę i liczbę zatwierdzonych Reviews dla każdej Attraction na liście.

### Requirement 13: Strona szczegółów miejsca

**User Story:** Jako Public_Guest, chcę zobaczyć szczegółową stronę atrakcji z opisem, mapą, wskazówkami dojazdu i opiniami gości, aby zdecydować, czy ją odwiedzić.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/places/{slug}` ze slug istniejącej Attraction z `isPublished = true`, THE Public_Site SHALL wyświetlić jej nazwę, pełny opis, `address`, kategorię, `estimatedVisitTime` i `travelHint`.
2. THE Public_Site SHALL wyświetlić link do mapy z pola `mapUrl` Attraction.
3. THE Public_Site SHALL wyświetlić zdjęcie hero oraz galerię zatwierdzonych Guest_Photos.
4. THE Public_Site SHALL wyświetlić listę zatwierdzonych Reviews oraz średnią ocenę i liczbę Reviews.
5. THE Public_Site SHALL wyświetlić formularz dodania Review z opcjonalnym uploadem Guest_Photo.
6. IF Public_Guest otwiera ścieżkę `/places/{slug}` ze slug nieistniejącym lub `isPublished = false`, THEN THE Public_Site SHALL zwrócić odpowiedź HTTP 404.

### Requirement 14: Sekcja Rzym

**User Story:** Jako Public_Guest, chcę zobaczyć dedykowaną sekcję Rzym z restauracjami, miejscami, planem zwiedzania i praktycznymi informacjami, aby przygotować wycieczkę do Rzymu z Orte.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/rome`, THE Public_Site SHALL wyświetlić hub sekcji Rzym z czterema kafelkami prowadzącymi do `/rome/restaurants`, `/rome/places`, `/rome/itinerary` i `/rome/info`.
2. WHEN Public_Guest otwiera ścieżkę `/rome/restaurants`, THE Public_Site SHALL wyświetlić listę Restaurantów z polem `area = "rome"` i `isPublished = true`.
3. WHEN Public_Guest otwiera ścieżkę `/rome/places`, THE Public_Site SHALL wyświetlić listę Attractions z polem `area = "rome"` i `isPublished = true`.
4. WHEN Public_Guest otwiera ścieżkę `/rome/itinerary`, THE Public_Site SHALL wyświetlić Guide_Posts z polem `section = "romeItinerary"` i `isPublished = true`, posortowane po `publishedAt` malejąco.
5. WHEN Public_Guest otwiera ścieżkę `/rome/info`, THE Public_Site SHALL wyświetlić Guide_Posts z polem `section = "romeInfo"` i `isPublished = true`.
6. THE Public_Site SHALL umożliwić Interactive_Guest dodawanie Reviews i Guest_Photos do Restaurantów i Attractions w obszarze `area = "rome"` na zasadach identycznych jak dla obszaru `orte`.

### Requirement 15: Przydatne informacje

**User Story:** Jako Public_Guest, chcę zobaczyć stronę z przydatnymi informacjami o transporcie (wynajem samochodu, dojazd do Rzymu, pociągi, kierunki podróży), aby zaplanować logistykę pobytu.

#### Acceptance Criteria

1. WHEN Public_Guest otwiera ścieżkę `/useful-info`, THE Public_Site SHALL wyświetlić listę Guide_Posts z polem `section = "usefulInfo"` i `isPublished = true`, posortowanych po `sortOrder` rosnąco.
2. THE Public_Site SHALL pokrywać co najmniej następujące tematy w sekcji `usefulInfo`: wynajem samochodu, dojazd do Rzymu, podróż pociągami, możliwe kierunki podróży z Orte.
3. THE Public_Site SHALL wyświetlać dla każdego Guide_Post: tytuł, podsumowanie, treść body w formacie umożliwiającym formatowanie tekstu (nagłówki, listy, linki) oraz zdjęcie hero.
4. THE Public_Site SHALL renderować strony Guide_Post pod ścieżkami `/useful-info/{slug}` z `isPublished = true`.

### Requirement 16: Dodawanie komentarzy i ocen przez gości

**User Story:** Jako Interactive_Guest, chcę dodać komentarz i ocenę 1-5 do restauracji, miejsca lub wpisu Rzym, aby podzielić się doświadczeniem z innymi gośćmi.

#### Acceptance Criteria

1. THE Public_Site SHALL wyświetlać formularz dodania Review na stronach szczegółów Restaurantów, Attractions oraz wybranych Guide_Posts gdzie `allowReviews = true`.
2. THE formularz Review SHALL zawierać pola: imię/podpis (`authorName`), email (opcjonalnie, niewidoczny publicznie), ocena (1-5), komentarz (`comment`), opcjonalny upload Guest_Photo, zgoda na publikację.
3. THE formularz Review SHALL wymagać wartości w polach: `authorName`, `rating`, `comment`, zgoda na publikację.
4. THE formularz Review SHALL walidować, że `rating` jest liczbą całkowitą z zakresu 1-5.
5. THE formularz Review SHALL walidować, że `comment` zawiera od 5 do 2000 znaków.
6. WHEN Interactive_Guest wysyła poprawnie wypełniony formularz Review, THE Public_Site SHALL utworzyć rekord Review z `Moderation_Status = pending` i powiązać z odpowiednim `targetType` (`restaurant`, `attraction` lub `guidePost`) i `targetId`.
7. WHEN Review zostanie utworzona z dołączonym zdjęciem, THE Public_Site SHALL utworzyć rekord Guest_Photo z `Moderation_Status = pending`, powiązać z Review i przesłać plik do Guest_Media_Bucket.
8. WHEN Review zostanie utworzona, THE Public_Site SHALL wyświetlić Interactive_Guest komunikat "Dziękujemy. Twoja opinia czeka na zatwierdzenie".
9. THE Public_Site SHALL stosować ograniczenie częstotliwości na poziomie 10 Reviews na adres IP w ciągu 1 godziny.
10. THE Public_Site SHALL sanitizować pole `comment` przed zapisem, usuwając tagi HTML i skrypty.
11. THE Public_Site SHALL NOT publikować Reviews z `Moderation_Status` innym niż `approved`.
12. THE Public_Site SHALL NOT wyświetlać emaila autora Review w żadnym widoku publicznym.

### Requirement 17: Dodawanie zdjęć przez gości

**User Story:** Jako Interactive_Guest, chcę dołączyć zdjęcie do mojej opinii o restauracji lub miejscu, aby pokazać innym, jak wyglądało moje doświadczenie.

#### Acceptance Criteria

1. THE Public_Site SHALL umożliwiać upload pojedynczego pliku obrazu razem z formularzem Review.
2. THE Public_Site SHALL akceptować pliki w formatach: JPEG, PNG, WebP.
3. THE Public_Site SHALL odrzucać pliki o rozmiarze przekraczającym 8 MB.
4. THE Public_Site SHALL odrzucać pliki, których typ MIME nie należy do dozwolonych formatów lub których zawartość nie jest poprawnym obrazem.
5. WHEN plik zostanie przesłany, THE Public_Site SHALL zapisać go w Guest_Media_Bucket pod ścieżką `{targetType}/{targetId}/{uuid}.{ext}` i utworzyć rekord Media_Asset oraz Guest_Photo.
6. THE Guest_Photo SHALL być utworzona z `Moderation_Status = pending`.
7. THE Public_Site SHALL NOT wyświetlać Guest_Photo w widokach publicznych dopóki `Moderation_Status` nie zostanie ustawione na `approved`.
8. THE Public_Site SHALL skanować przesyłane pliki pod kątem złośliwego kodu poprzez weryfikację nagłówków formatu pliku przed zapisem.
9. THE Public_Site SHALL automatycznie generować miniaturę o szerokości 600px dla każdego zatwierdzonego Guest_Photo i zapisywać w tym samym buckecie jako wariant `thumb`.

### Requirement 18: Endpoint dodawania komentarzy i zdjęć

**User Story:** Jako Public_Site, chcę przesłać Review i opcjonalne Guest_Photo w jednym żądaniu, aby zachować spójność relacji między rekordami.

#### Acceptance Criteria

1. WHEN klient wysyła `POST /api/reviews` z poprawnym ciałem JSON i opcjonalnym plikiem `multipart/form-data`, THE Public_Site SHALL utworzyć rekord Review oraz opcjonalnie powiązany rekord Guest_Photo i Media_Asset.
2. THE Public_Site SHALL waliduje ciało żądania serwerowo zgodnie z regułami z wymagań 16 i 17.
3. IF walidacja zawiedzie, THEN THE Public_Site SHALL zwrócić odpowiedź HTTP 400 z mapą błędów per pole.
4. WHEN żądanie kończy się sukcesem, THE Public_Site SHALL zwrócić odpowiedź HTTP 201 z polami `reviewId` i opcjonalnie `guestPhotoId`.
5. THE Public_Site SHALL stosować ochronę CSRF dla `POST /api/reviews` poprzez weryfikację nagłówka `Origin`.

### Requirement 19: Uwierzytelnianie panelu admina

**User Story:** Jako Admin_User, chcę zalogować się do panelu admina za pomocą Supabase Auth, aby uzyskać dostęp do zarządzania treścią i rezerwacjami.

#### Acceptance Criteria

1. WHEN Admin_User otwiera dowolną ścieżkę pod `/admin/*` bez aktywnej sesji, THE Admin_Panel SHALL przekierować go na ścieżkę `/admin/login`.
2. THE Admin_Panel SHALL umożliwiać logowanie poprzez email i hasło z wykorzystaniem Supabase Auth.
3. WHEN Admin_User poda poprawny email i hasło zarejestrowane w Supabase Auth oraz posiada rekord w tabeli `admin_users` z rolą `owner`, `admin` lub `editor`, THE Admin_Panel SHALL utworzyć sesję i przekierować go na `/admin`.
4. IF email lub hasło są niepoprawne, THEN THE Admin_Panel SHALL wyświetlić komunikat "Nieprawidłowy email lub hasło" bez ujawniania, które pole jest niepoprawne.
5. IF Admin_User uwierzytelni się w Supabase Auth, ale nie ma rekordu w tabeli `admin_users`, THEN THE Admin_Panel SHALL zakończyć sesję i wyświetlić komunikat "Brak uprawnień do panelu administracyjnego".
6. WHEN Admin_User klika "Wyloguj się", THE Admin_Panel SHALL zakończyć sesję Supabase Auth i przekierować na `/admin/login`.
7. THE Admin_Panel SHALL ustawiać sesję w cookie HttpOnly, Secure, SameSite=Lax z czasem wygasania 12 godzin.
8. WHEN sesja Admin_User wygaśnie i podejmie działanie wymagające autoryzacji, THE Admin_Panel SHALL przekierować go na `/admin/login` i zachować ścieżkę docelową w parametrze `redirectTo`.
9. THE Admin_Panel SHALL ograniczyć liczbę nieudanych prób logowania do 5 prób na adres IP w ciągu 15 minut; po przekroczeniu THE Admin_Panel SHALL czasowo zablokować dalsze próby z komunikatem "Zbyt wiele prób logowania".

### Requirement 20: Autoryzacja operacji admina

**User Story:** Jako system, chcę weryfikować autoryzację każdej operacji admina po stronie serwera, aby uniemożliwić nieautoryzowane modyfikacje danych.

#### Acceptance Criteria

1. THE Admin_Panel SHALL sprawdzać sesję Admin_User w middleware dla wszystkich tras pod `/admin/*` oraz `/api/admin/*`.
2. IF żądanie do `/api/admin/*` zostaje wysłane bez aktywnej sesji Admin_User, THEN THE Admin_Panel SHALL zwrócić odpowiedź HTTP 401.
3. IF zalogowany użytkownik nie posiada rekordu w `admin_users` z rolą `owner`, `admin` lub `editor`, THEN THE Admin_Panel SHALL zwrócić odpowiedź HTTP 403.
4. THE Admin_Panel SHALL stosować Supabase RLS policies dla wszystkich tabel zapisu, ograniczające operacje INSERT, UPDATE, DELETE wyłącznie do uwierzytelnionych Admin_Users.
5. THE Admin_Panel SHALL używać Supabase Service Role Key wyłącznie po stronie serwera (Route Handlers, Server Actions); the key SHALL NOT być eksponowany w bundlu klienckim.
6. WHEN Admin_User wykonuje operację modyfikującą dane (utworzenie, edycja, usunięcie, zmiana statusu), THE Admin_Panel SHALL zarejestrować akcję w logu zawierającym `adminUserId`, `action`, `targetType`, `targetId` i znacznik czasu.

### Requirement 21: Dashboard admina

**User Story:** Jako Admin_User, chcę po zalogowaniu zobaczyć dashboard z najważniejszymi metrykami i nowymi zdarzeniami, aby szybko zorientować się, co wymaga mojej uwagi.

#### Acceptance Criteria

1. WHEN Admin_User otwiera ścieżkę `/admin`, THE Admin_Panel SHALL wyświetlić licznik nowych Booking_Inquiries ze statusem `new` lub `pending`.
2. THE Admin_Panel SHALL wyświetlić listę 5 najbliższych przyjazdów (`checkInDate >= dzisiaj`) wśród Reservations ze statusem `confirmed`.
3. THE Admin_Panel SHALL wyświetlić listę 5 najbliższych wyjazdów (`checkOutDate >= dzisiaj`) wśród Reservations ze statusem `confirmed`.
4. THE Admin_Panel SHALL wyświetlić licznik Reviews ze statusem `pending`.
5. THE Admin_Panel SHALL wyświetlić licznik Guest_Photos ze statusem `pending`.
6. THE Admin_Panel SHALL wyświetlić szybkie linki do `/admin/reservations`, `/admin/calendar`, `/admin/reviews`, `/admin/photos`.

### Requirement 22: Zarządzanie apartamentami

**User Story:** Jako Admin_User, chcę zarządzać 2 apartamentami w panelu (edytować dane, zdjęcia, udogodnienia, zasady i status publikacji), aby aktualizować ofertę bez dotykania kodu.

#### Acceptance Criteria

1. WHEN Admin_User otwiera ścieżkę `/admin/apartments`, THE Admin_Panel SHALL wyświetlić listę wszystkich Apartamentów (niezależnie od `isPublished`) z polami: nazwa, slug, status publikacji, liczba zdjęć.
2. THE Admin_Panel SHALL umożliwić Admin_User otwarcie edycji Apartamentu pod ścieżką `/admin/apartments/{id}`.
3. THE Admin_Panel SHALL pozwolić edytować pola: `name`, `slug`, `shortDescription`, `description`, `locationLabel`, `maxGuests`, `bedrooms`, `bathrooms`, `houseRules`, `isPublished`, `sortOrder`.
4. THE Admin_Panel SHALL umożliwić zarządzanie listą udogodnień Apartamentu poprzez wybór z istniejących rekordów `amenities`.
5. THE Admin_Panel SHALL umożliwić upload zdjęć Apartamentu do Site_Media_Bucket, ustawienie zdjęcia hero, kolejności (`sortOrder`) i alt textu.
6. THE Admin_Panel SHALL walidować, że pole `slug` jest unikalne wśród wszystkich Apartamentów oraz zawiera tylko małe litery, cyfry i znak `-`.
7. WHEN Admin_User zapisuje zmiany Apartamentu, THE Admin_Panel SHALL zaktualizować pole `updatedAt` znacznikiem czasu zapisu.
8. WHERE Admin_User próbuje usunąć Apartament, THE Admin_Panel SHALL wyświetlić potwierdzenie i zablokować usunięcie, jeśli istnieją powiązane Reservations ze statusem `confirmed`.

### Requirement 23: Zarządzanie kalendarzem przez admina

**User Story:** Jako Admin_User, chcę zobaczyć i edytować pełny kalendarz dla każdego apartamentu z rezerwacjami, zapytaniami i blokadami, aby zarządzać dostępnością.

#### Acceptance Criteria

1. WHEN Admin_User otwiera ścieżkę `/admin/calendar`, THE Admin_Panel SHALL wyświetlić kalendarz miesięczny z możliwością wyboru Apartamentu i miesiąca.
2. THE Admin_Panel SHALL wyświetlać dla każdego dnia status (`available`, `pending`, `reserved`, `blocked`) oraz dane szczegółowe: dla `reserved` i `pending` imię gościa, daty pobytu i status; dla `blocked` powód blokady.
3. THE Admin_Panel SHALL umożliwić Admin_User dodanie Calendar_Block z polami: `apartmentId`, `startDate`, `endDate`, `reason`, `status` (`blocked`, `maintenance`, `privateStay`).
4. THE Admin_Panel SHALL walidować, że `startDate` Calendar_Block nie jest późniejsza niż `endDate`.
5. THE Admin_Panel SHALL walidować, że Calendar_Block nie nakłada się na istniejącą Reservation ze statusem `confirmed`.
6. THE Admin_Panel SHALL umożliwić edycję i usunięcie Calendar_Block.
7. THE Admin_Panel SHALL umożliwić Admin_User dodanie ręcznie Reservation z polami: `apartmentId`, `checkInDate`, `checkOutDate`, `displayName`, `email`, `phone`, `adultCount`, `childCount`, `adminNotes`.
8. THE Admin_Panel SHALL walidować, że ręcznie dodana Reservation nie nakłada się na istniejącą Reservation ze statusem `confirmed` ani na Calendar_Block o statusie różnym od `privateStay`.
9. WHEN Admin_User klika dzień ze statusem `pending`, THE Admin_Panel SHALL wyświetlić szczegóły powiązanej Booking_Inquiry z opcjami "Potwierdź" i "Odrzuć".

### Requirement 24: Zarządzanie rezerwacjami i zapytaniami

**User Story:** Jako Admin_User, chcę zobaczyć listę wszystkich Booking_Inquiries i Reservations oraz zmieniać ich status, aby obsługiwać prośby gości.

#### Acceptance Criteria

1. WHEN Admin_User otwiera ścieżkę `/admin/reservations`, THE Admin_Panel SHALL wyświetlić listę Booking_Inquiries i Reservations z filtrami po Apartamencie, statusie, zakresie dat i frazie wyszukiwania (imię, email).
2. THE Admin_Panel SHALL wyświetlać dla każdego rekordu: nazwę Apartamentu, daty pobytu, dane gościa (imię, email, telefon), liczbę osób, status i datę utworzenia.
3. THE Admin_Panel SHALL umożliwić Admin_User otwarcie szczegółów Booking_Inquiry pod ścieżką `/admin/reservations/{id}`.
4. THE Admin_Panel SHALL umożliwić Admin_User zmianę statusu Booking_Inquiry pomiędzy wartościami: `new`, `pending`, `inReview`, `confirmed`, `declined`, `cancelled`.
5. WHEN Admin_User zmienia status Booking_Inquiry na `confirmed`, THE Admin_Panel SHALL utworzyć powiązaną Reservation ze statusem `confirmed`, kopiując pola `apartmentId`, `guestId`, `checkInDate`, `checkOutDate`, `adultCount`, `childCount`, `sourceInquiryId`.
6. IF Admin_User próbuje potwierdzić Booking_Inquiry, której Date_Range nakłada się na istniejącą Reservation `confirmed` lub Calendar_Block, THEN THE Admin_Panel SHALL wyświetlić błąd "Termin koliduje z istniejącym wpisem" i zablokować zmianę statusu.
7. WHEN Admin_User zmienia status Booking_Inquiry na `declined` lub `cancelled`, THE Admin_Panel SHALL umożliwić wpisanie notatki w polu `adminNotes`.
8. THE Admin_Panel SHALL umożliwić edycję Reservation: zmiana dat, zmiana liczby osób, zmiana statusu (`confirmed`, `cancelled`, `completed`), edycję `adminNotes`.
9. THE Admin_Panel SHALL umożliwić eksport listy widocznych rezerwacji do pliku CSV.
10. THE Admin_Panel SHALL wyświetlać dane kontaktowe gości tylko Admin_Users; te dane SHALL NOT pojawiać się w żadnym widoku publicznym ani odpowiedzi publicznego API.

### Requirement 25: Zarządzanie restauracjami w panelu

**User Story:** Jako Admin_User, chcę dodawać, edytować i publikować restauracje wraz ze zdjęciami i opisami, aby aktualizować przewodnik kulinarny.

#### Acceptance Criteria

1. WHEN Admin_User otwiera ścieżkę `/admin/restaurants`, THE Admin_Panel SHALL wyświetlić listę wszystkich Restaurantów z filtrami po `area` i `isPublished`.
2. THE Admin_Panel SHALL umożliwić utworzenie i edycję Restaurantu z polami: `slug`, `name`, `description`, `locationLabel`, `address`, `mapUrl`, `cuisineType`, `area`, `heroMediaAssetId`, `isPublished`, `sortOrder`.
3. THE Admin_Panel SHALL walidować unikalność `slug` w tabeli `restaurants`.
4. THE Admin_Panel SHALL umożliwić upload zdjęć Restaurantu do Site_Media_Bucket i wybór zdjęcia hero.
5. THE Admin_Panel SHALL umożliwić zmianę statusu publikacji (`isPublished`).
6. WHERE Admin_User próbuje usunąć Restaurant, THE Admin_Panel SHALL wyświetlić potwierdzenie i ostrzeżenie o powiązanych Reviews i Guest_Photos.
7. WHEN Restaurant zostaje usunięty, THE Admin_Panel SHALL pozostawić powiązane Reviews i Guest_Photos w stanie `hidden` z zachowaniem rekordów.

### Requirement 26: Zarządzanie miejscami w panelu

**User Story:** Jako Admin_User, chcę dodawać, edytować i publikować atrakcje turystyczne, aby budować przewodnik po Orte i okolicy.

#### Acceptance Criteria

1. WHEN Admin_User otwiera ścieżkę `/admin/places`, THE Admin_Panel SHALL wyświetlić listę wszystkich Attractions z filtrami po `area`, `category` i `isPublished`.
2. THE Admin_Panel SHALL umożliwić utworzenie i edycję Attraction z polami: `slug`, `name`, `description`, `locationLabel`, `address`, `mapUrl`, `area`, `category`, `estimatedVisitTime`, `travelHint`, `heroMediaAssetId`, `isPublished`, `sortOrder`.
3. THE Admin_Panel SHALL walidować unikalność `slug` w tabeli `attractions`.
4. THE Admin_Panel SHALL umożliwić upload zdjęć i wybór zdjęcia hero.
5. THE Admin_Panel SHALL umożliwić zmianę statusu publikacji.

### Requirement 27: Zarządzanie sekcją Rzym w panelu

**User Story:** Jako Admin_User, chcę zarządzać treściami sekcji Rzym (restauracje, miejsca, plan zwiedzania, info), aby utrzymywać aktualne informacje dla gości.

#### Acceptance Criteria

1. WHEN Admin_User otwiera ścieżkę `/admin/rome`, THE Admin_Panel SHALL wyświetlić zakładki dla restauracji Rzym (`area = "rome"`), miejsc Rzym (`area = "rome"`), Guide_Posts z `section = "romeItinerary"` i `section = "romeInfo"`.
2. THE Admin_Panel SHALL umożliwić tworzenie i edycję Guide_Posts z polami: `slug`, `title`, `summary`, `body`, `categoryId`, `section`, `heroMediaAssetId`, `isPublished`, `publishedAt`.
3. THE Admin_Panel SHALL renderować edytor pola `body` w trybie WYSIWYG lub Markdown z obsługą nagłówków, list, linków i obrazów.
4. THE Admin_Panel SHALL walidować unikalność `slug` w tabeli `guide_posts`.
5. WHEN Admin_User publikuje Guide_Post, THE Admin_Panel SHALL ustawić `publishedAt` na bieżący znacznik czasu.

### Requirement 28: Zarządzanie przydatnymi informacjami w panelu

**User Story:** Jako Admin_User, chcę zarządzać Guide_Posts w sekcji `usefulInfo`, aby aktualizować praktyczne informacje transportowe.

#### Acceptance Criteria

1. WHEN Admin_User otwiera ścieżkę `/admin/useful-info`, THE Admin_Panel SHALL wyświetlić listę Guide_Posts z `section = "usefulInfo"`.
2. THE Admin_Panel SHALL umożliwić tworzenie, edycję i usuwanie Guide_Posts w sekcji `usefulInfo`.
3. THE Admin_Panel SHALL umożliwić zmianę kolejności wyświetlania (`sortOrder`).

### Requirement 29: Moderacja komentarzy i ocen

**User Story:** Jako Admin_User, chcę zatwierdzać, odrzucać lub ukrywać Reviews dodane przez gości, aby kontrolować jakość treści publikowanych na stronie.

#### Acceptance Criteria

1. WHEN Admin_User otwiera ścieżkę `/admin/reviews`, THE Admin_Panel SHALL wyświetlić listę wszystkich Reviews z filtrami po `Moderation_Status`, `targetType` i datą utworzenia.
2. THE Admin_Panel SHALL wyświetlać domyślnie listę Reviews ze statusem `pending` posortowaną po `createdAt` rosnąco.
3. THE Admin_Panel SHALL umożliwić Admin_User zmianę `Moderation_Status` Review na `approved`, `rejected` lub `hidden`.
4. WHEN Admin_User zatwierdza Review, THE Admin_Panel SHALL ustawić `Moderation_Status = approved` i zarejestrować `adminUserId` oraz znacznik czasu w polu `moderatedAt`.
5. WHEN Admin_User odrzuca Review, THE Admin_Panel SHALL ustawić `Moderation_Status = rejected` i pozwolić wpisać uzasadnienie w polu `adminNotes`.
6. WHEN Admin_User ukrywa Review wcześniej zatwierdzoną, THE Admin_Panel SHALL ustawić `Moderation_Status = hidden`.
7. THE Admin_Panel SHALL wyświetlać podgląd treści Review wraz z dołączonymi Guest_Photos przed podjęciem decyzji moderacyjnej.
8. WHEN Review zostaje odrzucona, THE Admin_Panel SHALL ustawić `Moderation_Status` powiązanych Guest_Photos na `rejected`.

### Requirement 30: Moderacja zdjęć gości

**User Story:** Jako Admin_User, chcę przeglądać kolejkę Guest_Photos i decydować o ich publikacji, aby chronić markę przed nieodpowiednimi treściami.

#### Acceptance Criteria

1. WHEN Admin_User otwiera ścieżkę `/admin/photos`, THE Admin_Panel SHALL wyświetlić listę Guest_Photos z filtrami po `Moderation_Status`, `targetType` i datą.
2. THE Admin_Panel SHALL wyświetlać domyślnie listę Guest_Photos ze statusem `pending` posortowaną po `createdAt` rosnąco.
3. THE Admin_Panel SHALL umożliwić podgląd pełnowymiarowego zdjęcia, autora, treści powiązanej Review oraz docelowego Restaurantu lub Attraction.
4. THE Admin_Panel SHALL umożliwić zmianę `Moderation_Status` Guest_Photo na `approved`, `rejected` lub `hidden`.
5. WHEN Admin_User zatwierdza Guest_Photo, THE Admin_Panel SHALL ustawić `Moderation_Status = approved` i wygenerować miniaturę zgodnie z wymaganiem 17.
6. WHEN Admin_User odrzuca Guest_Photo, THE Admin_Panel SHALL ustawić `Moderation_Status = rejected` i usunąć plik z Guest_Media_Bucket po 30 dniach.

### Requirement 31: Ustawienia strony

**User Story:** Jako Admin_User z rolą `owner`, chcę edytować ustawienia globalne strony, aby aktualizować dane kontaktowe i konfigurację bez kodowania.

#### Acceptance Criteria

1. WHEN Admin_User z rolą `owner` otwiera ścieżkę `/admin/settings`, THE Admin_Panel SHALL wyświetlić formularz ustawień strony z polami z tabeli `site_settings`.
2. THE Admin_Panel SHALL umożliwić edycję pól: `siteName`, `locationLabel`, `contactEmail`, `contactPhone`, `defaultLanguage`, `supportedLanguages`, `bookingMode`.
3. THE Admin_Panel SHALL walidować, że `contactEmail` ma poprawny format zgodnie z wymaganiem 6.
4. THE Admin_Panel SHALL ograniczać dostęp do `/admin/settings` wyłącznie do Admin_Users z rolą `owner`.
5. IF Admin_User z rolą `admin` lub `editor` próbuje wejść na `/admin/settings`, THEN THE Admin_Panel SHALL zwrócić odpowiedź HTTP 403.

### Requirement 32: Bezpieczeństwo i prywatność danych gości

**User Story:** Jako system, chcę chronić dane osobowe gości i wymuszać dostęp na poziomie wierszy bazy, aby zapobiec wyciekom i nieautoryzowanym modyfikacjom.

#### Acceptance Criteria

1. THE Public_Site SHALL przechowywać sekrety (Supabase Service Role Key, klucze API) wyłącznie w zmiennych środowiskowych i NOT SHALL ich eksponować w bundlu klienckim.
2. THE Public_Site SHALL korzystać z `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` w kliencie oraz z `SUPABASE_SERVICE_ROLE_KEY` wyłącznie po stronie serwera.
3. THE Public_Site SHALL stosować RLS policies dla wszystkich tabel zawierających dane gości (`guests`, `booking_inquiries`, `reservations`, `reviews`, `guest_photos`).
4. THE Public_Site SHALL pozwalać niezalogowanym użytkownikom na operację INSERT do tabel `booking_inquiries`, `guests`, `reviews`, `guest_photos`, `media_assets` zgodnie z politykami; SHALL NOT pozwalać na operacje SELECT, UPDATE ani DELETE w tych tabelach z poziomu klienta publicznego.
5. THE Public_Site SHALL pozwalać niezalogowanym użytkownikom na operację SELECT wyłącznie dla wierszy z `Moderation_Status = approved` w tabelach `reviews` i `guest_photos`.
6. THE Public_Site SHALL używać HTTPS dla wszystkich żądań w produkcji; THE deployment SHALL wymuszać przekierowania HTTP→HTTPS.
7. THE Public_Site SHALL ustawiać nagłówki bezpieczeństwa: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
8. THE Public_Site SHALL stosować ochronę CSRF dla wszystkich endpointów modyfikujących dane (`POST`, `PATCH`, `DELETE`) poprzez weryfikację nagłówka `Origin` lub tokenu CSRF.
9. WHEN Public_Guest wypełnia Booking_Form, THE Public_Site SHALL przesyłać dane wyłącznie kanałem HTTPS i zapisywać hasła oraz tokeny dostępu wyłącznie w postaci hasłowej zgodnej z domyślnymi mechanizmami Supabase Auth.
10. THE Public_Site SHALL umożliwiać Admin_User usunięcie danych osobowych Gościa (`displayName`, `email`, `phone`) z tabeli `guests` na żądanie zgodne z RODO, zachowując rekordy Booking_Inquiries i Reservations w stanie zanonimizowanym.

### Requirement 33: Wydajność i Core Web Vitals

**User Story:** Jako Public_Guest, chcę aby strona ładowała się szybko i była responsywna na interakcje, aby planować pobyt bez frustracji.

#### Acceptance Criteria

1. THE Public_Site SHALL renderować strony publiczne w trybie Server-Side Rendering lub Static Site Generation w Next.js App Router; THE strony szczegółów apartamentów, restauracji i miejsc SHALL korzystać ze statycznej generacji z rewalidacją inkrementalną (`revalidate`).
2. THE Public_Site SHALL osiągać wartość Largest Contentful Paint (LCP) poniżej 2.5 sekundy w warunkach symulowanego łącza 4G dla strony głównej, listy apartamentów i strony szczegółów apartamentu.
3. THE Public_Site SHALL osiągać wartość Cumulative Layout Shift (CLS) poniżej 0.1 dla wszystkich stron publicznych.
4. THE Public_Site SHALL osiągać wartość Interaction to Next Paint (INP) poniżej 200 milisekund dla strony głównej, listy apartamentów i strony szczegółów apartamentu.
5. THE Public_Site SHALL używać komponentu `next/image` dla wszystkich zdjęć z określeniem `width`, `height` i `priority` dla zdjęć hero powyżej linii zgięcia.
6. THE Public_Site SHALL preferować formaty obrazów AVIF i WebP, generowane przez `next/image` z odpowiednim fallbackiem.
7. THE Public_Site SHALL stosować lazy loading dla obrazów poniżej linii zgięcia.
8. THE Public_Site SHALL korzystać z optymalizacji fontów `next/font` dla typografii (Cormorant Garamond, Inter) z wariantem `display: swap`.
9. THE Public_Site SHALL ograniczać rozmiar bundla JavaScript dla pojedynczej trasy publicznej do mniej niż 200 KB po kompresji gzip dla initial chunk.

### Requirement 34: Dostępność (WCAG 2.1 AA)

**User Story:** Jako Public_Guest z niepełnosprawnością, chcę korzystać ze strony BELLAORTE z wykorzystaniem klawiatury i czytnika ekranu, aby móc zarezerwować pobyt na równi z innymi gośćmi.

#### Acceptance Criteria

1. THE Public_Site SHALL spełniać poziom WCAG 2.1 AA dla wszystkich publicznych stron i Booking_Form.
2. THE Public_Site SHALL zapewniać kontrast tekstu wobec tła co najmniej 4.5:1 dla tekstu o rozmiarze poniżej 18 punktów i co najmniej 3:1 dla tekstu większego.
3. THE Public_Site SHALL posiadać widoczny stan focus dla wszystkich elementów interaktywnych z kontrastem co najmniej 3:1 wobec tła sąsiadującego.
4. THE Public_Site SHALL umożliwiać nawigację po wszystkich elementach interaktywnych za pomocą klawiatury (Tab, Shift+Tab, Enter, Spacja, Escape, strzałki dla kalendarza).
5. THE Availability_Calendar SHALL być obsługiwana z klawiatury: strzałki przesuwają focus między dniami, Enter wybiera dzień, Escape resetuje wybór.
6. THE Availability_Calendar SHALL przekazywać status dni do czytnika ekranu poprzez atrybuty `aria-label` zawierające datę i status, np. "5 czerwca 2026, status: wolne".
7. THE Public_Site SHALL używać semantycznych elementów HTML (`header`, `nav`, `main`, `footer`, `article`, `section`, `h1`-`h6`) zgodnie z hierarchią strony.
8. THE Public_Site SHALL podawać tekst alternatywny (`alt`) dla wszystkich obrazów; obrazy dekoracyjne SHALL mieć `alt=""`.
9. THE Public_Site SHALL łączyć każde pole formularza z widoczną etykietą poprzez atrybut `for` lub element `label` zawierający pole.
10. THE Public_Site SHALL przekazywać błędy walidacji formularza do czytnika ekranu poprzez atrybut `aria-invalid` na polu i `aria-describedby` wskazujący komunikat błędu.
11. THE Public_Site SHALL zapewniać dotykową strefę kliknięcia o rozmiarze co najmniej 44x44 pikseli dla wszystkich przycisków i linków na ekranach o szerokości poniżej 768 pikseli.
12. THE Public_Site SHALL nie polegać wyłącznie na kolorze do przekazania informacji; statusy kalendarza, ostrzeżenia i potwierdzenia SHALL używać dodatkowo ikony lub tekstu.

### Requirement 35: SEO i metadane

**User Story:** Jako właściciel BELLAORTE, chcę aby strona była dobrze indeksowana przez wyszukiwarki i prawidłowo wyświetlana w mediach społecznościowych, aby przyciągnąć więcej gości.

#### Acceptance Criteria

1. THE Public_Site SHALL definiować unikalny tytuł `<title>` dla każdej publicznej trasy, zawierający nazwę BELLAORTE.
2. THE Public_Site SHALL definiować meta description dla każdej publicznej trasy o długości od 50 do 160 znaków.
3. THE Public_Site SHALL definiować tagi Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) dla wszystkich publicznych tras.
4. THE Public_Site SHALL definiować tagi Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) dla wszystkich publicznych tras.
5. THE Public_Site SHALL eksponować plik `/robots.txt` zezwalający na indeksowanie wszystkich publicznych tras i blokujący `/admin/*` oraz `/api/admin/*`.
6. THE Public_Site SHALL generować plik `/sitemap.xml` zawierający wszystkie publiczne trasy: `/`, `/apartments`, `/apartments/{slug}` dla opublikowanych Apartamentów, `/booking`, `/guide`, `/restaurants`, `/restaurants/{slug}`, `/places`, `/places/{slug}`, `/rome` i podstrony Rzym, `/useful-info` i podstrony.
7. THE Public_Site SHALL aktualizować datę `lastmod` w `sitemap.xml` na podstawie pola `updatedAt` rekordów źródłowych.
8. THE Public_Site SHALL definiować dane strukturalne JSON-LD typu `LodgingBusiness` dla strony głównej, `Apartment` dla stron szczegółów apartamentów, `Restaurant` i `TouristAttraction` dla odpowiednich stron przewodnika.
9. THE Public_Site SHALL definiować kanoniczne URL-e poprzez tag `<link rel="canonical">` dla każdej publicznej trasy.

### Requirement 36: Responsywność

**User Story:** Jako Public_Guest korzystający z telefonu, tabletu lub komputera, chcę aby strona BELLAORTE była użyteczna i estetyczna na każdym urządzeniu, aby planować pobyt z dowolnego miejsca.

#### Acceptance Criteria

1. THE Public_Site SHALL renderować się poprawnie i bez przewijania horyzontalnego dla szerokości ekranów od 360 do 1920 pikseli.
2. THE Public_Site SHALL stosować breakpointy Tailwind CSS: mobile (`< 768px`), tablet (`768-1023px`), desktop (`1024-1279px`), wide (`>= 1280px`).
3. THE Booking_Form SHALL prezentować się jako pojedyncza kolumna na mobile i jako wieloplanowy układ na desktop.
4. THE Availability_Calendar SHALL pozostawać czytelna na ekranach 360 pikseli z zachowaniem statusów dni i legendy.
5. THE Public_Site SHALL implementować nawigację mobilną w postaci menu hamburger lub menu off-canvas dla szerokości poniżej 768 pikseli.
6. THE Public_Site SHALL stosować zdjęcia o szerokości dopasowanej do `next/image` `sizes` atrybutu, aby unikać dostarczania nadmiernie dużych obrazów na mobile.

### Requirement 37: Internacjonalizacja (PL na start)

**User Story:** Jako Public_Guest mówiący po polsku, chcę aby cała strona BELLAORTE była po polsku i była przygotowana na późniejsze dodanie języka angielskiego i włoskiego, aby korzystać z aplikacji w moim języku.

#### Acceptance Criteria

1. THE Public_Site SHALL renderować cały interfejs (etykiety, komunikaty, błędy, przyciski, nawigację) w języku polskim w MVP.
2. THE Public_Site SHALL ustawiać atrybut `<html lang="pl">` na wszystkich stronach.
3. THE Public_Site SHALL formatować daty w formacie polskim (`d MMMM yyyy`, np. "5 czerwca 2026") za pomocą `Intl.DateTimeFormat`.
4. THE Public_Site SHALL formatować liczby zgodnie z lokalizacją polską (separator dziesiętny przecinek, separator tysięcy spacja).
5. THE Public_Site SHALL przechowywać teksty interfejsu w formie umożliwiającej przyszłą ekstrakcję do plików tłumaczeń (np. obiekty słowników w `src/lib/i18n/pl.ts`); SHALL NOT zawierać twardo wpisanych tekstów rozproszonych po komponentach poza warstwą prezentacji.
6. THE Public_Site SHALL przygotować architekturę routingu Next.js App Router w sposób umożliwiający przyszłe dodanie ścieżek lokalizowanych (np. `/en`, `/it`) bez znaczącej refaktoryzacji.
7. THE Site_Settings SHALL przechowywać `defaultLanguage = "pl"` oraz `supportedLanguages = ["pl"]` w MVP, z możliwością rozszerzenia w przyszłości.

### Requirement 38: Branding i paleta wizualna

**User Story:** Jako Public_Guest, chcę aby strona BELLAORTE wyglądała elegancko, w klimacie włoskim i była rozpoznawalna, aby budować zaufanie do oferty.

#### Acceptance Criteria

1. THE Public_Site SHALL stosować paletę Italian_Flag_Palette w eleganckiej wersji: bazą `flagWhite` i `ivory`, akcentem marki `italianGreen`, akcentem CTA `terracotta` lub `italianRed`, ciemnym tekstem `ink` lub `cypress`.
2. THE Public_Site SHALL stosować font display podobny do Cormorant Garamond dla nagłówków hero, nazwy marki i tytułów sekcji przewodnika.
3. THE Public_Site SHALL stosować font UI podobny do Inter dla tekstu formularzy, kalendarza, paneli i komentarzy.
4. THE Public_Site SHALL ograniczać promień zaokrąglenia kart i przycisków do maksymalnie 8 pikseli.
5. THE Public_Site SHALL NOT zagnieżdżać kart wewnątrz innych kart.
6. THE Public_Site SHALL stosować jeden główny CTA na ekran (`terracotta` lub `italianRed`) zgodnie z hierarchią akcji.
7. THE Admin_Panel SHALL stosować bardziej neutralną wersję palety: bazą `flagWhite`, akcentem `cypress` i `italianGreen`, z czerwienią używaną wyłącznie dla działań destrukcyjnych.

### Requirement 39: Stany błędów i pustych widoków

**User Story:** Jako Public_Guest lub Admin_User, chcę otrzymywać jasne komunikaty w sytuacjach błędów lub gdy lista jest pusta, aby wiedzieć, co dalej zrobić.

#### Acceptance Criteria

1. WHEN Public_Site nie może załadować danych z bazy z powodu błędu serwera, THE Public_Site SHALL wyświetlić stronę błędu z komunikatem "Nie udało się załadować strony. Spróbuj ponownie za chwilę" i przyciskiem "Odśwież stronę".
2. WHEN lista Apartamentów, Restaurantów, Attractions lub Guide_Posts jest pusta, THE Public_Site SHALL wyświetlić komunikat "Wkrótce pojawią się nowe wpisy" zamiast pustego widoku.
3. WHEN Availability_Calendar nie znajduje dostępnych terminów w widocznym miesiącu, THE Public_Site SHALL wyświetlić komunikat "Brak wolnych terminów w tym miesiącu" z przyciskami nawigacji do następnego/poprzedniego miesiąca.
4. WHEN Booking_Form napotka błąd serwera podczas wysyłania, THE Public_Site SHALL wyświetlić komunikat "Wysłanie zapytania nie powiodło się. Spróbuj ponownie lub skontaktuj się bezpośrednio" oraz zachować dane wprowadzone przez Public_Guest.
5. WHEN Admin_User otwiera stronę panelu z pustą listą (np. brak Reviews do moderacji), THE Admin_Panel SHALL wyświetlić komunikat "Brak elementów do wyświetlenia" z linkami do innych sekcji panelu.
6. THE Public_Site SHALL definiować stronę 404 dla nieistniejących tras z linkiem do strony głównej i menu nawigacyjnego.
7. THE Public_Site SHALL definiować stronę 500 dla nieoczekiwanych błędów serwera z bezpiecznym komunikatem (bez ujawniania szczegółów technicznych).

### Requirement 40: Logowanie i monitorowanie

**User Story:** Jako Admin_User, chcę aby system rejestrował kluczowe zdarzenia i błędy, aby ułatwić diagnostykę i audyt.

#### Acceptance Criteria

1. THE Public_Site SHALL logować błędy serwerowe (HTTP 500) z identyfikatorem żądania, ścieżką, znacznikiem czasu i stack trace, ale SHALL NOT logować pełnych danych osobowych gości.
2. THE Public_Site SHALL logować akcje Admin_User (utworzenie, edycja, usunięcie, zmiana statusu) zawierając `adminUserId`, `action`, `targetType`, `targetId` i znacznik czasu.
3. THE Public_Site SHALL przechowywać logi audytowe akcji adminów przez minimum 90 dni.
4. THE Public_Site SHALL integrować się z usługą monitorowania błędów (np. Sentry) w środowisku produkcyjnym, w sposób konfigurowalny przez zmienną środowiskową `SENTRY_DSN`.
5. WHEN aplikacja wykryje krytyczny błąd w środowisku produkcyjnym, THE Public_Site SHALL wysłać raport do skonfigurowanej usługi monitorowania błędów.
