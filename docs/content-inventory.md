# Content Inventory: BELLAORTE

Ten dokument zbiera tresci i assety potrzebne do pierwszej wersji. Pola
oznaczone jako `do uzupelnienia` nie sa jeszcze znane.

## 1. Dane marki

- Nazwa strony: `BELLAORTE`
- Lokalizacja: `01028 Orte, Prowincja Viterbo, Wlochy`
- Krotki opis marki: do uzupelnienia
- Kontakt email: do uzupelnienia
- Telefon: do uzupelnienia
- Jezyki strony: do uzupelnienia

## 2. Apartamenty

MVP zaklada 2 apartamenty.

### Apartament 1

- Nazwa: do uzupelnienia
- Slug: do uzupelnienia
- Liczba gosci: do uzupelnienia
- Sypialnie: do uzupelnienia
- Lazienki: do uzupelnienia
- Opis: do uzupelnienia
- Udogodnienia: do uzupelnienia
- Zasady pobytu: do uzupelnienia
- Zdjecia: tymczasowo losowe zdjecia bez wnetrz
- Ceny: nie pokazywac na tym etapie

### Apartament 2

- Nazwa: do uzupelnienia
- Slug: do uzupelnienia
- Liczba gosci: do uzupelnienia
- Sypialnie: do uzupelnienia
- Lazienki: do uzupelnienia
- Opis: do uzupelnienia
- Udogodnienia: do uzupelnienia
- Zasady pobytu: do uzupelnienia
- Zdjecia: tymczasowo losowe zdjecia bez wnetrz
- Ceny: nie pokazywac na tym etapie

## 3. Zdjecia

Na start mozna uzyc placeholderow:

- Orte,
- uliczki,
- panorama,
- detale architektury,
- okolica,
- krajobraz Wloch,
- Rzym dla sekcji RZYM.

Nie uzywac:

- losowych zdjec salonu,
- losowych zdjec sypialni,
- losowych zdjec kuchni,
- losowych zdjec lazienki,
- zdjec, ktore sugeruja finalny wyglad apartamentow.

Docelowo do zebrania:

- realne zdjecia apartamentu 1,
- realne zdjecia apartamentu 2,
- zdjecia budynku lub wejscia,
- zdjecia okolicy,
- zdjecia rekomendowanych restauracji,
- zdjecia miejsc do zwiedzania,
- zdjecia tras/dojazdow, jesli przydatne.

## 4. Kalendarz i rezerwacje

Potrzebne dane:

- lista apartamentow,
- status dnia lub zakresu dat,
- rezerwacje potwierdzone,
- zapytania oczekujace,
- blokady admina,
- dane kontaktowe goscia,
- notatki admina.

Statusy:

- `available`,
- `pending`,
- `reserved`,
- `blocked`,
- `cancelled`.

Decyzja do uzupelnienia:

- czy wyslane zapytanie automatycznie oznacza dni jako `pending`.

## 5. Restauracje

Dla kazdej restauracji admin powinien moc wpisac:

- nazwe,
- opis,
- lokalizacje,
- kategorie kuchni,
- zdjecia,
- link do mapy lub adres,
- wskazowki,
- status publikacji.

Goscie moga dodac:

- komentarz,
- ocene 1-5,
- zdjecie,
- imie lub podpis.

## 6. Miejsca do zwiedzania

Dla kazdego miejsca admin powinien moc wpisac:

- nazwe,
- opis,
- lokalizacje,
- zdjecia,
- kategorie,
- odleglosc lub dojazd,
- czas zwiedzania,
- wskazowki praktyczne,
- status publikacji.

Goscie moga dodac:

- komentarz,
- ocene 1-5,
- zdjecie,
- imie lub podpis.

## 7. RZYM

Hub `RZYM` ma miec podstrony:

- restauracje,
- polecane miejsca,
- plan zwiedzania,
- info.

Tresci do przygotowania:

- lista restauracji w Rzymie,
- lista miejsc w Rzymie,
- plan jednodniowy,
- plan dwudniowy opcjonalnie,
- informacje o dojezdzie,
- praktyczne wskazowki dla turysty.

## 8. Przydatne informacje

Kategorie:

- gdzie wynajac samochod,
- jak dojechac do Rzymu,
- podroz pociagami,
- gdzie mozna podrozowac z Orte,
- wskazowki parkingowe,
- wskazowki lotniskowe, jesli potrzebne.

Dla kazdej informacji:

- tytul,
- opis,
- kroki,
- linki zewnetrzne opcjonalnie,
- data aktualizacji,
- status publikacji.

## 9. Panel admina

Admin powinien zarzadzac:

- apartamentami,
- kalendarzem,
- rezerwacjami,
- restauracjami,
- miejscami do zwiedzania,
- sekcja RZYM,
- przydatnymi informacjami,
- komentarzami,
- ocenami,
- zdjeciami gosci,
- ustawieniami strony.

## 10. Moderacja

Tresci od gosci:

- komentarze,
- oceny,
- zdjecia.

Domyslny status:

- `pending`.

Admin moze:

- zatwierdzic,
- odrzucic,
- usunac,
- ukryc.

## 11. Braki przed kodowaniem produkcyjnym

- nazwy 2 apartamentow,
- podstawowe fakty o apartamentach,
- realne zdjecia,
- kontakt,
- zasady pobytu,
- decyzja o jezykach,
- decyzja o automatycznej blokadzie terminu po zapytaniu,
- polityka moderacji komentarzy i zdjec.
