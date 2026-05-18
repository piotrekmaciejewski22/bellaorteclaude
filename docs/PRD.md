# PRD: BELLAORTE

## 1. Wizja produktu

BELLAORTE to publiczna strona, system rezerwacji i interaktywny przewodnik dla 2
apartamentow w Orte we Wloszech:

`01028 Orte, Prowincja Viterbo, Wlochy`

Produkt ma pomagac gosciom znalezc apartament, sprawdzic dostepnosc terminu,
zarezerwowac pobyt lub wyslac zapytanie, a potem zaplanowac jedzenie,
zwiedzanie, dojazdy i wypady do Rzymu. Dla wlasciciela/admina ma byc to centrum
zarzadzania strona: apartamentami, kalendarzem, rezerwacjami, wpisami,
restauracjami, atrakcjami, komentarzami, ocenami i zdjeciami gosci.

Pierwsza wersja nie pokazuje cen i nie obsluguje platnosci online. Ceny zostana
dodane pozniej.

Glowna petla MVP:

`wejscie na strone -> wybor apartamentu -> sprawdzenie kalendarza -> wybor dat -> wyslanie rezerwacji/zapytania -> obsluga w panelu admina`

Druga petla MVP:

`wejscie do przewodnika -> restauracja/atrakcja/Rzym -> komentarz, ocena lub zdjecie goscia -> moderacja w panelu admina`

## 2. Problem

Gosc planujacy pobyt w malym wloskim miescie potrzebuje nie tylko noclegu. Chce
wiedziec, czy termin jest wolny, gdzie zjesc, co zwiedzic, jak dojechac do
Rzymu, czy warto wynajac samochod i co polecaja inni goscie. Bez jednego
miejsca z tymi informacjami wszystko rozprasza sie po wiadomosciach,
mapach, social mediach i notatkach wlasciciela.

BELLAORTE ma zebrac:

- oferte 2 apartamentow,
- kalendarz dostepnosci,
- zapytania i rezerwacje,
- lokalne rekomendacje,
- sekcje Rzym,
- przydatne informacje transportowe,
- opinie, komentarze, oceny i zdjecia gosci,
- panel admina do kontroli tresci.

## 3. Grupy docelowe

### Goscie publiczni

Turysci szukajacy pobytu w Orte i okolicach, zwlaszcza pary, rodziny i osoby,
ktore chca miec spokojna baze wypadowa do Viterbo, Umbrii, Toskanii i Rzymu.
Wazne sa dla nich: dostepnosc, jasny kalendarz, zaufanie, zdjecia okolicy,
rekomendacje miejsc i latwy kontakt.

### Goscie interaktywni

Osoby, ktore po pobycie albo w trakcie pobytu chca dodac komentarz, ocene,
zdjecie restauracji, zdjecie atrakcji lub praktyczna wskazowke dla kolejnych
gosci.

### Admin / wlasciciel

Osoba zarzadzajaca BELLAORTE, ktora chce:

- aktualizowac 2 apartamenty,
- widziec i edytowac kalendarz rezerwacji,
- potwierdzac lub odrzucac zapytania,
- dodawac i edytowac restauracje,
- dodawac i edytowac miejsca do zwiedzania,
- tworzyc tresci dla sekcji RZYM,
- publikowac przydatne informacje,
- moderowac komentarze, oceny i zdjecia gosci.

## 4. Zakres MVP

### W zakresie

- strona glowna BELLAORTE,
- 2 apartamenty do wynajecia,
- losowe zdjecia placeholderowe bez wnetrz do czasu dostarczenia realnych zdjec,
- kalendarz dostepnosci widoczny na stronie,
- oznaczenia terminow wolnych, zarezerwowanych, oczekujacych i zablokowanych,
- formularz rezerwacji/zapytania bez platnosci,
- panel admina,
- zarzadzanie apartamentami,
- zarzadzanie kalendarzem i rezerwacjami,
- blog/przewodnik,
- polecane restauracje,
- miejsca do zwiedzania,
- komentarze, oceny i zdjecia gosci pod restauracjami i atrakcjami,
- sekcja `RZYM`,
- podstrony Rzym: restauracje, polecane miejsca, plan zwiedzania, info,
- przydatne informacje: wynajem samochodu, dojazd do Rzymu, pociagi i mozliwe
  kierunki podrozy,
- moderacja tresci dodawanych przez gosci.

### Poza zakresem MVP

- platnosci online,
- widoczne ceny,
- automatyczne faktury i podatki,
- integracje z Airbnb, Booking.com, iCal lub channel managerem,
- konta gosci z pelnym profilem,
- wieloobiektowy system poza 2 apartamentami,
- automatyczne tlumaczenia wszystkich tresci,
- zaawansowany system powiadomien,
- ranking rekomendacji oparty o algorytmy.

## 5. Widoki produktu

### Strona glowna

Cel: pokazac marke BELLAORTE, lokalizacje Orte i od razu skierowac goscia do 2
apartamentow oraz kalendarza.

Elementy:

- hero z nazwa `BELLAORTE`,
- lokalizacja: `Orte, Prowincja Viterbo, Wlochy`,
- zdjecie Orte, panoramy, uliczki, okolicy albo klimatu Wloch,
- krotki tekst o pobycie,
- dwa kafle apartamentow,
- mini kalendarz lub CTA `Sprawdz dostepnosc`,
- wejscia do przewodnika: restauracje, miejsca, Rzym, przydatne informacje,
- sekcja komentarzy/ocen jako dowod interaktywnosci w przyszlej wersji.

### Lista apartamentow

Cel: pozwolic porownac 2 apartamenty.

Elementy:

- karta apartamentu 1,
- karta apartamentu 2,
- zdjecie placeholderowe bez wnetrza,
- podstawowe fakty do uzupelnienia: liczba gosci, sypialnie, lazienki,
  udogodnienia,
- status najblizszej dostepnosci,
- link do szczegolu i kalendarza.

### Szczegol apartamentu

Cel: pokazac konkretny apartament i doprowadzic do wyboru dat.

Elementy:

- nazwa apartamentu,
- galeria placeholderowa bez zdjec wnetrz,
- opis do uzupelnienia,
- udogodnienia,
- zasady pobytu,
- kalendarz dostepnosci,
- formularz wyboru dat i wyslania rezerwacji/zapytania.

### Kalendarz dostepnosci na stronie

Cel: gosc widzi, czy sa wolne miejsca.

Elementy:

- wybor apartamentu,
- widok miesieczny,
- legenda: wolne, oczekuje, zarezerwowane, zablokowane,
- blokada wyboru dni zarezerwowanych,
- wybor zakresu dat,
- przejscie do formularza.

Kalendarz ma byc czytelny publicznie. Nie pokazuje danych osobowych gosci.

### Formularz rezerwacji/zapytania

Cel: zebrac minimalne dane potrzebne do obslugi terminu.

Pola:

- apartament,
- data przyjazdu,
- data wyjazdu,
- liczba doroslych,
- liczba dzieci,
- imie i nazwisko,
- email,
- telefon opcjonalnie,
- wiadomosc opcjonalna,
- zgoda na kontakt.

Zachowanie:

- brak platnosci,
- brak cen,
- jasny komunikat, ze termin wymaga potwierdzenia przez admina,
- po wyslaniu termin moze pojawic sie jako `oczekuje`, jesli tak zdecyduje
  logika MVP.

### Blog / przewodnik

Cel: pomoc gosciom planowac pobyt i budowac wartosc strony poza sama
rezerwacja.

Kategorie:

- polecane restauracje,
- miejsca do zwiedzania,
- RZYM,
- przydatne informacje.

### Polecane restauracje

Cel: admin dodaje miejsca, a goscie moga dzielic sie opinia.

Elementy:

- lista restauracji,
- nazwa,
- lokalizacja,
- zdjecie,
- opis admina,
- kategorie kuchni,
- ocena srednia,
- komentarze,
- zdjecia gosci,
- formularz dodania komentarza, oceny i zdjecia.

### Miejsca do zwiedzania

Cel: pokazac atrakcje w Orte i okolicach.

Elementy:

- lista miejsc,
- opis admina,
- zdjecie,
- odleglosc lub informacja dojazdowa,
- wskazowki praktyczne,
- oceny,
- komentarze,
- zdjecia gosci.

### RZYM

Cel: osobny hub dla gosci planujacych wyjazd do Rzymu.

Podstrony:

- `/rome/restaurants` - restauracje w Rzymie,
- `/rome/places` - polecane miejsca w Rzymie,
- `/rome/itinerary` - plan zwiedzania,
- `/rome/info` - praktyczne informacje.

Kazda podstrona moze miec komentarze, oceny i zdjecia gosci tam, gdzie ma to
sens.

### Przydatne informacje

Cel: odpowiedziec na praktyczne pytania gosci.

Tematy:

- gdzie wynajac samochod,
- jak dojechac do Rzymu,
- jak podrozowac pociagami,
- gdzie mozna jechac z Orte,
- wskazowki dojazdowe i organizacyjne.

### Panel admina

Cel: zarzadzac cala strona bez kodowania.

Sekcje:

- dashboard,
- apartamenty,
- kalendarz,
- rezerwacje/zapytania,
- restauracje,
- miejsca do zwiedzania,
- Rzym,
- przydatne informacje,
- komentarze i oceny,
- zdjecia gosci,
- ustawienia strony.

## 6. Modele pojeciowe

Te modele opisuja przyszle dane. Na etapie dokumentacji nie implementujemy bazy.

### `Apartment`

Jeden z 2 apartamentow BELLAORTE. Zawiera nazwe, slug, opis, status publikacji,
podstawowe fakty, udogodnienia i zdjecia placeholderowe lub finalne.

### `BookingInquiry`

Zapytanie lub prosba o rezerwacje wyslana przez goscia. Zawiera apartament,
daty, liczbe gosci, dane kontaktowe, wiadomosc, status i znacznik czasu.

### `Reservation`

Potwierdzony pobyt. Zawiera apartament, daty, dane goscia, status i notatki
admina.

### `CalendarBlock`

Blokada terminu bez danych goscia, np. pobyt prywatny, remont, sprzatanie albo
okres niedostepnosci.

### `Guest`

Dane osoby kontaktowej. W MVP moze powstac z formularza rezerwacji albo z
komentarza.

### `AdminUser`

Uzytkownik panelu admina.

### `Amenity`

Udogodnienie apartamentu.

### `GalleryPhoto`

Zdjecie apartamentu, Orte, okolicy albo przewodnika. Zdjecia wnetrz zostana
dodane pozniej jako realne assety.

### `GuidePost`

Wpis blogowy lub przewodnikowy, np. przydatna informacja, plan zwiedzania albo
artykul o miejscu.

### `Restaurant`

Polecana restauracja dodawana przez admina. Moze miec komentarze, oceny i
zdjecia gosci.

### `Attraction`

Miejsce do zwiedzania w Orte, okolicy albo Rzymie.

### `Review`

Komentarz i ocena goscia przypiete do restauracji, atrakcji albo wybranej tresci
przewodnika.

### `GuestPhoto`

Zdjecie dodane przez goscia do komentarza lub miejsca. Wymaga moderacji.

### `TravelInfo`

Praktyczna informacja o transporcie, wynajmie samochodu, pociagach lub trasach.

## 7. Kryteria sukcesu MVP

MVP jest gotowe, gdy:

- strona pokazuje BELLAORTE i lokalizacje Orte,
- sa widoczne 2 apartamenty,
- nie ma cen,
- zdjecia sa placeholderami bez wnetrz,
- gosc moze sprawdzic kalendarz dostepnosci dla apartamentu,
- kalendarz pokazuje wolne, oczekujace, zarezerwowane i zablokowane terminy,
- gosc moze wyslac rezerwacje/zapytanie bez platnosci,
- admin moze zarzadzac rezerwacjami i kalendarzem,
- admin moze dodawac restauracje, miejsca, wpisy Rzym i przydatne informacje,
- goscie moga dodawac komentarze, oceny i zdjecia do restauracji oraz miejsc,
- admin moze moderowac tresci dodane przez gosci,
- UI korzysta z eleganckiej wersji kolorow flagi Wloch.

## 8. Ryzyka i decyzje do uzupelnienia

- Nazwy 2 apartamentow sa do uzupelnienia.
- Liczba gosci, sypialnie, lazienki i udogodnienia sa do uzupelnienia.
- Realne zdjecia apartamentow zostana dodane pozniej.
- Ceny nie sa czescia MVP i nie powinny pojawiac sie w UI.
- Trzeba zdecydowac, czy wyslane zapytanie od razu blokuje termin jako
  `oczekuje`, czy dopiero admin robi blokade recznie.
- Trzeba ustalic poziom moderacji zdjec i komentarzy przed publikacja.
