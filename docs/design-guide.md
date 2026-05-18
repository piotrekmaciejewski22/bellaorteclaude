# Design Guide: BELLAORTE

## 1. Kierunek wizualny

BELLAORTE ma wygladac jak wloska, turystyczna strona premium z praktycznym
systemem rezerwacji. Styl ma korzystac z kolorow flagi Wloch, ale w eleganckim,
cieplym wydaniu: zielen, biel/ivory i czerwien jako terracotta.

Publiczna strona powinna byc bardziej travel guide niz typowy SaaS. Panel
admina powinien byc spokojny, czytelny i szybki.

Glowne odczucia:

- wloski charakter,
- lokalnosc Orte,
- przejrzysta dostepnosc terminow,
- prosta rezerwacja,
- interaktywny przewodnik dla gosci,
- zaufanie i porzadek.

Unikac:

- krzykliwych kolorow flagi,
- generycznego wygladu hotelowego,
- ozdobnych kart w kartach,
- placeholderow wnetrz udajacych realne zdjecia apartamentow,
- ciezkich animacji w kalendarzu,
- chaosu w panelu admina.

## 2. Paleta kolorow

Paleta bazuje na fladze Wloch, ale ma byc premium i czytelna.

| Token | Hex | Uzycie |
| --- | --- | --- |
| `italianGreen` | `#1F6F43` | glowny kolor marki, linki, statusy pozytywne |
| `softGreen` | `#E8F1EA` | jasne tla sekcji, dostepne terminy |
| `flagWhite` | `#FFFFFF` | formularze, karty, powierzchnie UI |
| `ivory` | `#F8F4EC` | tlo publicznej strony |
| `italianRed` | `#B43A32` | mocny akcent, konflikty, wazne statusy |
| `terracotta` | `#B85C38` | cieple CTA, turystyczny akcent |
| `cypress` | `#223126` | ciemny tekst, header, panel admina |
| `ink` | `#1E1C18` | tekst podstawowy |
| `travertine` | `#D8C7AA` | ramki, separatory, spokojne powierzchnie |
| `skyAccent` | `#8FB3C8` | informacje transportowe, linki pomocnicze |

Zasady:

- Strona publiczna: duzo `flagWhite` i `ivory`, zielone elementy marki,
  czerwona/terracotta akcja.
- Kalendarz: zielony dla wolnych terminow, czerwony dla zajetych, neutralny dla
  blokad, sky accent dla oczekujacych.
- Nie uzywac jednoczesnie mocnej zieleni i mocnej czerwieni w kazdej sekcji.
- Panel admina ma byc bardziej neutralny: biel, cypress, jasne statusy.

## 3. Typografia

### Naglowki publiczne

Preferowany charakter: elegancki kroj display podobny do `Cormorant Garamond`.

Uzycie:

- hero,
- nazwa BELLAORTE,
- naglowki sekcji przewodnika,
- podstrony RZYM,
- tytuly apartamentow.

### Tekst UI i panel

Preferowany charakter: neutralny, czytelny kroj podobny do `Inter`.

Uzycie:

- formularze,
- kalendarz,
- dashboard admina,
- listy rezerwacji,
- komentarze,
- oceny,
- elementy bloga i przewodnika.

Zasady:

- Nie skalowac fontu przez `vw`.
- Nie uzywac ujemnego letter spacingu.
- W panelu admina naglowki maja byc zwarte i robocze.
- Dlugie teksty komentarzy musza zawijac sie bez niszczenia layoutu.

## 4. Layout publiczny

### Pierwszy ekran

Hero ma od razu pokazac:

- marke `BELLAORTE`,
- Orte jako lokalizacje,
- mocne zdjecie miasta, okolicy, uliczki, panoramy albo klimatu Wloch,
- wejscie do 2 apartamentow,
- CTA `Sprawdz dostepnosc`,
- szybkie wejscia: Restauracje, Zwiedzanie, RZYM, Przydatne informacje.

Nie uzywac finalnych zdjec wnetrz, dopoki nie beda realne.

### Sekcje strony glownej

Proponowana kolejnosc:

1. Hero z marka, lokalizacja i CTA.
2. Dwa apartamenty.
3. Kalendarz dostepnosci lub skrot do kalendarza.
4. Dlaczego Orte.
5. Polecane restauracje.
6. Miejsca do zwiedzania.
7. RZYM.
8. Przydatne informacje.
9. Komentarze/oceny gosci jako sekcja przyszla lub MVP.
10. Stopka.

### Apartamenty

Karty apartamentow maja byc porownywalne:

- nazwa,
- zdjecie placeholderowe bez wnetrza,
- podstawowe fakty,
- najblizsza dostepnosc,
- przycisk `Zobacz apartament`,
- przycisk lub link `Sprawdz termin`.

### Blog i przewodnik

Widoki przewodnika maja byc bardzo skanowalne:

- lista kart,
- kategorie,
- lokalizacja,
- ocena,
- liczba komentarzy,
- zdjecie,
- krotki opis.

Karty nie powinny byc zbyt wysokie. Szczegoly, komentarze i zdjecia gosci
powinny byc na stronie szczegolu.

## 5. Kalendarz i rezerwacja

Kalendarz jest kluczowa funkcja publiczna.

Statusy:

- `available` - wolne, zielony lub jasny zielony,
- `pending` - oczekuje, sky accent,
- `reserved` - zarezerwowane, czerwony,
- `blocked` - zablokowane, travertine albo neutralny szary.

Zasady:

- Publiczny kalendarz nie pokazuje danych gosci.
- Zarezerwowane i zablokowane dni nie sa wybieralne.
- Zakres dat musi miec wyrazny poczatek i koniec.
- Legenda zawsze blisko kalendarza.
- Na mobile kalendarz moze przechodzic w liste tygodni lub uproszczony miesiac.
- Formularz nie pokazuje cen.
- CTA: `Wyslij rezerwacje` albo `Wyslij zapytanie`, zalezniew od decyzji
  produktowej w implementacji. Na tym etapie bez platnosci.

## 6. Panel admina

Panel admina ma zarzadzac cala strona.

Nawigacja:

- `Dashboard`,
- `Apartamenty`,
- `Kalendarz`,
- `Rezerwacje`,
- `Restauracje`,
- `Miejsca`,
- `RZYM`,
- `Przydatne info`,
- `Komentarze`,
- `Zdjecia`,
- `Ustawienia`.

### Dashboard

Pokazuje:

- nowe rezerwacje/zapytania,
- dzisiejsze i najblizsze przyjazdy,
- najblizsze wyjazdy,
- terminy oczekujace,
- komentarze do moderacji,
- zdjecia do moderacji,
- szybkie akcje.

### Kalendarz admina

Admin moze:

- filtrowac po apartamencie,
- dodac rezerwacje recznie,
- dodac blokade,
- zmienic status zapytania,
- zobaczyc szczegoly terminu,
- usunac lub edytowac blokade.

### Tresci przewodnika

Admin moze tworzyc i edytowac:

- restauracje,
- miejsca do zwiedzania,
- wpisy RZYM,
- plany zwiedzania,
- przydatne informacje,
- zdjecia i opisy.

### Moderacja

Komentarze, oceny i zdjecia gosci powinny miec status:

- `pending`,
- `approved`,
- `rejected`.

Domyslnie tresc goscia powinna wymagac zatwierdzenia przed publikacja.

## 7. Komponenty

### Przyciski

- Primary: zielony albo terracotta, w zaleznosci od kontekstu.
- Booking CTA: terracotta lub italianRed, ale tylko jedna glowna akcja na ekran.
- Secondary: biale tlo, ciemny tekst, cienka ramka.
- Admin action: spokojny cypress/green.
- Destructive: italianRed, tylko dla usuniecia lub odrzucenia.

### Karty

- Radius maksymalnie `8px`.
- Karty dla apartamentow, restauracji, atrakcji, wpisow i komentarzy.
- Nie umieszczac kart w kartach.

### Oceny i komentarze

- Ocena 1-5.
- Widoczna liczba opinii.
- Komentarz ma autora, date, tresc, opcjonalne zdjecia.
- Zdjecia gosci musza miec stan moderacji.

### Nawigacja publiczna

- `Apartamenty`,
- `Kalendarz`,
- `Restauracje`,
- `Zwiedzanie`,
- `RZYM`,
- `Przydatne informacje`,
- `Kontakt`.

## 8. Responsive

Breakpoints docelowe:

- mobile: od `360px`,
- tablet: od `768px`,
- desktop: od `1024px`,
- wide: od `1280px`.

Zasady:

- Hero nie moze zaslaniac calego mobile bez drogi do apartamentow.
- Kalendarz na mobile musi pozostac czytelny.
- Formularz na mobile to jedna kolumna.
- Karty przewodnika na mobile ida jedna pod druga.
- Panel admina na mobile moze byc uproszczony, ale kalendarz i moderacja musza
  byc uzywalne.

## 9. Zdjecia i media

Na start:

- uzywac losowych zdjec Orte, okolicy, Wloch, ulic, panoram, detali, krajobrazu,
- nie uzywac losowych zdjec wnetrz jako zdjec apartamentow,
- oznaczac zdjecia jako placeholdery do pozniejszej wymiany,
- realne zdjecia apartamentow dodac pozniej.

Docelowo potrzebne:

- zdjecie zewnetrzne lub okolica dla kazdego apartamentu,
- zdjecia wnetrz kazdego apartamentu,
- zdjecia Orte,
- zdjecia restauracji,
- zdjecia atrakcji,
- zdjecia Rzymu,
- zdjecia praktyczne dla transportu.

## 10. Dostepnosc i jakosc

- Wszystkie pola formularzy musza miec etykiety.
- Stany focus musza byc widoczne.
- Kontrast tekstu musi byc czytelny.
- Elementy klikalne minimum okolo `44px` wysokosci na mobile.
- Tekst w przyciskach nie moze sie ucinac.
- Statusy kalendarza nie moga zalezec tylko od koloru.
- Komentarze i zdjecia gosci wymagaja moderacji.
- Publiczny kalendarz nie moze ujawniac danych osobowych.
