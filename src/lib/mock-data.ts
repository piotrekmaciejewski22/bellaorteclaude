/**
 * UI mock data — only used while data layer is being built.
 *
 * TODO: Replace with `getApartments()` / `getRestaurants()` / `getAttractions()`
 * from `src/lib/data/*` once tasks 4–5 wire the Supabase data layer in.
 * The shapes match `src/lib/types.ts` exactly so the eventual swap is a
 * one-line import change in each consuming Server Component.
 */

import type { Apartment, Restaurant, Attraction } from "@/lib/types";

const NOW = new Date().toISOString();

export const MOCK_APARTMENTS: Apartment[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "casa-orte-uno",
    name: "Casa Orte Uno",
    description:
      "Przestronny apartament w sercu zabytkowego centrum Orte z widokiem na dolinę Tybru. Idealny dla par lub małych rodzin szukających spokoju i autentycznego włoskiego klimatu.",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: [
      "Wi-Fi",
      "Klimatyzacja",
      "Kuchnia w pełni wyposażona",
      "Pralka",
      "Taras",
      "Pościel i ręczniki",
    ],
    houseRules:
      "Zameldowanie od 15:00, wymeldowanie do 11:00.\nCisza nocna 22:00 — 08:00.\nBez zwierząt domowych.\nZakaz palenia we wnętrzach.",
    publishedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "casa-orte-due",
    name: "Casa Orte Due",
    description:
      "Kameralny apartament tuż obok Piazza della Liberta, z dostępem do podziemnej trasy Orte Sotterranea i lokalnych restauracji w odległości spaceru. Najlepszy wybór na pierwszą wizytę w regionie Lacjum.",
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [
      "Wi-Fi",
      "Klimatyzacja",
      "Aneks kuchenny",
      "Pralka",
      "Pościel i ręczniki",
    ],
    houseRules:
      "Zameldowanie od 15:00, wymeldowanie do 11:00.\nCisza nocna 22:00 — 08:00.\nBez zwierząt domowych.\nZakaz palenia we wnętrzach.",
    publishedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "b1111111-1111-4111-8111-111111111111",
    slug: "la-locanda-della-chiocciola",
    name: "La Locanda della Chiocciola",
    description:
      "Restauracja oparta o lokalne produkty i sezonowe menu, z tarasem nad doliną i historycznym kominkiem w sali głównej.",
    region: "orte_area",
    cuisineCategories: ["Cucina contadina", "Kuchnia regionalna"],
    tags: ["lokalne produkty", "taras", "lunch", "rezerwacja"],
    openingHours:
      "Piątek i poniedziałek: 12:30 — 14:00\nSobota i niedziela: 12:30 — 14:30",
    phone: "+39 0761 402734",
    website: "https://www.lachiocciola.net/ristorante/",
    tipForGuest: "Najlepsze na regionalny lunch. Zarezerwuj telefonicznie.",
    address: "Loc. Seripola, 01028 Orte VT, Włochy",
    placeId: null,
    latitude: 42.4625,
    longitude: 12.3892,
    mapsUrl: null,
    publishedAt: NOW,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "b2222222-2222-4222-8222-222222222222",
    slug: "pizzeria-eureka-orte",
    name: "Pizzeria Ristorante Eureka!",
    description:
      "Pizza z pieca opalanego drewnem i klasyczna kuchnia włoska. Wygodny dojazd, parking i pełne menu z opcjami wegetariańskimi.",
    region: "orte_area",
    cuisineCategories: ["Pizza", "Cucina italiana"],
    tags: ["pizza", "rodzinnie", "parking", "casual"],
    openingHours: "Lunch: 12:00 — 14:15\nKolacja: 19:00 — 23:00",
    phone: "+39 0761 402447",
    website: "https://www.pizzeriaeureka.com/",
    tipForGuest: "Bezpieczny wybór na pierwszy wieczór.",
    address: "Via dei Calafati 34, 01028 Orte VT, Włochy",
    placeId: null,
    latitude: 42.4582,
    longitude: 12.3866,
    mapsUrl: null,
    publishedAt: NOW,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "b3333333-3333-4333-8333-333333333333",
    slug: "campo-antico-orte",
    name: "Campo Antico",
    description:
      "Spokojna restauracja z lokalnym klimatem, polecana na lunch lub kolację poza zatłoczonym centrum.",
    region: "orte_area",
    cuisineCategories: ["Cucina locale", "Kuchnia laziale"],
    tags: ["kolacja", "lokalnie", "rezerwacja", "auto"],
    openingHours:
      "Wtorek — niedziela: 12:00 — 14:30 i 19:00 — 22:30",
    phone: "+39 0761 402380",
    website: "https://campoantico.it/",
    tipForGuest: "Warto rezerwować wieczorem w sezonie.",
    address: "Localita Cacciarino, 01028 Orte VT, Włochy",
    placeId: null,
    latitude: 42.4541,
    longitude: 12.4012,
    mapsUrl: null,
    publishedAt: NOW,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const MOCK_ATTRACTIONS: Attraction[] = [
  {
    id: "a1111111-1111-4111-8111-aaaaaaaaaaaa",
    slug: "orte-sotterranea",
    name: "Orte Sotterranea",
    description:
      "Podziemna trasa pod historycznym centrum Orte: rzymski akwedukt, średniowieczne cysterny, studnie i fragmenty miasta wykute w tufowej skale.",
    region: "orte_area",
    tags: ["Orte", "podziemia", "historia", "must see"],
    practicalInfo:
      "Trasa z przewodnikiem trwa około 60 minut. Bilety dostępne na miejscu i online.",
    travelInfo:
      "Wejście znajduje się przy Via G. Matteotti, w samym sercu centrum historycznego.",
    address: "Via G. Matteotti 45, 01028 Orte VT, Włochy",
    placeId: null,
    latitude: 42.4605,
    longitude: 12.3867,
    mapsUrl: null,
    publishedAt: NOW,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "a2222222-2222-4222-8222-aaaaaaaaaaaa",
    slug: "parco-dei-mostri-bomarzo",
    name: "Parco dei Mostri di Bomarzo",
    description:
      "Sacro Bosco di Bomarzo — manierystyczny park rzeźb z XVI wieku, z fantastycznymi stworzeniami i symbolicznymi inskrypcjami.",
    region: "orte_area",
    tags: ["Bomarzo", "rodzinnie", "park", "auto"],
    practicalInfo:
      "Sezon letni (kwiecień — sierpień): 8:30 — 19:00. Poza sezonem: 8:30 do zmierzchu.",
    travelInfo: "Najlepiej autem — około 25 — 30 minut z Orte.",
    address: "Loc. Giardino, 01020 Bomarzo VT, Włochy",
    placeId: null,
    latitude: 42.4895,
    longitude: 12.2482,
    mapsUrl: null,
    publishedAt: NOW,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "a3333333-3333-4333-8333-aaaaaaaaaaaa",
    slug: "civita-di-bagnoregio",
    name: "Civita di Bagnoregio",
    description:
      "Jedno z najpiękniejszych miasteczek Włoch, położone na tufowym wzgórzu i dostępne wyłącznie pieszym mostem.",
    region: "orte_area",
    tags: ["widoki", "miasteczko", "foto", "auto"],
    practicalInfo:
      "Wstęp do miasteczka jest płatny (drobna opłata wspierająca utrzymanie mostu).",
    travelInfo: "Około 50 — 60 minut autem z Orte.",
    address: "Civita di Bagnoregio, 01022 Bagnoregio VT, Włochy",
    placeId: null,
    latitude: 42.6275,
    longitude: 12.113,
    mapsUrl: null,
    publishedAt: NOW,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

/**
 * Mocked "next available date" string per apartment slug. Once task 4
 * (`getAvailability`) is wired up, replace with `computeNextAvailability`.
 */
export const MOCK_NEXT_AVAILABLE: Record<string, string> = {
  "casa-orte-uno": "Najbliższy wolny termin: 12 czerwca",
  "casa-orte-due": "Najbliższy wolny termin: 5 lipca",
};

/**
 * Static placeholder photo paths under `/public/placeholders/`. Once
 * Supabase storage seed runs, replace with `gallery_photos.storage_path`
 * resolved through the public CDN URL.
 */
export const MOCK_APARTMENT_HERO: Record<string, string> = {
  "casa-orte-uno": "/placeholders/orte-1.svg",
  "casa-orte-due": "/placeholders/orte-2.svg",
};
