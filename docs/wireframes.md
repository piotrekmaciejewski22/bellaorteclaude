# Wireframes: BELLAORTE

Ten dokument opisuje makiety tekstowe. To nie jest jeszcze kod ani finalny
projekt graficzny.

## 1. Strona glowna `/`

Cel: szybkie zrozumienie marki, lokalizacji i dostepnosci.

Uklad desktop:

- Header: logo `BELLAORTE`, nawigacja, przycisk `Sprawdz dostepnosc`.
- Hero: duze zdjecie Orte/okolicy, naglowek, lokalizacja, krotki opis.
- Pasek szybkich wejsc: `2 apartamenty`, `Kalendarz`, `Restauracje`, `RZYM`.
- Sekcja `Apartamenty`: dwie karty obok siebie.
- Sekcja `Kalendarz`: wybor apartamentu + mini widok miesiaca.
- Sekcja `Przewodnik`: restauracje, zwiedzanie, przydatne info.
- Sekcja `RZYM`: 4 kafle do podstron.
- Stopka: kontakt, lokalizacja, link do panelu admina ukryty lub dyskretny.

Mobile:

- Header prosty z menu.
- Hero bez ogromnej wysokosci.
- Karty apartamentow jedna pod druga.
- Kalendarz jako uproszczony miesiac lub CTA do pelnego widoku.

## 2. Lista apartamentow `/apartments`

Cel: porownanie 2 apartamentow.

Elementy:

- naglowek `Apartamenty BELLAORTE`,
- informacja `Orte, Prowincja Viterbo, Wlochy`,
- karta `Apartament 1` z placeholderem zdjecia bez wnetrza,
- karta `Apartament 2` z placeholderem zdjecia bez wnetrza,
- podstawowe pola do uzupelnienia,
- CTA `Zobacz apartament`,
- CTA `Sprawdz termin`.

## 3. Szczegol apartamentu `/apartments/[slug]`

Cel: doprowadzic do wyboru terminu.

Uklad:

- hero apartamentu z placeholderem,
- szybkie fakty,
- opis,
- udogodnienia,
- zasady pobytu,
- kalendarz dostepnosci,
- formularz rezerwacji/zapytania.

Wazne:

- nie pokazujemy cen,
- nie pokazujemy losowych zdjec wnetrz,
- kalendarz jest widoczny bez szukania.

## 4. Kalendarz `/booking` lub sekcja na stronie

Cel: publiczne sprawdzenie dostepnosci.

Elementy:

- wybor apartamentu,
- miesiac z nawigacja poprzedni/nastepny,
- legenda statusow,
- wolne dni wybieralne,
- zarezerwowane i zablokowane dni niewybieralne,
- zakres dat,
- liczba gosci,
- przycisk `Przejdz do formularza`.

Stany:

- brak wybranego apartamentu,
- brak wolnych terminow w miesiacu,
- konflikt dat,
- wyslane zapytanie.

## 5. Potwierdzenie wyslania `/booking/confirmation`

Cel: jasny spokoj po wyslaniu formularza.

Elementy:

- komunikat sukcesu,
- apartament,
- daty,
- liczba gosci,
- informacja, ze admin potwierdzi termin,
- link do przewodnika,
- link do strony glownej.

## 6. Restauracje `/restaurants`

Cel: lista polecanych restauracji.

Elementy:

- filtry: okolica, kuchnia, ocena,
- lista kart restauracji,
- zdjecie,
- nazwa,
- krotki opis,
- ocena srednia,
- liczba komentarzy,
- CTA `Zobacz miejsce`.

## 7. Szczegol restauracji `/restaurants/[slug]`

Cel: opis admina + tresci od gosci.

Elementy:

- zdjecie,
- nazwa,
- opis,
- lokalizacja,
- praktyczne informacje,
- ocena srednia,
- komentarze,
- zdjecia gosci,
- formularz: komentarz, ocena, zdjecie.

Komentarze i zdjecia wymagaja moderacji.

## 8. Miejsca do zwiedzania `/places`

Cel: pokazac atrakcje w Orte i okolicy.

Elementy:

- lista miejsc,
- kategorie,
- odleglosc lub wskazowka dojazdowa,
- oceny,
- komentarze,
- zdjecia gosci.

## 9. RZYM `/rome`

Cel: osobny hub dla wycieczek do Rzymu.

Elementy:

- hero `RZYM`,
- kafel `Restauracje`,
- kafel `Polecane miejsca`,
- kafel `Plan zwiedzania`,
- kafel `Info`,
- link do dojazdu pociagiem z sekcji przydatnych informacji.

Podstrony:

- `/rome/restaurants`,
- `/rome/places`,
- `/rome/itinerary`,
- `/rome/info`.

## 10. Przydatne informacje `/useful-info`

Cel: praktyczna baza wiedzy.

Sekcje:

- wynajem samochodu,
- dojazd do Rzymu,
- podroz pociagami,
- gdzie mozna pojechac z Orte,
- wskazowki organizacyjne.

## 11. Admin `/admin`

Cel: zarzadzanie cala strona.

Nawigacja:

- Dashboard,
- Apartamenty,
- Kalendarz,
- Rezerwacje,
- Restauracje,
- Miejsca,
- RZYM,
- Przydatne info,
- Komentarze,
- Zdjecia,
- Ustawienia.

Dashboard:

- nowe zapytania,
- terminy oczekujace,
- najblizsze przyjazdy,
- komentarze do moderacji,
- zdjecia do moderacji,
- szybkie akcje.

## 12. Admin: kalendarz

Elementy:

- filtr apartamentu,
- widok miesieczny,
- lista rezerwacji z boku,
- akcja `Dodaj blokade`,
- akcja `Dodaj rezerwacje`,
- szczegol terminu,
- zmiana statusu.

## 13. Admin: tresci przewodnika

Osobne listy i formularze dla:

- restauracji,
- miejsc do zwiedzania,
- wpisow RZYM,
- przydatnych informacji.

Kazdy formularz ma:

- tytul,
- opis,
- zdjecie,
- lokalizacje lub kategorie,
- status publikacji,
- podglad.

## 14. Admin: moderacja

Elementy:

- kolejka komentarzy,
- kolejka zdjec,
- filtr typu tresci,
- podglad kontekstu,
- akcje `Zatwierdz`, `Odrzuc`, `Usun`.
