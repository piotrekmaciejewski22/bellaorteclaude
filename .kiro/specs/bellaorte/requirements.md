# Requirements Document: BELLAORTE

## Introduction

BELLAORTE to publiczna strona internetowa, system rezerwacji oraz interaktywny przewodnik turystyczny dla 2 apartamentów wynajmowanych w Orte (`01028 Orte, Prowincja Viterbo, Włochy`). Projekt jest budowany od zera w nowym folderze `bellaorte2` w stosie technologicznym Next.js App Router + React + TypeScript + Tailwind CSS + Supabase (Postgres, Auth, Storage). Dokumentacja istniejącego projektu w siostrzanym folderze `bellaorte` służy wyłącznie jako materiał referencyjny — nie dziedziczymy kodu ani decyzji implementacyjnych.

MVP nie pokazuje cen i nie obsługuje płatności online. Gość wybiera apartament, sprawdza publiczny kalendarz dostępności (4 statusy: wolne, oczekujące, zarezerwowane, zablokowane), wysyła zapytanie/rezerwację, a admin obsługuje termin ręcznie w panelu. Druga pętla MVP to interaktywny przewodnik: restauracje, miejsca do zwiedzania, dedykowana sekcja RZYM oraz przydatne informacje, gdzie goście mogą dodawać opinie, oceny i zdjęcia z moderacją administratora.

Niniejszy dokument opisuje pełen zakres MVP i jest źródłem prawdy dla późniejszej fazy projektowej i wykonawczej.

## Glossary

- **System** — aplikacja BELLAORTE jako całość (publiczna strona + panel admina + warstwa API).
- **Public_Site** — publiczna część strony dostępna bez logowania (trasy spoza `/admin`).
- **Admin_Panel** — chroniona część strony pod `/admin`, dostępna tylko dla zalogowanych adminów.
- **Public_Visitor** — niezalogowany użytkownik strony (turysta planujący pobyt lub czytelnik przewodnika).
- **Guest_Contributor** — niezalogowany użytkownik wysyłający formularz (zapytanie rezerwacyjne, opinia, zdjęcie).
- **Admin_User** — zalogowany użytkownik panelu administracyjnego (właściciel lub osoba zarządzająca treścią).
- **Apartment** — model jednego z dwóch apartamentów oferowanych w Orte; ma slug, nazwę, opis, udogodnienia, galerię i zasady pobytu.
- **Apartment_Listing** — publiczna lista 2 apartamentów na trasie `/apartments`.
- **Apartment_Detail** — publiczna strona pojedynczego apartamentu na trasie `/apartments/[slug]`.
- **Availability_Calendar** — publiczny komponent kalendarza pokazujący 4 statusy terminów dla wybranego apartamentu.
- **Calendar_Status** — jeden z czterech statusów dnia w kalendarzu: `available`, `pending`, `reserved`, `blocked`.
- **Booking_Inquiry** — wysłane przez gościa zapytanie/prośba o rezerwację zawierające apartament, zakres dat, dane kontaktowe i wiadomość.
- **Reservation** — potwierdzony przez admina pobyt, który zajmuje zakres dat ze statusem `reserved`.
- **Calendar_Block** — ręczna blokada terminu wprowadzona przez admina (np. pobyt prywatny, remont, sprzątanie); zajmuje zakres dat ze statusem `blocked`.
- **Booking_Form** — formularz wyboru apartamentu, dat i danych kontaktowych na trasie `/booking`.
- **Booking_Confirmation_Page** — strona potwierdzenia wysłania zapytania na trasie `/booking/confirmation`.
- **Guide_Hub** — publiczny węzeł przewodnika na trasie `/guide` linkujący do restauracji, miejsc, sekcji Rzym i przydatnych informacji.
- **Restaurant** — polecana restauracja w Orte i okolicy zarządzana przez admina; ma nazwę, opis, dane mapowe, zdjęcia, kategorie kuchni i opinie gości.
- **Attraction** — miejsce do zwiedzania w Orte i okolicy zarządzane przez admina; ma opis, zdjęcia, dane mapowe i opinie gości.
- **Rome_Section** — dedykowany hub sekcji RZYM na trasach `/rome`, `/rome/restaurants`, `/rome/places`, `/rome/itinerary`, `/rome/info`.
- **Travel_Info** — praktyczna informacja o transporcie: wynajem samochodu, dojazd do Rzymu, pociągi, możliwe kierunki podróży.
- **Review** — opinia gościa zawierająca podpis, ocenę 1–5 i tekst, przypięta do restauracji, atrakcji lub treści Rzym.
- **Guest_Photo** — zdjęcie wgrane przez gościa do restauracji, atrakcji lub treści Rzym.
- **Moderation_Status** — status moderacji treści gościa: `pending`, `approved`, `rejected`, `hidden`.
- **Map_Data** — komplet danych lokalizacyjnych miejsca: adres, Google Place ID, link Google Maps, współrzędne, telefon, www, godziny otwarcia, tagi, wskazówka dla gościa.
- **Site_Media** — bucket Supabase Storage dla zdjęć strony, apartamentów i przewodnika.
- **Guest_Media** — bucket Supabase Storage dla zdjęć wgrywanych przez gości.
- **Italian_Flag_Theme** — system kolorów oparty o elegancką, turystyczną interpretację flagi Włoch (zielony, biały, czerwony) na bazie ivory z akcentami głębokiej zieleni i terracotty.
- **MVP** — minimalny zakres produkcyjny opisany w tym dokumencie (bez cen, bez płatności, 2 apartamenty, moderowane treści gości).

## Requirements

### Requirement 1: Strona główna BELLAORTE

**User Story:** Jako Public_Visitor chcę po wejściu na stronę główną od razu zobaczyć markę BELLAORTE, lokalizację Orte i drogę do dwóch apartamentów oraz przewodnika, żeby w jednym miejscu zacząć planowanie pobytu.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/`, THE Public_Site SHALL wyrenderować sekcję hero zawierającą nazwę marki `BELLAORTE` oraz tekst lokalizacji `Orte, Prowincja Viterbo, Włochy`.
2. WHEN Public_Visitor otwiera trasę `/`, THE Public_Site SHALL wyświetlić co najmniej jedno zdjęcie tła pochodzące z Site_Media przedstawiające Orte, okolicę lub klimat Włoch.
3. WHEN Public_Visitor otwiera trasę `/`, THE Public_Site SHALL wyświetlić dokładnie 2 karty apartamentów linkujące do Apartment_Detail.
4. WHEN Public_Visitor otwiera trasę `/`, THE Public_Site SHALL wyświetlić główne CTA prowadzące do Booking_Form na trasie `/booking`.
5. WHEN Public_Visitor otwiera trasę `/`, THE Public_Site SHALL wyświetlić linki nawigacyjne do `/apartments`, `/guide`, `/restaurants`, `/places`, `/rome` oraz `/useful-info`.
6. THE Public_Site SHALL wyświetlać stronę główną bez żadnych informacji o cenach pobytu.

#### Wymaganie 2: Globalny nagłówek i stopka

**User Story:** Jako Public_Visitor chcę mieć spójną nawigację i stopkę na każdej publicznej stronie, żeby łatwo poruszać się między apartamentami, kalendarzem i przewodnikiem.

#### Acceptance Criteria

1. THE Public_Site SHALL renderować globalny nagłówek na każdej trasie publicznej zawierający logo `BELLAORTE` linkujące do `/` i menu z linkami do `/apartments`, `/guide`, `/rome`, `/useful-info` oraz `/booking`.
2. THE Public_Site SHALL renderować globalną stopkę na każdej trasie publicznej zawierającą lokalizację `Orte, Prowincja Viterbo, Włochy`, link do polityki prywatności oraz informację o kontakcie.
3. WHEN szerokość okna wynosi mniej niż 768 pikseli, THE Public_Site SHALL wyświetlić nawigację w wersji zwijanej (menu mobilne).
4. THE Public_Site SHALL stosować Italian_Flag_Theme w nagłówku i stopce zgodnie z definicją w glosariuszu.

#### Wymaganie 3: Strona błędu i 404

**User Story:** Jako Public_Visitor chcę dostać przyjazny komunikat, gdy trafię pod nieistniejący adres lub coś pójdzie nie tak, żeby móc wrócić na właściwą ścieżkę.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę, która nie istnieje, THE Public_Site SHALL wyświetlić stronę 404 z linkiem powrotu do `/` oraz linkiem do `/apartments`.
2. IF nieobsłużony błąd wystąpi podczas renderowania strony publicznej, THEN THE Public_Site SHALL wyświetlić ogólną stronę błędu z komunikatem w języku polskim oraz linkiem powrotu do `/`.
3. THE Public_Site SHALL logować nieobsłużone błędy renderowania po stronie serwera bez ujawniania szczegółów technicznych Public_Visitor.

### Obszar B: Apartamenty

#### Wymaganie 4: Lista apartamentów

**User Story:** Jako Public_Visitor chcę zobaczyć obie oferty BELLAORTE obok siebie, żeby porównać podstawowe fakty i wybrać ten, który mnie interesuje.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/apartments`, THE Public_Site SHALL wyświetlić wszystkie opublikowane Apartment w liczbie dokładnie 2.
2. WHEN Public_Visitor otwiera trasę `/apartments`, THE Public_Site SHALL na każdej karcie Apartment pokazać nazwę apartamentu, zdjęcie z galerii, liczbę gości, liczbę sypialni, liczbę łazienek oraz status najbliższej dostępności.
3. WHEN Public_Visitor klika kartę Apartment, THE Public_Site SHALL przejść na Apartment_Detail pod adresem `/apartments/[slug]` odpowiadającym wybranemu Apartment.
4. THE Public_Site SHALL wyświetlać listę apartamentów bez żadnych informacji o cenach pobytu.
5. WHERE pole `published_at` Apartment jest puste, THE Public_Site SHALL nie wyświetlać tego Apartment na liście.

#### Wymaganie 5: Szczegół apartamentu

**User Story:** Jako Public_Visitor chcę poznać szczegóły jednego apartamentu i sprawdzić jego dostępność, żeby zdecydować, czy chcę wysłać zapytanie.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/apartments/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić nazwę Apartment, opis, listę udogodnień, zasady pobytu oraz galerię zdjęć z Site_Media.
2. WHEN Public_Visitor otwiera trasę `/apartments/[slug]` z istniejącym slugiem, THE Public_Site SHALL osadzić Availability_Calendar dla tego Apartment.
3. WHEN Public_Visitor otwiera trasę `/apartments/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić CTA prowadzące do `/booking` z preselekcją tego Apartment.
4. IF wartość `[slug]` nie odpowiada żadnemu opublikowanemu Apartment, THEN THE Public_Site SHALL zwrócić odpowiedź 404.
5. THE Public_Site SHALL wyświetlać szczegół apartamentu bez żadnych informacji o cenach pobytu.
6. WHILE pole z realnymi zdjęciami wnętrz Apartment jest puste, THE Public_Site SHALL używać wyłącznie zdjęć Orte, okolicy lub klimatu Włoch zamiast losowych zdjęć wnętrz.

#### Wymaganie 6: Galeria apartamentu

**User Story:** Jako Public_Visitor chcę zobaczyć kilka zdjęć ilustrujących apartament i okolicę, żeby wyrobić sobie wrażenie miejsca.

#### Acceptance Criteria

1. THE Public_Site SHALL wyświetlać dla każdego Apartment_Detail co najmniej 3 zdjęcia z Site_Media.
2. WHEN Public_Visitor klika miniaturę w galerii Apartment_Detail, THE Public_Site SHALL otworzyć powiększony widok wybranego zdjęcia z możliwością zamknięcia.
3. THE Public_Site SHALL wyświetlać każde zdjęcie w galerii z atrybutem `alt` opisującym treść zdjęcia.
4. WHEN szerokość okna wynosi mniej niż 768 pikseli, THE Public_Site SHALL wyświetlać galerię w widoku przewijanym poziomo lub jednokolumnowym.

### Obszar C: Kalendarz dostępności

#### Wymaganie 7: Publiczny kalendarz dostępności

**User Story:** Jako Public_Visitor chcę widzieć w jednym kalendarzu, które terminy dla wybranego apartamentu są wolne, oczekujące, zarezerwowane lub zablokowane, żeby od razu wiedzieć, kiedy mogę przyjechać.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera Availability_Calendar dla wybranego Apartment, THE Public_Site SHALL wyświetlić co najmniej bieżący miesiąc oraz dwa kolejne miesiące w widoku miesięcznym.
2. THE Availability_Calendar SHALL oznaczać każdy dzień jednym z czterech statusów Calendar_Status: `available`, `pending`, `reserved`, `blocked`.
3. THE Availability_Calendar SHALL wyświetlać legendę pokazującą wizualne oznaczenie każdego z czterech statusów Calendar_Status.
4. THE Availability_Calendar SHALL wyznaczać dzień jako `reserved`, gdy mieści się on w zakresie aktywnej Reservation dla tego Apartment.
5. THE Availability_Calendar SHALL wyznaczać dzień jako `blocked`, gdy mieści się on w zakresie aktywnej Calendar_Block dla tego Apartment.
6. THE Availability_Calendar SHALL wyznaczać dzień jako `pending`, gdy mieści się on w zakresie Booking_Inquiry o statusie `pending` dla tego Apartment, a dzień nie jest jednocześnie `reserved` ani `blocked`.
7. THE Availability_Calendar SHALL wyznaczać dzień jako `available`, gdy nie spełnia warunków `reserved`, `blocked` ani `pending`.
8. THE Availability_Calendar SHALL wyświetlać kalendarz publicznie bez żadnych danych osobowych gości (imię, nazwisko, email, telefon, treść wiadomości).
9. WHEN Public_Visitor próbuje zaznaczyć dzień o statusie `reserved` lub `blocked`, THE Availability_Calendar SHALL odrzucić zaznaczenie i wyświetlić komunikat informujący o niedostępności.
10. WHERE Public_Visitor zaznacza dzień o statusie `pending`, THE Availability_Calendar SHALL pozwolić na zaznaczenie i jednocześnie wyświetlić ostrzeżenie, że termin jest tymczasowo zarezerwowany przez innego gościa.
11. WHEN Public_Visitor wybiera zakres dat w Availability_Calendar, THE Public_Site SHALL pozwolić przejść do Booking_Form z preselekcją Apartment, daty przyjazdu i daty wyjazdu.

#### Wymaganie 8: Polityka oczekujących zapytań względem kalendarza

**User Story:** Jako Public_Visitor chcę wiedzieć, że termin może być tymczasowo zajęty przez innego zainteresowanego gościa, żeby nie liczyć na pewność rezerwacji do czasu potwierdzenia przez admina.

#### Acceptance Criteria

1. WHEN Booking_Inquiry zostaje utworzone w Systemie ze statusem `pending`, THE System SHALL od razu uwzględnić ten zakres dat w Availability_Calendar jako `pending` dla wybranego Apartment.
2. WHEN Admin_User zmienia status Booking_Inquiry z `pending` na `rejected` lub `cancelled`, THE System SHALL przestać uwzględniać ten zakres dat w Availability_Calendar jako `pending`.
3. WHEN Admin_User potwierdza Booking_Inquiry tworząc Reservation, THE System SHALL oznaczyć zakres dat jako `reserved` zamiast `pending`.
4. WHILE zakres dat ma jednocześnie status `reserved` i `pending`, THE Availability_Calendar SHALL wyświetlać status `reserved` jako mający pierwszeństwo nad `pending`.
5. WHILE zakres dat ma jednocześnie status `blocked` i `pending`, THE Availability_Calendar SHALL wyświetlać status `blocked` jako mający pierwszeństwo nad `pending`.

### Obszar D: Formularz zapytania/rezerwacji

#### Wymaganie 9: Formularz wyboru dat i danych kontaktowych

**User Story:** Jako Public_Visitor chcę wysłać zapytanie o pobyt podając apartament, daty i moje dane kontaktowe, żeby admin skontaktował się ze mną i potwierdził termin.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/booking`, THE Public_Site SHALL wyświetlić Booking_Form zawierający pola: apartament (wybór jednego z 2), data przyjazdu, data wyjazdu, liczba dorosłych, liczba dzieci, imię i nazwisko, adres email, telefon (opcjonalny), wiadomość (opcjonalna), zgoda na kontakt.
2. THE Booking_Form SHALL oznaczyć jako wymagane pola: apartament, data przyjazdu, data wyjazdu, liczba dorosłych, imię i nazwisko, adres email, zgoda na kontakt.
3. WHEN Public_Visitor wysyła Booking_Form ze wszystkimi wymaganymi polami i poprawnym zakresem dat, THE System SHALL utworzyć Booking_Inquiry o statusie `pending` w bazie danych.
4. WHEN Booking_Inquiry zostanie pomyślnie utworzone, THE Public_Site SHALL przekierować Public_Visitor na trasę `/booking/confirmation`.
5. WHEN Public_Visitor wysyła Booking_Form, THE Booking_Form SHALL nie wyświetlać żadnej ceny ani pola płatności.
6. WHERE Public_Visitor przeszedł do `/booking` z konkretnego Apartment_Detail lub po wybraniu zakresu w Availability_Calendar, THE Booking_Form SHALL preselekcjonować odpowiednio apartament i zakres dat.

#### Wymaganie 10: Walidacja Booking_Form

**User Story:** Jako Public_Visitor chcę dostać czytelne komunikaty, gdy formularz zawiera błędy, żeby móc je szybko poprawić.

#### Acceptance Criteria

1. IF jedno z wymaganych pól Booking_Form jest puste, THEN THE Booking_Form SHALL zablokować wysłanie i wyświetlić komunikat błędu przy każdym pustym polu wymaganym.
2. IF data wyjazdu w Booking_Form jest wcześniejsza lub równa dacie przyjazdu, THEN THE Booking_Form SHALL zablokować wysłanie i wyświetlić komunikat `Data wyjazdu musi być późniejsza niż data przyjazdu`.
3. IF data przyjazdu w Booking_Form jest wcześniejsza niż dzień bieżący, THEN THE Booking_Form SHALL zablokować wysłanie i wyświetlić komunikat `Data przyjazdu nie może być w przeszłości`.
4. IF wartość pola adresu email w Booking_Form nie pasuje do formatu adresu email, THEN THE Booking_Form SHALL zablokować wysłanie i wyświetlić komunikat błędu walidacji email.
5. IF zakres dat w Booking_Form pokrywa się z dniem o statusie `reserved` lub `blocked` dla wybranego Apartment, THEN THE System SHALL odrzucić utworzenie Booking_Inquiry i wyświetlić komunikat `Wybrany termin koliduje z istniejącą rezerwacją lub blokadą`.
6. IF wartość pola `liczba dorosłych` w Booking_Form jest mniejsza niż 1, THEN THE Booking_Form SHALL zablokować wysłanie i wyświetlić komunikat `Wymagana co najmniej 1 osoba dorosła`.
7. IF łączna liczba gości (dorośli + dzieci) w Booking_Form przekracza maksymalną pojemność wybranego Apartment, THEN THE Booking_Form SHALL zablokować wysłanie i wyświetlić komunikat informujący o przekroczeniu pojemności.
8. IF Public_Visitor nie zaznaczył pola zgody na kontakt, THEN THE Booking_Form SHALL zablokować wysłanie i wyświetlić komunikat `Wymagana zgoda na kontakt`.

#### Wymaganie 11: Strona potwierdzenia wysłania

**User Story:** Jako Public_Visitor chcę zobaczyć potwierdzenie, że moje zapytanie zostało wysłane, oraz informację o kolejnych krokach, żeby wiedzieć, czego się spodziewać.

#### Acceptance Criteria

1. WHEN Public_Visitor zostaje przekierowany na trasę `/booking/confirmation`, THE Public_Site SHALL wyświetlić komunikat potwierdzenia wysłania zapytania.
2. THE Booking_Confirmation_Page SHALL informować Public_Visitor, że termin wymaga ręcznego potwierdzenia przez Admin_User i że odpowiedź przyjdzie e-mailem.
3. THE Booking_Confirmation_Page SHALL wyświetlać podsumowanie wysłanego zapytania zawierające nazwę Apartment, datę przyjazdu, datę wyjazdu oraz liczbę gości.
4. THE Booking_Confirmation_Page SHALL nie wyświetlać żadnej ceny ani danych płatności.
5. THE Booking_Confirmation_Page SHALL zawierać linki powrotne do `/` oraz `/apartments`.

#### Wymaganie 12: Ochrona endpointu wysyłki zapytań

**User Story:** Jako Admin_User chcę, żeby endpoint przyjmujący zapytania był odporny na nadużycia, żeby spam i boty nie zaśmiecały panelu rezerwacji.

#### Acceptance Criteria

1. THE System SHALL eksponować trasę `POST /api/booking-inquiries` jako jedyną drogę utworzenia Booking_Inquiry przez Public_Visitor.
2. WHEN trasa `POST /api/booking-inquiries` otrzymuje żądanie, THE System SHALL walidować ładunek tymi samymi regułami co Booking_Form po stronie serwera.
3. IF ładunek żądania `POST /api/booking-inquiries` nie spełnia walidacji, THEN THE System SHALL zwrócić odpowiedź ze statusem 400 oraz polem błędu opisującym przyczynę odrzucenia.
4. THE System SHALL ograniczyć liczbę żądań `POST /api/booking-inquiries` z jednego adresu IP do maksymalnie 10 żądań w ciągu 10 minut.
5. WHEN limit żądań z jednego adresu IP zostaje przekroczony, THE System SHALL zwrócić odpowiedź ze statusem 429.

### Obszar E: Przewodnik turystyczny i restauracje

#### Wymaganie 13: Hub przewodnika

**User Story:** Jako Public_Visitor chcę z jednego miejsca dostać się do restauracji, miejsc, sekcji Rzym i przydatnych informacji, żeby szybko znaleźć inspirację na pobyt.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/guide`, THE Public_Site SHALL wyświetlić Guide_Hub z linkami do `/restaurants`, `/places`, `/rome` i `/useful-info`.
2. WHEN Public_Visitor otwiera trasę `/guide`, THE Public_Site SHALL wyświetlić co najmniej krótki opis dla każdej z czterech sekcji przewodnika.
3. WHEN Public_Visitor otwiera trasę `/guide`, THE Public_Site SHALL wyświetlić wybrane karty z najnowszymi lub polecanymi Restaurant i Attraction.

#### Wymaganie 14: Lista restauracji w Orte i okolicy

**User Story:** Jako Public_Visitor chcę zobaczyć listę polecanych restauracji w Orte i okolicy, żeby wybrać miejsce na obiad lub kolację.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/restaurants`, THE Public_Site SHALL wyświetlić wszystkie opublikowane Restaurant z regionu Orte i okolicy.
2. THE Public_Site SHALL wyświetlać dla każdego Restaurant na liście nazwę, miniaturę zdjęcia, krótki opis administratora, kategorie kuchni oraz średnią ocenę z opublikowanych Review.
3. WHEN Public_Visitor klika kartę Restaurant, THE Public_Site SHALL przejść na trasę `/restaurants/[slug]` odpowiadającą wybranemu Restaurant.
4. THE Public_Site SHALL wyświetlać listę restauracji z możliwością filtrowania po co najmniej kategorii kuchni oraz tagach.
5. WHERE Restaurant nie ma żadnej opublikowanej Review, THE Public_Site SHALL wyświetlić oznaczenie `Brak ocen` zamiast średniej oceny.

#### Wymaganie 15: Szczegół restauracji

**User Story:** Jako Public_Visitor chcę zobaczyć szczegółową stronę restauracji z opisem, mapą, opiniami gości i zdjęciami, żeby zdecydować, czy chcę tam pójść.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/restaurants/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić nazwę Restaurant, opis administratora, kategorie kuchni, tagi, godziny otwarcia, telefon, link do strony www oraz wskazówkę dla gościa.
2. WHEN Public_Visitor otwiera trasę `/restaurants/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić Map_Data Restaurant w formie linku do Google Maps oraz osadzonej mapy lub statycznego widoku korzystającego ze współrzędnych.
3. WHEN Public_Visitor otwiera trasę `/restaurants/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić listę Review o statusie `approved` posortowanych od najnowszych.
4. WHEN Public_Visitor otwiera trasę `/restaurants/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić galerię złożoną ze zdjęć administratora z Site_Media oraz Guest_Photo o statusie `approved`.
5. WHEN Public_Visitor otwiera trasę `/restaurants/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić formularz dodania Review oraz Guest_Photo dla tej restauracji.
6. IF wartość `[slug]` nie odpowiada żadnemu opublikowanemu Restaurant, THEN THE Public_Site SHALL zwrócić odpowiedź 404.

### Obszar F: Miejsca do zwiedzania

#### Wymaganie 16: Lista miejsc do zwiedzania

**User Story:** Jako Public_Visitor chcę zobaczyć listę polecanych miejsc do zwiedzania w Orte i okolicy, żeby zaplanować, co zobaczyć podczas pobytu.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/places`, THE Public_Site SHALL wyświetlić wszystkie opublikowane Attraction z regionu Orte i okolicy.
2. THE Public_Site SHALL wyświetlać dla każdej Attraction na liście nazwę, miniaturę zdjęcia, krótki opis administratora, informację dojazdową lub odległość oraz średnią ocenę z opublikowanych Review.
3. WHEN Public_Visitor klika kartę Attraction, THE Public_Site SHALL przejść na trasę `/places/[slug]` odpowiadającą wybranej Attraction.
4. THE Public_Site SHALL wyświetlać listę miejsc z możliwością filtrowania po tagach.

#### Wymaganie 17: Szczegół miejsca

**User Story:** Jako Public_Visitor chcę zobaczyć szczegółową stronę miejsca z opisem, mapą, wskazówkami praktycznymi i opiniami, żeby wiedzieć czego się spodziewać.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/places/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić nazwę Attraction, opis administratora, tagi oraz wskazówki praktyczne (godziny zwiedzania, bilety, dostępność).
2. WHEN Public_Visitor otwiera trasę `/places/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić Map_Data Attraction w formie linku do Google Maps oraz osadzonej mapy lub statycznego widoku korzystającego ze współrzędnych.
3. WHEN Public_Visitor otwiera trasę `/places/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić listę Review o statusie `approved` posortowanych od najnowszych.
4. WHEN Public_Visitor otwiera trasę `/places/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić galerię złożoną ze zdjęć administratora z Site_Media oraz Guest_Photo o statusie `approved`.
5. WHEN Public_Visitor otwiera trasę `/places/[slug]` z istniejącym slugiem, THE Public_Site SHALL wyświetlić formularz dodania Review oraz Guest_Photo dla tego miejsca.
6. IF wartość `[slug]` nie odpowiada żadnej opublikowanej Attraction, THEN THE Public_Site SHALL zwrócić odpowiedź 404.

### Obszar G: Sekcja RZYM

#### Wymaganie 18: Hub sekcji Rzym

**User Story:** Jako Public_Visitor planujący wycieczkę do Rzymu chcę mieć dedykowany hub z restauracjami, miejscami, planem zwiedzania i informacjami praktycznymi, żeby zaplanować wypad jednodniowy lub kilkudniowy.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/rome`, THE Public_Site SHALL wyświetlić Rome_Section z linkami do `/rome/restaurants`, `/rome/places`, `/rome/itinerary` i `/rome/info`.
2. WHEN Public_Visitor otwiera trasę `/rome`, THE Public_Site SHALL wyświetlić co najmniej krótki opis dla każdej z czterech podstron Rzymu.
3. WHEN Public_Visitor otwiera trasę `/rome`, THE Public_Site SHALL wyświetlić informację o orientacyjnym czasie i sposobie dojazdu z Orte do Rzymu (pociąg, samochód).

#### Wymaganie 19: Restauracje i miejsca w Rzymie

**User Story:** Jako Public_Visitor chcę zobaczyć polecane restauracje i miejsca w Rzymie z mapą i opiniami, żeby zaplanować jedzenie i zwiedzanie w trakcie wycieczki.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/rome/restaurants`, THE Public_Site SHALL wyświetlić wszystkie opublikowane Restaurant oznaczone jako leżące w regionie Rzym.
2. WHEN Public_Visitor otwiera trasę `/rome/places`, THE Public_Site SHALL wyświetlić wszystkie opublikowane Attraction oznaczone jako leżące w regionie Rzym.
3. THE Public_Site SHALL stosować dla podstron Rzymu te same reguły szczegółu, mapy, galerii i Review co dla `/restaurants/[slug]` i `/places/[slug]`.
4. THE Public_Site SHALL stosować ten sam region (Orte i okolica vs Rzym) jako filtr listy zarówno na `/restaurants` i `/places` jak i na `/rome/restaurants` i `/rome/places`, żeby treść nie powielała się między sekcjami.

#### Wymaganie 20: Plan zwiedzania Rzymu

**User Story:** Jako Public_Visitor chcę zobaczyć gotowy plan zwiedzania Rzymu, żeby nie tracić czasu na układanie własnej trasy.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/rome/itinerary`, THE Public_Site SHALL wyświetlić co najmniej jeden plan zwiedzania w formie uporządkowanej listy punktów (poranek, południe, popołudnie, wieczór) oraz krótki opis każdego punktu.
2. WHEN Public_Visitor otwiera trasę `/rome/itinerary`, THE Public_Site SHALL linkować z każdego punktu planu, gdy to możliwe, do odpowiadającej Attraction lub Restaurant w Rome_Section.
3. WHERE plan zwiedzania zawiera lokalizacje, THE Public_Site SHALL wyświetlać Map_Data dla każdej z lokalizacji.

#### Wymaganie 21: Praktyczne informacje o Rzymie

**User Story:** Jako Public_Visitor chcę zobaczyć praktyczne informacje o Rzymie (transport, bilety, bezpieczeństwo), żeby uniknąć typowych pułapek turystycznych.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/rome/info`, THE Public_Site SHALL wyświetlić sekcje informacyjne obejmujące co najmniej: dojazd z Orte, transport miejski w Rzymie, bilety i wstępy, bezpieczeństwo, godziny atrakcji.
2. THE Public_Site SHALL pozwalać Admin_User na edycję każdej sekcji informacyjnej `/rome/info` przez Admin_Panel bez zmian w kodzie.

### Obszar H: Przydatne informacje

#### Wymaganie 22: Przydatne informacje praktyczne

**User Story:** Jako Public_Visitor chcę zobaczyć praktyczne informacje o wynajmie samochodu, dojeździe do Rzymu, pociągach i kierunkach podróży, żeby sprawnie zaplanować logistykę pobytu.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/useful-info`, THE Public_Site SHALL wyświetlić sekcje obejmujące co najmniej: wynajem samochodu, dojazd do Rzymu, pociągi, możliwe kierunki podróży z Orte.
2. WHEN Public_Visitor otwiera trasę `/useful-info`, THE Public_Site SHALL wyświetlić każdą sekcję jako Travel_Info z tytułem, treścią opisową i opcjonalnymi linkami zewnętrznymi.
3. THE Public_Site SHALL pozwalać Admin_User na dodawanie, edycję, zmianę kolejności i usuwanie pozycji Travel_Info przez Admin_Panel.
4. WHEN Public_Visitor klika link zewnętrzny w Travel_Info, THE Public_Site SHALL otworzyć link w nowej karcie z atrybutem `rel="noopener noreferrer"`.

### Obszar I: Opinie, oceny i zdjęcia gości

#### Wymaganie 23: Dodawanie opinii do restauracji, miejsc i treści Rzym

**User Story:** Jako Guest_Contributor chcę zostawić opinię z oceną i komentarzem o restauracji lub miejscu, żeby pomóc innym gościom w wyborze.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera szczegół Restaurant lub Attraction (włącznie z odpowiednikami w Rome_Section), THE Public_Site SHALL wyświetlić formularz dodania Review zawierający pola: podpis (imię), ocena 1–5, treść komentarza, opcjonalne zdjęcie, zgoda na publikację.
2. THE Review SHALL wymagać podpisu o długości od 2 do 60 znaków oraz treści o długości od 10 do 1000 znaków.
3. THE Review SHALL wymagać oceny będącej liczbą całkowitą z zakresu 1–5.
4. WHEN Guest_Contributor wysyła formularz Review, THE System SHALL utworzyć Review przypięte do odpowiedniego Restaurant lub Attraction.
5. IF formularz Review nie spełnia walidacji długości, oceny lub zgody na publikację, THEN THE Public_Site SHALL zablokować wysłanie i wyświetlić komunikat błędu przy każdym niepoprawnym polu.
6. THE System SHALL eksponować trasę `POST /api/reviews` jako jedyną drogę utworzenia Review przez Guest_Contributor.
7. THE System SHALL ograniczyć liczbę żądań `POST /api/reviews` z jednego adresu IP do maksymalnie 20 żądań w ciągu 60 minut.

#### Wymaganie 24: Dodawanie zdjęć gości

**User Story:** Jako Guest_Contributor chcę dodać zdjęcie restauracji lub miejsca, żeby pokazać innym, jak wygląda lokal lub atrakcja.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera szczegół Restaurant lub Attraction, THE Public_Site SHALL pozwalać dodać Guest_Photo opcjonalnie razem z Review lub jako osobny upload.
2. THE Public_Site SHALL akceptować pliki Guest_Photo wyłącznie w formacie JPEG, PNG lub WebP.
3. THE Public_Site SHALL odrzucać pliki Guest_Photo o rozmiarze przekraczającym 8 megabajtów.
4. WHEN Guest_Contributor wysyła Guest_Photo, THE System SHALL zapisać plik w buckecie Guest_Media oraz utworzyć rekord Guest_Photo z odwołaniem do pliku.
5. IF plik Guest_Photo nie spełnia wymagań formatu lub rozmiaru, THEN THE Public_Site SHALL zablokować wysłanie i wyświetlić komunikat błędu opisujący dozwolone formaty i limit rozmiaru.
6. THE System SHALL eksponować trasę `POST /api/guest-photos` jako jedyną drogę utworzenia Guest_Photo przez Guest_Contributor.

#### Wymaganie 25: Moderacja treści gości

**User Story:** Jako Admin_User chcę, żeby każda nowa opinia i zdjęcie wchodziły z statusem oczekującym i były publicznie widoczne dopiero po mojej zgodzie, żeby kontrolować jakość treści na stronie.

#### Acceptance Criteria

1. WHEN Review zostaje utworzone przez Guest_Contributor, THE System SHALL nadać mu Moderation_Status `pending`.
2. WHEN Guest_Photo zostaje utworzone przez Guest_Contributor, THE System SHALL nadać mu Moderation_Status `pending`.
3. THE Public_Site SHALL wyświetlać publicznie wyłącznie Review oraz Guest_Photo o Moderation_Status `approved`.
4. WHEN Guest_Contributor pomyślnie wysyła Review lub Guest_Photo, THE Public_Site SHALL wyświetlić komunikat informujący, że treść oczekuje na moderację administratora.
5. WHEN Admin_User zmienia Moderation_Status Review lub Guest_Photo na `approved`, THE System SHALL od tej chwili udostępniać tę treść publicznie.
6. WHEN Admin_User zmienia Moderation_Status Review lub Guest_Photo na `rejected` lub `hidden`, THE System SHALL nie udostępniać tej treści publicznie.
7. THE System SHALL liczyć średnią ocenę Restaurant lub Attraction wyłącznie z Review o Moderation_Status `approved`.

### Obszar J: Panel admina

#### Wymaganie 26: Logowanie do panelu admina

**User Story:** Jako Admin_User chcę zalogować się do panelu administracyjnego adresem email i hasłem, żeby mieć dostęp do zarządzania stroną.

#### Acceptance Criteria

1. WHEN Public_Visitor otwiera trasę `/admin` bez aktywnej sesji, THE Admin_Panel SHALL przekierować Public_Visitor na ekran logowania.
2. THE Admin_Panel SHALL wymagać uwierzytelnienia przez Supabase Auth dla każdej trasy zaczynającej się od `/admin`.
3. WHEN Admin_User podaje poprawny email i hasło, THE Admin_Panel SHALL utworzyć aktywną sesję i przekierować na `/admin`.
4. IF Admin_User podaje błędny email lub hasło, THEN THE Admin_Panel SHALL wyświetlić komunikat `Nieprawidłowy email lub hasło` bez ujawniania, które z pól było błędne.
5. WHEN Admin_User wybiera akcję wylogowania, THE Admin_Panel SHALL zakończyć aktywną sesję i przekierować na ekran logowania.
6. THE System SHALL ograniczyć liczbę nieudanych prób logowania z jednego adresu IP do maksymalnie 5 prób w ciągu 15 minut.

#### Wymaganie 27: Dashboard admina

**User Story:** Jako Admin_User chcę po zalogowaniu zobaczyć podsumowanie najważniejszych spraw, żeby od razu wiedzieć, co wymaga mojej uwagi.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin`, THE Admin_Panel SHALL wyświetlić liczbę nowych Booking_Inquiry o statusie `pending` z odsyłaczem do `/admin/reservations`.
2. WHEN Admin_User otwiera trasę `/admin`, THE Admin_Panel SHALL wyświetlić liczbę Review o Moderation_Status `pending` z odsyłaczem do `/admin/reviews`.
3. WHEN Admin_User otwiera trasę `/admin`, THE Admin_Panel SHALL wyświetlić liczbę Guest_Photo o Moderation_Status `pending` z odsyłaczem do `/admin/photos`.
4. WHEN Admin_User otwiera trasę `/admin`, THE Admin_Panel SHALL wyświetlić listę najbliższych aktywnych Reservation z datami i nazwą Apartment.
5. WHEN Admin_User otwiera trasę `/admin`, THE Admin_Panel SHALL wyświetlić skróty (linki) do każdej sekcji panelu admina.

#### Wymaganie 28: Zarządzanie apartamentami

**User Story:** Jako Admin_User chcę zarządzać 2 apartamentami (nazwa, opis, udogodnienia, galeria, status publikacji), żeby aktualizować ofertę bez edycji kodu.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin/apartments`, THE Admin_Panel SHALL wyświetlić listę wszystkich Apartment z nazwą, slugiem i statusem publikacji.
2. WHEN Admin_User edytuje istniejący Apartment w Admin_Panel, THE Admin_Panel SHALL pozwalać zmieniać nazwę, slug, opis, udogodnienia, zasady pobytu, maksymalną liczbę gości, liczbę sypialni, liczbę łazienek oraz status publikacji.
3. WHEN Admin_User dodaje zdjęcie do galerii Apartment, THE Admin_Panel SHALL wgrać plik do bucketa Site_Media i utworzyć rekord GalleryPhoto.
4. WHEN Admin_User usuwa zdjęcie z galerii Apartment, THE Admin_Panel SHALL usunąć powiązanie GalleryPhoto i plik z Site_Media.
5. WHEN Admin_User zapisuje zmiany Apartment, THE Admin_Panel SHALL walidować unikalność slugu w obrębie wszystkich Apartment.
6. THE Admin_Panel SHALL ograniczyć liczbę Apartment do dokładnie 2 — Admin_User SHALL móc edytować istniejące apartamenty, ale Admin_Panel SHALL nie pozwalać dodać trzeciego ani usunąć żadnego z dwóch.
7. THE Admin_Panel SHALL nie wystawiać żadnego pola ceny na ekranach edycji Apartment.

#### Wymaganie 29: Zarządzanie kalendarzem i blokadami

**User Story:** Jako Admin_User chcę widzieć i edytować kalendarz każdego apartamentu, włącznie z dodawaniem ręcznych blokad, żeby kontrolować, kiedy apartament jest niedostępny.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin/calendar`, THE Admin_Panel SHALL wyświetlić kalendarz wybranego Apartment z czterema statusami Calendar_Status oraz danymi rezerwacji widocznymi po kliknięciu zakresu.
2. WHEN Admin_User dodaje Calendar_Block, THE Admin_Panel SHALL wymagać wyboru Apartment, daty rozpoczęcia, daty zakończenia oraz powodu blokady (np. pobyt prywatny, remont, sprzątanie).
3. IF dodawana Calendar_Block koliduje z istniejącą aktywną Reservation, THEN THE Admin_Panel SHALL odrzucić zapis i wyświetlić komunikat o konflikcie z istniejącą rezerwacją.
4. WHEN Admin_User edytuje lub usuwa Calendar_Block, THE Admin_Panel SHALL natychmiast zaktualizować Availability_Calendar dla tego Apartment.
5. THE Admin_Panel SHALL pozwalać Admin_User na zmianę widoku kalendarza między miesięcznym a listą zakresów.

#### Wymaganie 30: Zarządzanie zapytaniami i rezerwacjami

**User Story:** Jako Admin_User chcę widzieć wszystkie zapytania i rezerwacje, żeby je potwierdzać, odrzucać lub anulować w zależności od decyzji.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin/reservations`, THE Admin_Panel SHALL wyświetlić tabelę Booking_Inquiry zawierającą datę zgłoszenia, Apartment, zakres dat, liczbę gości, dane kontaktowe oraz status.
2. THE Admin_Panel SHALL pozwalać Admin_User filtrować Booking_Inquiry po statusie (`pending`, `confirmed`, `rejected`, `cancelled`) oraz po Apartment.
3. WHEN Admin_User zatwierdza Booking_Inquiry, THE Admin_Panel SHALL utworzyć Reservation z odpowiadającym Apartment, zakresem dat i danymi gościa, oraz ustawić status Booking_Inquiry na `confirmed`.
4. WHEN Admin_User odrzuca Booking_Inquiry, THE Admin_Panel SHALL ustawić jego status na `rejected`.
5. WHEN Admin_User anuluje istniejącą Reservation, THE Admin_Panel SHALL oznaczyć Reservation jako nieaktywną oraz natychmiast zwolnić zakres dat w Availability_Calendar.
6. IF zatwierdzenie Booking_Inquiry spowodowałoby konflikt z istniejącą aktywną Reservation lub Calendar_Block, THEN THE Admin_Panel SHALL zablokować potwierdzenie i wyświetlić komunikat o konflikcie.
7. THE Admin_Panel SHALL wyświetlać dane kontaktowe gościa (imię, nazwisko, email, telefon, wiadomość) wyłącznie wewnątrz Admin_Panel i SHALL nie ujawniać ich na żadnej trasie publicznej.
8. THE Admin_Panel SHALL pozwalać Admin_User dodać prywatną notatkę do Booking_Inquiry oraz Reservation.

#### Wymaganie 31: Zarządzanie restauracjami

**User Story:** Jako Admin_User chcę dodawać i edytować polecane restauracje wraz z danymi mapowymi i zdjęciami, żeby utrzymywać aktualny przewodnik kulinarny.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin/restaurants`, THE Admin_Panel SHALL wyświetlić listę wszystkich Restaurant z nazwą, regionem (Orte i okolica / Rzym), statusem publikacji oraz średnią oceną z opublikowanych Review.
2. WHEN Admin_User tworzy lub edytuje Restaurant, THE Admin_Panel SHALL pozwalać ustawiać: nazwę, slug, region (Orte i okolica / Rzym), opis, kategorie kuchni, tagi, wskazówkę dla gościa, godziny otwarcia, telefon, link do strony www, status publikacji oraz Map_Data (adres, Google Place ID, link Google Maps, współrzędne).
3. WHEN Admin_User dodaje zdjęcie do Restaurant, THE Admin_Panel SHALL wgrać plik do bucketa Site_Media i utworzyć powiązanie GalleryPhoto z Restaurant.
4. WHEN Admin_User zmienia status publikacji Restaurant na nieopublikowany, THE Public_Site SHALL przestać wyświetlać Restaurant na liście publicznej oraz na stronie szczegółu.
5. WHEN Admin_User usuwa Restaurant, THE Admin_Panel SHALL wymagać potwierdzenia oraz oznaczyć powiązane Review i Guest_Photo jako odłączone (soft-delete) zamiast nieodwracalnie usuwać dane.
6. THE Admin_Panel SHALL walidować unikalność slugu Restaurant w obrębie wszystkich Restaurant.

#### Wymaganie 32: Zarządzanie miejscami do zwiedzania

**User Story:** Jako Admin_User chcę dodawać i edytować polecane miejsca do zwiedzania wraz z mapą i zdjęciami, żeby utrzymywać aktualny przewodnik atrakcji.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin/places`, THE Admin_Panel SHALL wyświetlić listę wszystkich Attraction z nazwą, regionem (Orte i okolica / Rzym), statusem publikacji oraz średnią oceną z opublikowanych Review.
2. WHEN Admin_User tworzy lub edytuje Attraction, THE Admin_Panel SHALL pozwalać ustawiać: nazwę, slug, region (Orte i okolica / Rzym), opis, tagi, wskazówki praktyczne, informację dojazdową, status publikacji oraz Map_Data (adres, Google Place ID, link Google Maps, współrzędne).
3. WHEN Admin_User dodaje zdjęcie do Attraction, THE Admin_Panel SHALL wgrać plik do bucketa Site_Media i utworzyć powiązanie GalleryPhoto z Attraction.
4. WHEN Admin_User zmienia status publikacji Attraction na nieopublikowany, THE Public_Site SHALL przestać wyświetlać Attraction na liście publicznej oraz na stronie szczegółu.
5. WHEN Admin_User usuwa Attraction, THE Admin_Panel SHALL wymagać potwierdzenia oraz oznaczyć powiązane Review i Guest_Photo jako odłączone zamiast nieodwracalnie usuwać dane.
6. THE Admin_Panel SHALL walidować unikalność slugu Attraction w obrębie wszystkich Attraction.

#### Wymaganie 33: Zarządzanie treściami sekcji Rzym

**User Story:** Jako Admin_User chcę edytować plan zwiedzania Rzymu i informacje praktyczne o Rzymie, żeby utrzymywać aktualny hub turystyczny dla gości.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin/rome`, THE Admin_Panel SHALL pozwalać zarządzać planem zwiedzania (`/rome/itinerary`) jako uporządkowaną listą punktów (poranek, południe, popołudnie, wieczór) z opisem i opcjonalnym powiązaniem z Restaurant lub Attraction.
2. WHEN Admin_User otwiera trasę `/admin/rome`, THE Admin_Panel SHALL pozwalać zarządzać sekcjami informacyjnymi (`/rome/info`): dojazd z Orte, transport miejski, bilety i wstępy, bezpieczeństwo, godziny atrakcji.
3. WHEN Admin_User zapisuje zmiany w treściach Rome_Section, THE Public_Site SHALL natychmiast odzwierciedlić zmiany na odpowiednich trasach `/rome/itinerary` i `/rome/info`.
4. THE Admin_Panel SHALL pozwalać Admin_User dodawać, zmieniać kolejność i usuwać punkty planu zwiedzania.

#### Wymaganie 34: Zarządzanie przydatnymi informacjami

**User Story:** Jako Admin_User chcę zarządzać sekcjami przydatnych informacji (`/useful-info`), żeby aktualizować praktyczne wskazówki bez edycji kodu.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin/useful-info`, THE Admin_Panel SHALL wyświetlić listę pozycji Travel_Info z tytułem, kategorią i statusem publikacji.
2. WHEN Admin_User tworzy lub edytuje pozycję Travel_Info, THE Admin_Panel SHALL pozwalać ustawiać: tytuł, kategorię (wynajem samochodu / dojazd do Rzymu / pociągi / kierunki podróży), treść, opcjonalne linki zewnętrzne oraz status publikacji.
3. WHEN Admin_User zmienia kolejność pozycji Travel_Info, THE Public_Site SHALL natychmiast odzwierciedlić nową kolejność na trasie `/useful-info`.
4. WHEN Admin_User usuwa pozycję Travel_Info, THE Admin_Panel SHALL wymagać potwierdzenia oraz przestać wyświetlać tę pozycję na trasie `/useful-info`.

#### Wymaganie 35: Moderacja opinii

**User Story:** Jako Admin_User chcę przeglądać kolejkę opinii oczekujących na moderację, żeby zatwierdzać, odrzucać lub ukrywać treści.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin/reviews`, THE Admin_Panel SHALL wyświetlić listę Review wraz z Moderation_Status, podpisem, oceną, treścią oraz powiązanym Restaurant lub Attraction.
2. THE Admin_Panel SHALL pozwalać Admin_User filtrować Review po Moderation_Status, ocenie i powiązanym obiekcie.
3. WHEN Admin_User zmienia Moderation_Status Review, THE Admin_Panel SHALL pozwalać wybrać jeden ze statusów: `approved`, `rejected`, `hidden`.
4. WHEN Admin_User zatwierdza Review (`approved`), THE Public_Site SHALL natychmiast wyświetlić Review na stronie szczegółu odpowiedniego Restaurant lub Attraction.
5. WHEN Admin_User odrzuca lub ukrywa Review (`rejected` lub `hidden`), THE Public_Site SHALL natychmiast przestać wyświetlać Review publicznie.

#### Wymaganie 36: Moderacja zdjęć gości

**User Story:** Jako Admin_User chcę przeglądać kolejkę zdjęć od gości, żeby zatwierdzać tylko te zgodne z charakterem strony.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin/photos`, THE Admin_Panel SHALL wyświetlić listę Guest_Photo wraz z Moderation_Status, miniaturą zdjęcia oraz powiązanym Restaurant lub Attraction.
2. THE Admin_Panel SHALL pozwalać Admin_User filtrować Guest_Photo po Moderation_Status oraz po powiązanym obiekcie.
3. WHEN Admin_User zmienia Moderation_Status Guest_Photo, THE Admin_Panel SHALL pozwalać wybrać jeden ze statusów: `approved`, `rejected`, `hidden`.
4. WHEN Admin_User zatwierdza Guest_Photo (`approved`), THE Public_Site SHALL natychmiast dołączyć zdjęcie do galerii odpowiedniego Restaurant lub Attraction.
5. WHEN Admin_User odrzuca lub ukrywa Guest_Photo (`rejected` lub `hidden`), THE Public_Site SHALL natychmiast przestać wyświetlać zdjęcie publicznie.
6. WHEN Admin_User trwale usuwa Guest_Photo, THE Admin_Panel SHALL wymagać potwierdzenia, usunąć rekord z bazy oraz plik z bucketa Guest_Media.

#### Wymaganie 37: Ustawienia strony

**User Story:** Jako Admin_User chcę zmieniać podstawowe ustawienia strony (kontakt, lokalizacja, treści zaufania), żeby utrzymać dane bez wdrożeń.

#### Acceptance Criteria

1. WHEN Admin_User otwiera trasę `/admin/settings`, THE Admin_Panel SHALL pozwalać edytować: adres email kontaktowy, telefon kontaktowy, adres lokalizacji widoczny w stopce, treść polityki prywatności oraz teksty zgód formularzy.
2. WHEN Admin_User zapisuje ustawienia, THE Public_Site SHALL natychmiast odzwierciedlić zmiany na każdej publicznej trasie.
3. THE Admin_Panel SHALL walidować, że adres email kontaktowy ma poprawny format adresu email.

#### Wymaganie 38: Ochrona endpointów panelu admina

**User Story:** Jako Admin_User chcę, żeby operacje administracyjne były zabezpieczone po stronie serwera, żeby nikt nieuprawniony nie mógł zmienić treści ani rezerwacji.

#### Acceptance Criteria

1. THE System SHALL wymagać aktywnej sesji Supabase Auth należącej do Admin_User dla każdej operacji `PATCH`, `POST`, `PUT`, `DELETE` pod prefiksem `/api/admin/`.
2. IF żądanie pod `/api/admin/*` nie zawiera ważnej sesji Admin_User, THEN THE System SHALL zwrócić odpowiedź ze statusem 401 i nie wykonać żadnej operacji.
3. THE System SHALL stosować polityki Row Level Security w Supabase tak, że publicznie czytelne są wyłącznie pola opisane w wymaganiach kalendarza, listy/szczegółu apartamentu, restauracji, miejsc, treści Rzym, przydatnych informacji oraz Review/Guest_Photo o statusie `approved`.
4. THE System SHALL nie pozwalać żadnemu zapytaniu publicznemu odczytać pól zawierających dane osobowe gości (imię, nazwisko, email, telefon, treść wiadomości) z Booking_Inquiry, Reservation ani Guest.

### Obszar K: Storage, media i mapy

#### Wymaganie 39: Buckety i metadane mediów

**User Story:** Jako Admin_User chcę mieć rozdzielone storage dla zdjęć strony i zdjęć gości, żeby kontrolować widoczność i moderację każdego rodzaju mediów.

#### Acceptance Criteria

1. THE System SHALL utworzyć bucket Site_Media w Supabase Storage przeznaczony na zdjęcia apartamentów, restauracji, miejsc i sekcji Rzym wgrywane przez Admin_User.
2. THE System SHALL utworzyć bucket Guest_Media w Supabase Storage przeznaczony na zdjęcia wgrywane przez Guest_Contributor.
3. THE System SHALL pozwalać czytać pliki bucketa Site_Media bez autoryzacji oraz wymagać autoryzacji Admin_User do operacji zapisu i usuwania.
4. THE System SHALL pozwalać czytać pliki bucketa Guest_Media bez autoryzacji wyłącznie dla rekordów Guest_Photo o Moderation_Status `approved`; pliki o innych statusach SHALL nie być dostępne publicznie.
5. THE System SHALL przechowywać metadane mediów (źródło, autor, data wgrania, powiązanie z Apartment / Restaurant / Attraction / Review) w tabeli `media_assets` lub równoważnym modelu danych.

#### Wymaganie 40: Polityka zdjęć placeholderowych

**User Story:** Jako właściciel BELLAORTE chcę mieć pewność, że dopóki nie dostarczę realnych zdjęć wnętrz, strona używa wyłącznie zdjęć Orte, okolicy i klimatu Włoch, żeby nie wprowadzać gości w błąd.

#### Acceptance Criteria

1. THE Public_Site SHALL nigdy nie używać losowych zdjęć wnętrz mieszkań jako zdjęć Apartment dopóki Admin_User nie wgra realnych zdjęć wnętrz oznaczonych jako autentyczne.
2. WHILE galeria Apartment nie zawiera żadnego rekordu GalleryPhoto oznaczonego jako `interior_real`, THE Public_Site SHALL używać dla galerii Apartment wyłącznie GalleryPhoto oznaczonych jako zdjęcia Orte, okolicy lub klimatu Włoch.
3. THE Admin_Panel SHALL pozwalać Admin_User oznaczyć każde GalleryPhoto jednym ze źródeł: `placeholder_orte`, `placeholder_italy`, `placeholder_rome`, `interior_real`, `exterior_real`.

#### Wymaganie 41: Integracja z Google Maps dla restauracji i miejsc

**User Story:** Jako Public_Visitor chcę zobaczyć każdą restaurację i każde miejsce na mapie z linkiem do Google Maps, żeby łatwo zaplanować dojazd.

#### Acceptance Criteria

1. WHEN Admin_User edytuje Restaurant lub Attraction, THE Admin_Panel SHALL wymagać Map_Data zawierających adres oraz przynajmniej jedno z: Google Place ID albo współrzędne (szerokość i długość geograficzna).
2. WHEN Public_Visitor otwiera szczegół Restaurant lub Attraction posiadający Map_Data, THE Public_Site SHALL wyświetlić link `Otwórz w Google Maps` budowany ze współrzędnych lub Google Place ID.
3. WHEN Public_Visitor otwiera szczegół Restaurant lub Attraction posiadający współrzędne, THE Public_Site SHALL wyświetlić osadzoną mapę lub statyczny obraz mapy zlokalizowany na tych współrzędnych.
4. THE System SHALL ładować integrację z Google Maps wyłącznie z kluczem API ograniczonym do domeny produkcyjnej oraz domeny lokalnej dewelopera.
5. IF Map_Data restauracji lub miejsca jest niepełne (brak adresu i brak współrzędnych i brak Google Place ID), THEN THE Public_Site SHALL wyświetlić tylko adres tekstowy bez mapy ani linku Google Maps.

### Obszar L: Bezpieczeństwo, prywatność i zgodność

#### Wymaganie 42: Ochrona danych osobowych gości

**User Story:** Jako Public_Visitor wysyłający zapytanie chcę mieć pewność, że moje dane kontaktowe nie są publicznie widoczne na stronie, żeby chronić swoją prywatność.

#### Acceptance Criteria

1. THE Public_Site SHALL nigdy nie wyświetlać imienia, nazwiska, adresu email, numeru telefonu ani treści wiadomości Booking_Inquiry, Reservation ani Guest.
2. THE Availability_Calendar SHALL wyświetlać dla każdego dnia wyłącznie Calendar_Status bez żadnych danych identyfikujących gościa rezerwującego.
3. THE Public_Site SHALL wyświetlać dla każdej Review wyłącznie podpis podany przez Guest_Contributor, ocenę, treść komentarza i opcjonalne zdjęcie, bez żadnych innych danych kontaktowych.
4. WHEN Guest_Contributor wysyła Review lub Guest_Photo, THE System SHALL nie wymagać podania adresu email ani innych danych kontaktowych poza podpisem.

#### Wymaganie 43: Zgody i polityka prywatności

**User Story:** Jako Public_Visitor chcę widzieć politykę prywatności i wyrazić zgodę na kontakt, gdy wysyłam zapytanie, żeby świadomie udostępnić swoje dane.

#### Acceptance Criteria

1. THE Public_Site SHALL udostępniać politykę prywatności pod osobnym adresem podlinkowanym ze stopki na każdej publicznej trasie.
2. THE Booking_Form SHALL zawierać pole zgody na kontakt z linkiem do polityki prywatności.
3. THE formularz Review SHALL zawierać oświadczenie o publikacji podpisu i komentarza zgodnie z polityką prywatności.
4. THE formularz Guest_Photo SHALL zawierać oświadczenie, że Guest_Contributor posiada prawa do wgrywanego zdjęcia i zgadza się na publikację po zatwierdzeniu przez Admin_User.

#### Wymaganie 44: Walidacja serwerowa i odporność na nadużycia

**User Story:** Jako właściciel BELLAORTE chcę, żeby walidacja każdego formularza była powtórzona po stronie serwera, żeby ominięcie walidacji w przeglądarce nie pozwalało na zaśmiecanie bazy.

#### Acceptance Criteria

1. WHEN trasa `POST /api/booking-inquiries` otrzymuje żądanie, THE System SHALL stosować pełen zestaw walidacji opisany w Wymaganiu 10 po stronie serwera niezależnie od walidacji w Booking_Form.
2. WHEN trasa `POST /api/reviews` otrzymuje żądanie, THE System SHALL stosować pełen zestaw walidacji opisany w Wymaganiu 23 po stronie serwera niezależnie od walidacji w formularzu.
3. WHEN trasa `POST /api/guest-photos` otrzymuje żądanie, THE System SHALL stosować pełen zestaw walidacji opisany w Wymaganiu 24 po stronie serwera niezależnie od walidacji w formularzu.
4. IF walidacja serwerowa odrzuca żądanie, THEN THE System SHALL zwrócić odpowiedź ze statusem 400 i strukturą zawierającą listę pól z komunikatami błędów.

### Obszar M: Wygląd, UI i dostępność

#### Wymaganie 45: System kolorów flagi Włoch

**User Story:** Jako Public_Visitor chcę zobaczyć stronę o eleganckim, włoskim charakterze, żeby od razu zaufać marce BELLAORTE.

#### Acceptance Criteria

1. THE Public_Site SHALL stosować Italian_Flag_Theme z tłem opartym o ivory i biel, akcentem głębokiej włoskiej zieleni i akcentem terracotty zamiast jaskrawej zieleni i jaskrawej czerwieni.
2. THE Public_Site SHALL stosować dla nagłówków eleganckiego kroju display zbliżonego do Cormorant Garamond.
3. THE Public_Site SHALL stosować dla treści UI, formularzy, kalendarza i tabel czytelnego kroju zbliżonego do Inter.
4. THE Public_Site SHALL stosować promień zaokrąglenia kart nie większy niż 8 pikseli, z wyjątkiem elementów systemowych takich jak okrągłe avatary.
5. THE Public_Site SHALL nie zagnieżdżać kart wewnątrz innych kart.
6. THE Public_Site SHALL renderować wszystkie przyciski tak, aby etykieta tekstowa nie wykraczała poza obszar przycisku ani nie zasłaniała innych elementów interfejsu.

#### Wymaganie 46: Dostępność WCAG

**User Story:** Jako Public_Visitor korzystający z czytnika ekranu chcę móc nawigować po stronie, formularzach i kalendarzu, żeby skorzystać z oferty BELLAORTE bez barier.

#### Acceptance Criteria

1. THE Public_Site SHALL zapewniać kontrast tekstu do tła co najmniej na poziomie WCAG AA dla całej publicznej strony.
2. THE Public_Site SHALL przypisywać każdemu polu formularza powiązaną etykietę dostępną dla czytników ekranu.
3. THE Public_Site SHALL pozwalać przejść klawiaturą przez całą sekwencję pól Booking_Form i wysłać formularz bez użycia myszy.
4. THE Availability_Calendar SHALL wystawiać status Calendar_Status każdego dnia również jako tekst dostępny dla czytników ekranu, nie tylko jako kolor.
5. THE Public_Site SHALL przypisywać atrybut `alt` każdemu zdjęciu w galeriach Apartment, Restaurant i Attraction.

#### Wymaganie 47: Responsywność

**User Story:** Jako Public_Visitor chcę, żeby strona dobrze wyglądała na telefonie, tablecie i komputerze, żeby planować pobyt z każdego urządzenia.

#### Acceptance Criteria

1. THE Public_Site SHALL renderować wszystkie publiczne trasy w sposób responsywny dla szerokości ekranu od 320 pikseli do 1920 pikseli bez poziomego paska przewijania.
2. WHEN szerokość ekranu wynosi mniej niż 768 pikseli, THE Public_Site SHALL wyświetlać Apartment_Listing, listę restauracji i listę miejsc w układzie jednokolumnowym.
3. WHEN szerokość ekranu wynosi mniej niż 768 pikseli, THE Availability_Calendar SHALL pozostać w pełni klikalny, z dniami o powierzchni dotykowej co najmniej 40 × 40 pikseli.
4. WHEN szerokość ekranu wynosi co najmniej 1024 pikseli, THE Public_Site SHALL wyświetlać Apartment_Listing w układzie dwukolumnowym pokazującym oba apartamenty obok siebie.

### Obszar N: Stack techniczny i konfiguracja

#### Wymaganie 48: Stos technologiczny i struktura projektu

**User Story:** Jako programista chcę wiedzieć, na jakim stosie i strukturze plików budowany jest projekt, żeby wszystkie zmiany szły w spójnym kierunku.

#### Acceptance Criteria

1. THE System SHALL być zbudowany na stosie Next.js App Router, React, TypeScript, Tailwind CSS oraz Supabase (Postgres, Auth, Storage).
2. THE System SHALL nie używać WordPressa ani żadnego CMS opartego o WordPress jako warstwy publikacji ani warstwy administracji treścią.
3. THE System SHALL stosować nazewnictwo: foldery i pliki tras w `kebab-case`, komponenty React w `PascalCase`, typy i interfejsy TypeScript w `PascalCase`, funkcje, zmienne i pola danych w `camelCase`.
4. THE System SHALL stosować nazwy modeli domenowych po angielsku zgodnie z glosariuszem (`Apartment`, `BookingInquiry`, `Reservation`, `CalendarBlock`, `Guest`, `AdminUser`, `Amenity`, `GalleryPhoto`, `GuidePost`, `Restaurant`, `Attraction`, `Review`, `GuestPhoto`, `TravelInfo`).
5. THE System SHALL renderować trasy publiczne domyślnie jako Server Components Next.js, a interaktywne komponenty (Availability_Calendar, Booking_Form, formularz Review, GuestPhotoUploader) jako Client Components.

#### Wymaganie 49: Zmienne środowiskowe i sekrety

**User Story:** Jako programista chcę mieć jasno opisane zmienne środowiskowe potrzebne do uruchomienia aplikacji, żeby konfiguracja produkcyjna i lokalna były spójne.

#### Acceptance Criteria

1. THE System SHALL wymagać zmiennych środowiskowych co najmniej dla: URL projektu Supabase, klucza anonimowego Supabase, klucza serwisowego Supabase (tylko serwer), klucza Google Maps API.
2. THE System SHALL nigdy nie eksponować klucza serwisowego Supabase w kodzie wykonywanym po stronie klienta.
3. THE System SHALL ładować klucz Google Maps API wyłącznie przez zmienną środowiskową, nigdy zapisaną na stałe w kodzie źródłowym.
4. THE System SHALL dostarczyć plik `.env.example` opisujący każdą wymaganą zmienną środowiskową bez wartości produkcyjnych.

## Decyzje do potwierdzenia z właścicielem produktu

Następujące decyzje zostały podjęte w pierwszej wersji wymagań na podstawie obecnej dokumentacji i wymagają potwierdzenia przed fazą projektową:

1. **Pending na kalendarzu**: Wysłane Booking_Inquiry od razu pojawia się jako `pending` na publicznym kalendarzu (Wymaganie 8). Inny gość może wybrać taki termin, ale widzi ostrzeżenie. PRD dopuszczał obie opcje — wybrano opcję `pending` widoczne publicznie z ostrzeżeniem.
2. **Moderacja treści gości**: Review i Guest_Photo wchodzą domyślnie ze statusem `pending` i wymagają zatwierdzenia przez Admin_User przed publikacją (Wymaganie 25). PRD i CLAUDE.md dawały sprzeczne sygnały — wybrano wariant z PRD (moderacja przed publikacją) jako bezpieczniejszy dla marki.
3. **Dwa apartamenty zafiksowane**: Admin_Panel pozwala edytować apartamenty, ale nie pozwala dodać trzeciego ani usunąć któregoś (Wymaganie 28). Można to poluzować, jeśli właściciel zechce w przyszłości skalować ofertę.
4. **Nazwy apartamentów, pojemność, udogodnienia, realne zdjęcia wnętrz**: pozostają do uzupełnienia treściowo przez Admin_User w panelu (Wymaganie 28, 40). Nie są blokerem do realizacji MVP.
5. **Konta gości**: MVP nie wprowadza kont użytkowników publicznych — Guest_Contributor wysyła zapytanie, opinię lub zdjęcie bez logowania, jedynie z podpisem i zgodami.
