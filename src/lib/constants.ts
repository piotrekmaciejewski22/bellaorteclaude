/**
 * Domain-wide constants for BELLAORTE.
 *
 * - Validators (task 3.x) and route handlers (task 5.x) read these values.
 * - The numbers map 1:1 to the requirement document; each constant carries
 *   a `Wymaganie` reference so it is obvious why a limit is what it is.
 * - This module MUST stay dependency-free (same rule as `types.ts`).
 *
 * Wymagania: 12, 23, 24, 48
 */

// ---------------------------------------------------------------------------
// Review text limits
// ---------------------------------------------------------------------------

/** Maximum characters of a review body. Wymaganie 23 #2. */
export const MAX_REVIEW_BODY = 1000;

/** Minimum characters of a review body. Wymaganie 23 #2. */
export const MIN_REVIEW_BODY = 10;

/** Maximum characters of a review signature (display name). Wymaganie 23 #2. */
export const MAX_SIGNATURE = 60;

/** Minimum characters of a review signature (display name). Wymaganie 23 #2. */
export const MIN_SIGNATURE = 2;

// ---------------------------------------------------------------------------
// Guest photo limits
// ---------------------------------------------------------------------------

/** Maximum file size for a guest-uploaded photo, in bytes (8 MiB). Wymaganie 24 #3. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/** Whitelist of MIME types accepted on `POST /api/guest-photos`. Wymaganie 24 #2. */
export const ALLOWED_PHOTO_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Union of values from {@link ALLOWED_PHOTO_MIME}. Use this as the type of
 * a validated `mimeType` field after running the guest-photo validator.
 * Wymaganie 24 #2.
 */
export type AllowedPhotoMime = (typeof ALLOWED_PHOTO_MIME)[number];

// ---------------------------------------------------------------------------
// Rate limits
// ---------------------------------------------------------------------------

/**
 * Per-IP rate limits for the public POST endpoints.
 *
 * - `bookingInquiries`: 10 requests per 10 minutes. Wymaganie 12 #4.
 * - `reviews`: 20 requests per 60 minutes. Wymaganie 23 #7.
 * - `guestPhotos`: shares the same pool size as `reviews` per task 5.4
 *   ("taki sam pool jak reviews"). Kept as a separate key so call sites
 *   stay readable and the limits can be tuned independently later.
 */
export const RATE_LIMITS = {
  bookingInquiries: {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  },
  reviews: {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  },
  guestPhotos: {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  },
} as const;
