/**
 * Server-side validation for the admin Apartment editor
 * (`PATCH /api/admin/apartments/[id]`, task 14.4).
 *
 * - Implements the field-shape rules for an Apartment row that the admin
 *   panel may write: `name`, `slug`, `maxGuests`, `bedrooms`, `bathrooms`.
 *   The full list of editable fields from Wymaganie 28 #2 is wider (opis,
 *   udogodnienia, zasady pobytu, status publikacji), but those are free-form
 *   strings/booleans without numeric or shape constraints, so this module
 *   intentionally focuses on the four checked rules.
 * - Slug uniqueness (Wym. 28 #5) is a database-level check and stays in the
 *   route handler / Postgres unique index — not in this pure validator.
 * - The "exactly 2 apartments" cap (Wym. 28 #6) is enforced in the admin
 *   API layer (task 14.6), not here.
 * - The function never throws on bad input; everything is reported as a
 *   structured `errors[]` list whose `field` keys mirror the payload fields
 *   so the admin form can attach messages directly to the offending input.
 * - This module MUST stay free of runtime dependencies (no Supabase, no
 *   React, no Zod, etc.) so it can be unit-tested in isolation and reused
 *   on both edge and Node runtimes — same rule as the public validators.
 *
 * Wymagania: 28, 44.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Shape of the JSON payload accepted by `validateApartment`. Every field is
 * intentionally optional / `unknown` so that wire data with missing or
 * mistyped fields can flow into the validator and be reported back as
 * errors instead of crashing the route handler.
 */
export interface ApartmentPayload {
  name?: unknown;
  slug?: unknown;
  maxGuests?: unknown;
  bedrooms?: unknown;
  bathrooms?: unknown;
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Kebab-case slug: one or more lowercase alphanumeric segments separated by
 * single hyphens. Disallows leading/trailing hyphens, consecutive hyphens,
 * uppercase letters, underscores and any other punctuation.
 *
 * Matches: `casa-orte-uno`, `villa1`, `a-b-2`.
 * Rejects: `Casa-Orte`, `casa--orte`, `-casa`, `casa-`, `casa_orte`.
 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True if value is a non-empty string after trimming. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** True if value is a finite integer. */
function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate an inbound apartment payload. Returns `{ ok: true }` on success,
 * otherwise a list of errors.
 *
 * Rules:
 *  - `name`: required, non-empty string after trimming (Wym. 28 #2).
 *  - `slug`: required, non-empty string matching kebab-case `SLUG_RE`
 *    (Wym. 28 #2, #5 — uniqueness is checked at the DB layer).
 *  - `maxGuests`: required, integer ≥ 1 (Wym. 28 #2; needed by Wym. 10 #7
 *    capacity check on bookings).
 *  - `bedrooms`: required, integer ≥ 0 (Wym. 28 #2).
 *  - `bathrooms`: required, integer ≥ 0 (Wym. 28 #2).
 */
export function validateApartment(payload: ApartmentPayload): ValidationResult {
  const errors: ValidationError[] = [];

  // --- name (Wym. 28 #2) ---------------------------------------------------
  if (!isNonEmptyString(payload.name)) {
    errors.push({ field: 'name', message: 'Pole jest wymagane' });
  }

  // --- slug (Wym. 28 #2, #5) -----------------------------------------------
  if (!isNonEmptyString(payload.slug)) {
    errors.push({ field: 'slug', message: 'Pole jest wymagane' });
  } else if (!SLUG_RE.test(payload.slug as string)) {
    errors.push({
      field: 'slug',
      message:
        'Slug musi być w formacie kebab-case (małe litery, cyfry i pojedyncze myślniki)',
    });
  }

  // --- maxGuests >= 1 (Wym. 28 #2) -----------------------------------------
  if (
    payload.maxGuests === undefined ||
    payload.maxGuests === null ||
    payload.maxGuests === ''
  ) {
    errors.push({ field: 'maxGuests', message: 'Pole jest wymagane' });
  } else if (!isInteger(payload.maxGuests)) {
    errors.push({
      field: 'maxGuests',
      message: 'Maksymalna liczba gości musi być liczbą całkowitą',
    });
  } else if ((payload.maxGuests as number) < 1) {
    errors.push({
      field: 'maxGuests',
      message: 'Maksymalna liczba gości musi wynosić co najmniej 1',
    });
  }

  // --- bedrooms >= 0 (Wym. 28 #2) ------------------------------------------
  if (
    payload.bedrooms === undefined ||
    payload.bedrooms === null ||
    payload.bedrooms === ''
  ) {
    errors.push({ field: 'bedrooms', message: 'Pole jest wymagane' });
  } else if (!isInteger(payload.bedrooms)) {
    errors.push({
      field: 'bedrooms',
      message: 'Liczba sypialni musi być liczbą całkowitą',
    });
  } else if ((payload.bedrooms as number) < 0) {
    errors.push({
      field: 'bedrooms',
      message: 'Liczba sypialni nie może być ujemna',
    });
  }

  // --- bathrooms >= 0 (Wym. 28 #2) -----------------------------------------
  if (
    payload.bathrooms === undefined ||
    payload.bathrooms === null ||
    payload.bathrooms === ''
  ) {
    errors.push({ field: 'bathrooms', message: 'Pole jest wymagane' });
  } else if (!isInteger(payload.bathrooms)) {
    errors.push({
      field: 'bathrooms',
      message: 'Liczba łazienek musi być liczbą całkowitą',
    });
  } else if ((payload.bathrooms as number) < 0) {
    errors.push({
      field: 'bathrooms',
      message: 'Liczba łazienek nie może być ujemna',
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
