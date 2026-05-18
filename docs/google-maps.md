# Google Maps BELLAORTE

## Cel

Restauracje i miejsca do zwiedzania maja miec:

- adres,
- link do Google Maps,
- opcjonalny Google Place ID,
- wspolrzedne,
- telefon,
- strone www,
- godziny otwarcia,
- tagi,
- wskazowke dla gosci,
- osadzona mape na stronie publicznej.

## Konfiguracja

W `.env.local` mozna dodac:

```env
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=twoj_klucz_google_maps
```

Jesli klucza nie ma, aplikacja uzywa prostego iframe Google Maps z adresem lub
wspolrzednymi. Jesli klucz jest ustawiony, uzywa oficjalnego Maps Embed API.

## Panel admina

W panelu `Restauracje` i `Miejsca` mozna edytowac:

- `Adres`,
- `Google Place ID`,
- `Link Google Maps`,
- `Szerokosc geogr.`,
- `Dlugosc geogr.`,
- `Telefon`,
- `Strona www`,
- `Godziny`,
- `Tagi`,
- `Budzet`,
- `Dojazd / odleglosc`,
- `Wskazowka dla gosci`.

## Supabase

Po wdrozeniu tej funkcji uruchom w Supabase SQL Editor:

```text
supabase/migrations/20260505_google_maps.sql
```

Nowe kolumny w `guide_items`:

- `address`,
- `google_place_id`,
- `google_maps_url`,
- `latitude`,
- `longitude`,
- `website_url`,
- `phone`,
- `opening_hours`,
- `tags`,
- `travel_tip`,
- `price_level`,
- `distance_label`.
