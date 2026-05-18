# Data Model: BELLAORTE

Ten dokument opisuje docelowy model danych. Nie jest jeszcze migracja SQL.
Nazwy tabel sa robocze i przygotowane pod przyszly Supabase/Postgres.

## 1. Zasady modelu

- MVP ma 2 apartamenty.
- Nie przechowujemy cen jako wymaganej funkcji publicznej na start.
- Publiczny kalendarz pokazuje statusy terminow, nie dane gosci.
- Komentarze, oceny i zdjecia gosci wymagaja moderacji.
- Zdjecia wnetrz apartamentow zostana dodane pozniej jako realne assety.

## 2. Tabele glowne

### `apartments`

Apartament do wynajecia.

Pola:

- `id`
- `slug`
- `name`
- `shortDescription`
- `description`
- `locationLabel`
- `maxGuests`
- `bedrooms`
- `bathrooms`
- `amenities`
- `houseRules`
- `isPublished`
- `sortOrder`
- `createdAt`
- `updatedAt`

Uwagi:

- W MVP powinny istniec dokladnie 2 rekordy.
- Pola liczbowe moga byc puste, dopoki dane sa do uzupelnienia.

### `media_assets`

Wspolna tabela metadanych zdjec i plikow.

Pola:

- `id`
- `bucket`
- `path`
- `altText`
- `caption`
- `kind`
- `source`
- `isPlaceholder`
- `uploadedBy`
- `moderationStatus`
- `createdAt`
- `updatedAt`

Przyklady `kind`:

- `apartmentExterior`
- `apartmentPlaceholder`
- `orte`
- `rome`
- `restaurant`
- `attraction`
- `guestPhoto`
- `travelInfo`

### `apartment_photos`

Laczenie apartamentow ze zdjeciami.

Pola:

- `id`
- `apartmentId`
- `mediaAssetId`
- `sortOrder`
- `isHero`
- `createdAt`

### `amenities`

Slownik udogodnien.

Pola:

- `id`
- `name`
- `iconName`
- `sortOrder`
- `isPublished`

### `apartment_amenities`

Relacja apartamentow do udogodnien.

Pola:

- `id`
- `apartmentId`
- `amenityId`

## 3. Rezerwacje i kalendarz

### `guests`

Dane osoby kontaktowej.

Pola:

- `id`
- `displayName`
- `email`
- `phone`
- `preferredLanguage`
- `createdAt`
- `updatedAt`

### `booking_inquiries`

Zapytanie lub prosba o rezerwacje.

Pola:

- `id`
- `apartmentId`
- `guestId`
- `checkInDate`
- `checkOutDate`
- `adultCount`
- `childCount`
- `message`
- `status`
- `adminNotes`
- `createdAt`
- `updatedAt`

Statusy:

- `new`
- `pending`
- `inReview`
- `confirmed`
- `declined`
- `cancelled`

### `reservations`

Potwierdzona rezerwacja.

Pola:

- `id`
- `apartmentId`
- `guestId`
- `sourceInquiryId`
- `checkInDate`
- `checkOutDate`
- `adultCount`
- `childCount`
- `status`
- `adminNotes`
- `createdAt`
- `updatedAt`

Statusy:

- `confirmed`
- `cancelled`
- `completed`

### `calendar_blocks`

Blokady admina bez danych goscia.

Pola:

- `id`
- `apartmentId`
- `startDate`
- `endDate`
- `reason`
- `status`
- `createdBy`
- `createdAt`
- `updatedAt`

Statusy:

- `blocked`
- `maintenance`
- `privateStay`

## 4. Przewodnik i blog

### `guide_categories`

Kategorie tresci przewodnika.

Pola:

- `id`
- `slug`
- `name`
- `type`
- `sortOrder`
- `isPublished`

Przyklady `type`:

- `restaurant`
- `place`
- `rome`
- `usefulInfo`

### `restaurants`

Restauracje polecane przez admina.

Pola:

- `id`
- `slug`
- `name`
- `description`
- `locationLabel`
- `address`
- `mapUrl`
- `cuisineType`
- `area`
- `heroMediaAssetId`
- `isPublished`
- `sortOrder`
- `createdAt`
- `updatedAt`

### `attractions`

Miejsca do zwiedzania w Orte, okolicy albo Rzymie.

Pola:

- `id`
- `slug`
- `name`
- `description`
- `locationLabel`
- `address`
- `mapUrl`
- `area`
- `category`
- `estimatedVisitTime`
- `travelHint`
- `heroMediaAssetId`
- `isPublished`
- `sortOrder`
- `createdAt`
- `updatedAt`

### `guide_posts`

Wpisy przewodnikowe, plany zwiedzania, RZYM info i przydatne informacje.

Pola:

- `id`
- `slug`
- `title`
- `summary`
- `body`
- `categoryId`
- `section`
- `heroMediaAssetId`
- `isPublished`
- `publishedAt`
- `updatedAt`

Przyklady `section`:

- `guide`
- `rome`
- `romeItinerary`
- `romeInfo`
- `usefulInfo`

## 5. Opinie, komentarze i zdjecia gosci

### `reviews`

Komentarz i ocena goscia.

Pola:

- `id`
- `targetType`
- `targetId`
- `guestId`
- `authorName`
- `rating`
- `comment`
- `moderationStatus`
- `adminNotes`
- `createdAt`
- `updatedAt`

Przyklady `targetType`:

- `restaurant`
- `attraction`
- `guidePost`

Statusy moderacji:

- `pending`
- `approved`
- `rejected`
- `hidden`

### `guest_photos`

Zdjecia dodane przez gosci.

Pola:

- `id`
- `targetType`
- `targetId`
- `reviewId`
- `guestId`
- `mediaAssetId`
- `moderationStatus`
- `adminNotes`
- `createdAt`
- `updatedAt`

## 6. Admin i ustawienia

### `admin_users`

Profil admina powiazany z auth.

Pola:

- `id`
- `authUserId`
- `displayName`
- `role`
- `createdAt`
- `updatedAt`

Role:

- `owner`
- `admin`
- `editor`

### `site_settings`

Ustawienia globalne strony.

Pola:

- `id`
- `siteName`
- `locationLabel`
- `contactEmail`
- `contactPhone`
- `defaultLanguage`
- `supportedLanguages`
- `bookingMode`
- `updatedAt`

Przyklady `bookingMode`:

- `inquiryOnly`
- `requestReservation`

## 7. Relacje

- Jeden `Apartment` ma wiele `apartment_photos`.
- Jeden `Apartment` ma wiele `booking_inquiries`.
- Jeden `Apartment` ma wiele `reservations`.
- Jeden `Apartment` ma wiele `calendar_blocks`.
- Jeden `Guest` moze miec wiele `booking_inquiries`, `reservations`,
  `reviews` i `guest_photos`.
- `Restaurant`, `Attraction` i `GuidePost` moga miec wiele `reviews`.
- `Review` moze miec wiele `guest_photos`.
- `MediaAsset` moze byc uzyty jako zdjecie apartamentu, restauracji, atrakcji,
  wpisu albo zdjecie goscia.

## 8. Widoki i zapytania pomocnicze

Docelowo przydadza sie widoki lub helpery:

- `publicAvailability(apartmentId, month)` - statusy publicznego kalendarza.
- `adminCalendar(apartmentId, dateRange)` - szczegoly rezerwacji, zapytan i
  blokad.
- `reviewSummary(targetType, targetId)` - srednia ocena i liczba opinii.
- `moderationQueue()` - komentarze i zdjecia oczekujace.

## 9. Zasady walidacji

- `checkOutDate` musi byc po `checkInDate`.
- Rezerwacja `confirmed` nie moze nachodzic na inna `confirmed` dla tego samego
  apartamentu.
- Blokada nie moze miec pustego zakresu dat.
- `rating` musi byc od 1 do 5.
- Publicznie widoczne sa tylko tresci `isPublished = true` i
  `moderationStatus = approved`.
- Publiczne API dostepnosci nie zwraca danych gosci.

## 10. Dane startowe demo

Na start przygotowac:

- 2 apartamenty robocze,
- 4-6 placeholderowych zdjec Orte/Wloch bez wnetrz,
- 3 rezerwacje demo,
- 2 blokady demo,
- 4 restauracje,
- 4 miejsca do zwiedzania,
- 4 wpisy RZYM,
- 4 przydatne informacje,
- kilka komentarzy `approved` i kilka `pending`.
