# Implementation Roadmap: BELLAORTE

Roadmapa opisuje kolejnosc budowy aplikacji po zakonczeniu dokumentacji.
Kolejne kroki powinny byc wykonywane malymi etapami, z weryfikacja po kazdym
etapie.

## Faza 0 - przygotowanie projektu

Cel: utworzyc czysty projekt aplikacji.

Zakres:

- scaffold Next.js w folderze `bellaorte`,
- TypeScript,
- Tailwind CSS,
- ESLint,
- podstawowy `README.md`,
- zachowanie istniejacego folderu `docs/`,
- przeczytanie lokalnych dokumentow Next.js przed kodowaniem.

Akceptacja:

- aplikacja startuje lokalnie,
- lint i build przechodza,
- dokumenty zostaja w `docs/`.

## Faza 1 - fundament UI i dane demo

Cel: miec wizualny fundament BELLAORTE bez bazy danych.

Zakres:

- layout publiczny,
- layout admina,
- tokeny kolorow flagi Wloch,
- typografia,
- plik danych demo,
- 2 apartamenty demo,
- placeholdery zdjec bez wnetrz,
- podstawowe komponenty kart i statusow.

Akceptacja:

- strona glowna pokazuje BELLAORTE i Orte,
- widoczne sa 2 apartamenty,
- nie ma cen,
- zdjecia nie udaja wnetrz apartamentow.

## Faza 2 - strony publiczne apartamentow

Cel: publiczna oferta noclegowa.

Zakres:

- `/`,
- `/apartments`,
- `/apartments/[slug]`,
- sekcja lokalizacji Orte,
- galeria placeholderowa,
- udogodnienia,
- zasady pobytu,
- CTA do kalendarza.

Akceptacja:

- gosc moze przejsc od strony glownej do kazdego apartamentu,
- kazdy apartament ma osobny slug,
- nie pojawiaja sie ceny.

## Faza 3 - kalendarz demo i formularz

Cel: sprawdzanie terminow i wysylanie zapytania na danych demo.

Zakres:

- `AvailabilityCalendar`,
- statusy: `available`, `pending`, `reserved`, `blocked`,
- legenda statusow,
- wybor apartamentu,
- wybor zakresu dat,
- walidacja konfliktow,
- `BookingForm`,
- `/booking`,
- `/booking/confirmation`.

Akceptacja:

- zarezerwowane i zablokowane dni nie sa wybieralne,
- publiczny kalendarz nie pokazuje danych gosci,
- formularz odrzuca bledny zakres dat,
- wyslanie pokazuje potwierdzenie.

## Faza 4 - przewodnik publiczny

Cel: BELLAORTE jako baza turystyczna, nie tylko nocleg.

Zakres:

- `/guide`,
- `/restaurants`,
- `/restaurants/[slug]`,
- `/places`,
- `/places/[slug]`,
- `/rome`,
- `/rome/restaurants`,
- `/rome/places`,
- `/rome/itinerary`,
- `/rome/info`,
- `/useful-info`.

Akceptacja:

- restauracje i miejsca maja listy oraz strony szczegolu,
- sekcja RZYM ma osobny hub i podstrony,
- przydatne informacje zawieraja samochod, Rzym, pociagi i kierunki podrozy.

## Faza 5 - komentarze, oceny i zdjecia demo

Cel: pokazac interaktywnosc gosci.

Zakres:

- lista opinii,
- srednia ocena,
- formularz komentarza,
- ocena 1-5,
- opcjonalny upload zdjecia jako UI demo,
- status moderacji `pending`,
- widoczne tylko zatwierdzone tresci demo.

Akceptacja:

- gosc moze wypelnic formularz opinii,
- komunikat mowi, ze komentarz czeka na moderacje,
- widoki publiczne pokazuja tylko zatwierdzone komentarze.

## Faza 6 - panel admina demo

Cel: admin widzi pelna strukture przyszlego CMS i rezerwacji.

Zakres:

- `/admin`,
- `/admin/apartments`,
- `/admin/calendar`,
- `/admin/reservations`,
- `/admin/restaurants`,
- `/admin/places`,
- `/admin/rome`,
- `/admin/useful-info`,
- `/admin/reviews`,
- `/admin/photos`,
- `/admin/settings`.

Akceptacja:

- dashboard pokazuje nowe zapytania, terminy i moderacje,
- admin moze przejsc do kazdej sekcji,
- formularze moga dzialac lokalnie/demo, ale maja finalny ksztalt UX.

## Faza 7 - Supabase

Cel: przejsc z danych demo na realne dane.

Zakres:

- Supabase project,
- tabele z `docs/data-model.md`,
- auth admina,
- storage dla mediow,
- polityki dostepu,
- migracje SQL,
- seed danych startowych,
- podmiana data access layer na Supabase.

Akceptacja:

- publiczne strony czytaja dane z Supabase,
- admin musi byc zalogowany,
- zapytanie rezerwacji zapisuje sie w bazie,
- komentarze i zdjecia trafiaja do moderacji,
- publiczny kalendarz nadal nie ujawnia danych gosci.

## Faza 8 - produkcyjne dopracowanie

Cel: przygotowac strone do realnego uzycia.

Zakres:

- realne zdjecia apartamentow,
- finalne nazwy apartamentow,
- kontakt,
- zasady pobytu,
- SEO,
- Open Graph,
- dostepnosc,
- responsywnosc,
- testy formularzy i kalendarza,
- polityka prywatnosci i zgody,
- monitoring bledow.

Akceptacja:

- realne zdjecia zastepuja placeholdery,
- wszystkie kluczowe teksty sa uzupelnione,
- strona przechodzi test desktop/mobile,
- admin moze zarzadzac trescia bez kodu.

## Kolejnosc rekomendowana na najblizszy sprint

1. Scaffold Next.js.
2. Zrobic layout publiczny i admin layout.
3. Dodac dane demo zgodne z `data-model.md`.
4. Zbudowac strone glowna.
5. Zbudowac liste i szczegoly 2 apartamentow.
6. Zbudowac kalendarz demo.
7. Zbudowac formularz rezerwacji/zapytania.

Po tym etapie bedzie juz klikalny prototyp, ktory mozna ocenic wizualnie i
produktowo przed podpinaniem Supabase.
