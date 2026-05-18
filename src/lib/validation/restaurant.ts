/**
 * Server-side validation for the admin Restaurant editor
 * (`POST /api/admin/restaurants`, `PATCH /api/admin/restaurants/[id]`,
 * task 16.1).
 *
 * - Implements the field-shape rules required by Wymaganie 31 #2 (name,
 *   slug, region, Map_Data) and Wymaganie 41 #1 (Map_Data must contain an
 *   address AND at least one of: Google Place ID OR coordinates).
 * - Slug uniqueness (Wym. 31 #6) is a database-level check and stays in the
 *   route handler / Postgres unique index — not in this pure validator.
 * - Other Restaurant fields editable in the admin (description, kategorie
 *   kuchni, tagi, godziny otwarcia, telefon, link do strony www, status
 *   publikacji) are free-form strings/arrays/booleans without numeric or
 *   shape constraints, so they are not validated here.
 * - The function never throws on bad input; everything is reported as a
 *   structured `errors[]` list whose `field` keys mirror the payload fields
 *   so the admin form can attach messages directly to the offending input.
 * - This module MUST stay free of runtime dependencies (no Supabase, no
 *   React, no Zod, etc.) so it can be unit-tested in isolation and reused
 *   on both edge and Node runtimes — same rule as the public validators.
 *
 * Wymagania: 31, 41, 44.
 */

import type { Region } from '@/lib/types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Shape of the JSON payload accepted by `validateRestaurant`. Every field is
 * intentionally optional / `unknown` so that wire data with missing or
 * mistyped fields can flow into the validator and be reported back as
 * errors instead of crashing the route handler.
 *
 * Map_Data is flattened the same way `Restaurant` stores it on the row
 * (`address`, `placeId`, `latitude`, `longitude`) so the admin form can
 * submit one flat object.
 */
export interface RestaurantPayload {
  name?: unknown;
  slug?: unknown;
  region?: unknown;
  address?: unknown;
  placeId?: unknown;
  latitude?: unknown;
  longitude?: unknown;
}

/** A single validation problem. `field` is the payload field name. */
export interface ValidationError {
  field: string;
  message: string;
}

/** Successful validation. */
export interface ValidationSuccess {
  ok: true;
}

/** Failed validation with one or more errors (always non-empty when `ok=false`). */
export interface ValidationFailure {
  ok: false;
  errors: ValidationError[];
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

/** Allowed values of `region`. Mirrors the `Region` type from `@/lib/types`. */
export const RESTAURANT_REGIONS = ['orte_area', 'rome'] as const satisfies readonly Region[];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Kebab-case slug: one or more lowercase alphanumeric segments separated by
 * single hyphens. Same rule as `validateApartment`: lowercase letters,
 * digits, single hyphens, no leading/trailing/double hyphen.
 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True if value is a non-empty string after trimming. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** True if value is a finite number (allows fractional coords). */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * True if a Map_Data field is "absent" — `undefined`, `null` or empty/whitespace
 * string. Used to decide whether placeId or latlng was supplied at all.
 */
function isAbsent(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim().length === 0) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate an inbound restaurant payload. Returns `{ ok: true }` on success,
 * otherwise a list of errors.
 *
 * Rules:
 *  - `name`: required, non-empty string after trimming (Wym. 31 #2).
 *  - `slug`: required, non-empty string matching kebab-case `SLUG_RE`
 *    (Wym. 31 #2, #6 — uniqueness is checked at the DB layer).
 *  - `region`: required, must be `'orte_area'` or `'rome'` (Wym. 31 #2).
 *  - Map_Data (Wym. 31 #2, Wym. 41 #1):
 *      • `address` is required (non-empty string), AND
 *      • at least one of:
 *          – `placeId` is a non-empty string, OR
 *          – BOTH `latitude` AND `longitude` are finite numbers in
 *            valid ranges (lat ∈ [-90, 90], lng ∈ [-180, 180]).
 *    Latitude/longitude must be supplied together; supplying only one is
 *    an error on the missing field.
 */
export function validateRestaurant(payload: RestaurantPayload): ValidationResult {
  const errors: ValidationError[] = [];

  // --- name (Wym. 31 #2) ---------------------------------------------------
  if (!isNonEmptyString(payload.name)) {
    errors.push({ field: 'name', message: 'Pole jest wymagane' });
  }

  // --- slug (Wym. 31 #2, #6) -----------------------------------------------
  if (!isNonEmptyString(payload.slug)) {
    errors.push({ field: 'slug', message: 'Pole jest wymagane' });
  } else if (!SLUG_RE.test(payload.slug as string)) {
    errors.push({
      field: 'slug',
      message:
        'Slug musi być w formacie kebab-case (małe litery, cyfry i pojedyncze myślniki)',
    });
  }

  // --- region (Wym. 31 #2) -------------------------------------------------
  if (!isNonEmptyString(payload.region)) {
    errors.push({ field: 'region', message: 'Pole jest wymagane' });
  } else if (!(RESTAURANT_REGIONS as readonly string[]).includes(payload.region as string)) {
    errors.push({
      field: 'region',
      message: 'Region musi być jedną z wartości: orte_area, rome',
    });
  }

  // --- Map_Data: address (Wym. 31 #2, Wym. 41 #1) --------------------------
  if (!isNonEmptyString(payload.address)) {
    errors.push({ field: 'address', message: 'Adres jest wymagany' });
  }

  // --- Map_Data: placeId OR latitude+longitude (Wym. 41 #1) ----------------
  // First, validate types of any supplied coords. Then check the
  // "placeId OR (lat AND lng)" rule against what's actually present.
  const placeIdProvided = !isAbsent(payload.placeId);
  const latProvided = !isAbsent(payload.latitude);
  const lngProvided = !isAbsent(payload.longitude);

  if (placeIdProvided && !isNonEmptyString(payload.placeId)) {
    errors.push({
      field: 'placeId',
      message: 'Google Place ID musi być tekstem',
    });
  }

  let latValid = false;
  if (latProvided) {
    if (!isFiniteNumber(payload.latitude)) {
      errors.push({
        field: 'latitude',
        message: 'Szerokość geograficzna musi być liczbą',
      });
    } else if (
      (payload.latitude as number) < -90 ||
      (payload.latitude as number) > 90
    ) {
      errors.push({
        field: 'latitude',
        message: 'Szerokość geograficzna musi mieścić się w zakresie -90 do 90',
      });
    } else {
      latValid = true;
    }
  }

  let lngValid = false;
  if (lngProvided) {
    if (!isFiniteNumber(payload.longitude)) {
      errors.push({
        field: 'longitude',
        message: 'Długość geograficzna musi być liczbą',
      });
    } else if (
      (payload.longitude as number) < -180 ||
      (payload.longitude as number) > 180
    ) {
      errors.push({
        field: 'longitude',
        message: 'Długość geograficzna musi mieścić się w zakresie -180 do 180',
      });
    } else {
      lngValid = true;
    }
  }

  // Latitude and longitude must travel as a pair; one without the other is
  // an error on the missing axis.
  if (latProvided && !lngProvided) {
    errors.push({
      field: 'longitude',
      message: 'Długość geograficzna jest wymagana razem z szerokością',
    });
  }
  if (lngProvided && !latProvided) {
    errors.push({
      field: 'latitude',
      message: 'Szerokość geograficzna jest wymagana razem z długością',
    });
  }

  // Headline rule (Wym. 41 #1): need placeId OR a valid latlng pair.
  const hasUsablePlaceId = placeIdProvided && isNonEmptyString(payload.placeId);
  const hasUsableLatLng = latValid && lngValid;
  if (!hasUsablePlaceId && !hasUsableLatLng) {
    errors.push({
      field: 'placeId',
      message:
        'Wymagane jest podanie Google Place ID albo współrzędnych (szerokość i długość geograficzna)',
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
