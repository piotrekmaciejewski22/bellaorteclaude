/**
 * Canonical TypeScript shapes for the BELLAORTE public app domain.
 *
 * - These types describe rows AS THE APP CONSUMES THEM (camelCase).
 * - The Supabase / Postgres schema uses snake_case columns; mapping between
 *   snake_case rows and these camelCase shapes happens in the data-access
 *   layer (`src/lib/data/*`) introduced in later tasks.
 * - This module MUST stay dependency-free. Do NOT import it from
 *   `src/lib/supabase/*` clients and do NOT import `@supabase/supabase-js`
 *   here. It exists so that domain code, validators (task 3.x) and React
 *   components can all share one source of truth without pulling Supabase
 *   into a client bundle.
 * - All `id` fields are UUID strings. Dates returned by Postgres as ISO
 *   strings (`TIMESTAMPTZ`, `DATE`) stay as `string` here. There are no
 *   monetary fields anywhere in the MVP.
 *
 * Wymagania: 28-37, 41, 42, 48
 */

// ---------------------------------------------------------------------------
// String-literal unions (mirror Postgres enums / CHECK constraints)
// ---------------------------------------------------------------------------

/** Calendar day status returned by the public availability API. Wymaganie 7. */
export type DayStatus = 'available' | 'pending' | 'reserved' | 'blocked';

/** Region for restaurants and attractions. Wymaganie 19, 31, 32. */
export type Region = 'orte_area' | 'rome';

/** Moderation status for guest-submitted content (reviews, photos). Wymaganie 25. */
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'hidden';

/** Booking inquiry lifecycle status. Wymaganie 30. */
export type InquiryStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

/** Reservation lifecycle status. Wymaganie 30 #5. */
export type ReservationStatus = 'active' | 'cancelled';

/** Reason for a manual calendar block created by an admin. Wymaganie 29 #2. */
export type BlockReason = 'maintenance' | 'owner_stay' | 'cleaning' | 'other';

/** Source/origin of a gallery photo. Wymaganie 40. */
export type SourceKind =
  | 'placeholder_orte'
  | 'placeholder_italy'
  | 'placeholder_rome'
  | 'interior_real'
  | 'exterior_real';

/** Buckets within a one-day Rome itinerary. Wymaganie 20. */
export type DayPart = 'morning' | 'noon' | 'afternoon' | 'evening';

/** Fixed slots for the practical Rome info page. Wymaganie 21. */
export type RomeInfoKind =
  | 'transfer_from_orte'
  | 'public_transport'
  | 'tickets'
  | 'safety'
  | 'opening_hours';

/** Categories of practical travel information. Wymaganie 22. */
export type TravelInfoKind =
  | 'car_rental'
  | 'rome_transfer'
  | 'trains'
  | 'travel_directions';

// ---------------------------------------------------------------------------
// Entity interfaces
// ---------------------------------------------------------------------------

/**
 * One of the two rentable apartments. The MVP locks the row count at exactly
 * two; task 14.6 enforces that in the admin API. Wymaganie 4, 5, 28.
 */
export interface Apartment {
  id: string;
  slug: string;
  name: string;
  description: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  houseRules: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A single photo in a gallery. Exactly one of `apartmentId`, `restaurantId`
 * or `attractionId` is non-null; the database enforces this with a CHECK
 * constraint added in task 2.1. Wymaganie 28 #3, 31 #3, 32 #3, 40.
 */
export interface GalleryPhoto {
  id: string;
  apartmentId: string | null;
  restaurantId: string | null;
  attractionId: string | null;
  storagePath: string;
  alt: string;
  sourceKind: SourceKind;
  displayOrder: number;
  createdAt: string;
}

/**
 * Booking inquiry submitted by a Guest_Contributor. Carries all PII; this
 * shape is only consumed inside the admin panel and the rate-limited POST
 * endpoint. Public reads are forbidden (Wymaganie 38, 42). Wymaganie 9, 10, 30.
 */
export interface BookingInquiry {
  id: string;
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string | null;
  message: string | null;
  consentAt: string;
  status: InquiryStatus;
  sourceIp: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Confirmed stay derived from a BookingInquiry. The DB layer enforces
 * non-overlap between active reservations through an EXCLUDE constraint
 * (task 2.1). Wymaganie 30 #3, #5.
 */
export interface Reservation {
  id: string;
  apartmentId: string;
  inquiryId: string | null;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Manual admin block on the calendar. Wymaganie 29. */
export interface CalendarBlock {
  id: string;
  apartmentId: string;
  startDate: string;
  endDate: string;
  reason: BlockReason;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Restaurant managed by admins. Wymaganie 14, 15, 31, 41. */
export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string;
  region: Region;
  cuisineCategories: string[];
  tags: string[];
  openingHours: string | null;
  phone: string | null;
  website: string | null;
  tipForGuest: string | null;
  address: string | null;
  placeId: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
  publishedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Attraction managed by admins. Wymaganie 16, 17, 32, 41. */
export interface Attraction {
  id: string;
  slug: string;
  name: string;
  description: string;
  region: Region;
  tags: string[];
  practicalInfo: string | null;
  travelInfo: string | null;
  address: string | null;
  placeId: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
  publishedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Guest-authored review attached to either a Restaurant or an Attraction.
 * The DB enforces "exactly one of restaurantId/attractionId is non-null".
 * Wymaganie 23, 25, 35, 42.
 */
export interface Review {
  id: string;
  restaurantId: string | null;
  attractionId: string | null;
  signature: string;
  rating: number;
  body: string;
  status: ModerationStatus;
  consentAt: string;
  sourceIp: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Guest-uploaded photo. May be attached to a review (then `reviewId` is set)
 * or stand alone. As with `Review`, exactly one of restaurantId/attractionId
 * is non-null. Wymaganie 24, 25, 36, 39 #4.
 */
export interface GuestPhoto {
  id: string;
  restaurantId: string | null;
  attractionId: string | null;
  reviewId: string | null;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  status: ModerationStatus;
  consentAt: string;
  sourceIp: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Practical travel info shown on `/useful-info`. Wymaganie 22, 34. */
export interface TravelInfo {
  id: string;
  kind: TravelInfoKind;
  title: string;
  body: string;
  externalLinks: { label: string; url: string }[];
  displayOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Single point of the Rome itinerary. Wymaganie 20, 33. */
export interface RomeItineraryItem {
  id: string;
  dayPart: DayPart;
  title: string;
  body: string;
  linkedRestaurantId: string | null;
  linkedAttractionId: string | null;
  displayOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One of the practical Rome info sections (`/rome/info`). Wymaganie 21, 33. */
export interface RomeInfoSection {
  id: string;
  kind: RomeInfoKind;
  title: string;
  body: string;
  displayOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Singleton row carrying global site settings. The id is fixed to the
 * literal `1` (CHECK id = 1 in the DB). Wymaganie 37, 43.
 */
export interface SiteSettings {
  id: 1;
  contactEmail: string;
  contactPhone: string | null;
  footerAddress: string;
  privacyPolicyMd: string;
  consentTextBooking: string;
  consentTextReview: string;
  consentTextPhoto: string;
  /** Storage path do bucketa site-media; null = placeholder. */
  heroImagePath: string | null;
  updatedAt: string;
}

/**
 * Mapping of an authenticated Supabase user to admin status. Anyone whose
 * `userId` is in this table is an Admin_User. Wymaganie 26, 38.
 */
export interface AdminUser {
  userId: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helper / view types
// ---------------------------------------------------------------------------

/**
 * One day in the public availability view. Returned by the
 * `/api/availability` route and the `getAvailability` data helper. The
 * shape is intentionally minimal: never include guest PII. Wymaganie 7, 42.
 */
export interface DayStatusEntry {
  date: string;
  status: DayStatus;
}
