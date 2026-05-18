/**
 * Server-side validation for the public Review_Form (`POST /api/reviews`).
 *
 * - Implements the seven shape/length rules from Wymaganie 23 acceptance
 *   criteria 2, 3 and 5 in one pure, dependency-free function. Wymaganie 44
 *   #2 explicitly requires the server to re-run the same checks the client
 *   already does, so the same module is also imported by the React form.
 * - The function never throws on bad input; everything is reported as a
 *   structured `errors[]` list whose `field` keys mirror the payload fields,
 *   so a UI can attach messages directly to the offending input.
 * - Consent and target identification are validated as part of the body
 *   shape (review may target either a Restaurant or an Attraction; the
 *   route handler later resolves and verifies that the target exists and is
 *   published — that DB-aware step is intentionally outside this module).
 * - This module MUST stay free of runtime dependencies (no Supabase, no
 *   React, no Zod, etc.) so it can be unit-tested in isolation and reused
 *   on both edge and Node runtimes — same rule as `booking-inquiry.ts`.
 *
 * Wymagania: 23, 44.
 */

import {
  MAX_REVIEW_BODY,
  MAX_SIGNATURE,
  MIN_REVIEW_BODY,
  MIN_SIGNATURE,
} from '@/lib/constants';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Shape of the JSON payload accepted by `validateReview`. Every field is
 * intentionally optional / `unknown` so that wire data with missing or
 * mistyped fields can flow into the validator and be reported back as
 * errors instead of crashing the route handler.
 */
export interface ReviewPayload {
  targetType?: unknown;
  targetId?: unknown;
  signature?: unknown;
  rating?: unknown;
  body?: unknown;
  consent?: unknown;
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

/** Allowed values of `targetType`. */
export const REVIEW_TARGET_TYPES = ['restaurant', 'attraction'] as const;
export type ReviewTargetType = (typeof REVIEW_TARGET_TYPES)[number];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Canonical UUID v1–v5 shape (8-4-4-4-12 hex). Postgres `gen_random_uuid()`
 * yields v4 strings; we accept any valid UUID string here and let the DB
 * reject foreign references that don't exist.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True if value is a string (possibly empty) — for length-based checks. */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** True if value is a finite integer. */
function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

/** True if value matches the canonical UUID shape. */
function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate an inbound review payload. Returns `{ ok: true }` on success,
 * otherwise a list of errors.
 *
 * Each rule corresponds to one acceptance criterion of Wymaganie 23:
 *  - signature length 2–60 (Wym. 23 #2) — `MIN_SIGNATURE`/`MAX_SIGNATURE`.
 *  - body length 10–1000 (Wym. 23 #2) — `MIN_REVIEW_BODY`/`MAX_REVIEW_BODY`.
 *  - rating integer 1–5 (Wym. 23 #3).
 *  - consent must be exactly `true` (Wym. 23 #1, #5; Wym. 44 #2).
 *  - `targetType` must be one of {restaurant, attraction} (Wym. 23 #4).
 *  - `targetId` must be a UUID string (Wym. 23 #4 — needed to attach the
 *    review to the correct target row).
 *
 * Whitespace policy mirrors `booking-inquiry.ts`: textual fields are
 * length-checked AFTER trimming, so a 60-character signature padded with
 * trailing spaces is treated the same as one without.
 */
export function validateReview(payload: ReviewPayload): ValidationResult {
  const errors: ValidationError[] = [];

  // --- targetType (Wym. 23 #4) ---------------------------------------------
  if (!isString(payload.targetType) || payload.targetType.length === 0) {
    errors.push({ field: 'targetType', message: 'Pole jest wymagane' });
  } else if (!REVIEW_TARGET_TYPES.includes(payload.targetType as ReviewTargetType)) {
    errors.push({
      field: 'targetType',
      message: 'Nieprawidłowy typ celu opinii',
    });
  }

  // --- targetId (Wym. 23 #4) -----------------------------------------------
  if (!isString(payload.targetId) || payload.targetId.length === 0) {
    errors.push({ field: 'targetId', message: 'Pole jest wymagane' });
  } else if (!isUuid(payload.targetId)) {
    errors.push({
      field: 'targetId',
      message: 'Nieprawidłowy identyfikator celu opinii',
    });
  }

  // --- signature length (Wym. 23 #2) ---------------------------------------
  if (!isString(payload.signature) || payload.signature.trim().length === 0) {
    errors.push({ field: 'signature', message: 'Pole jest wymagane' });
  } else {
    const len = payload.signature.trim().length;
    if (len < MIN_SIGNATURE || len > MAX_SIGNATURE) {
      errors.push({
        field: 'signature',
        message: `Podpis musi mieć od ${MIN_SIGNATURE} do ${MAX_SIGNATURE} znaków`,
      });
    }
  }

  // --- rating integer 1..5 (Wym. 23 #3) ------------------------------------
  if (payload.rating === undefined || payload.rating === null || payload.rating === '') {
    errors.push({ field: 'rating', message: 'Pole jest wymagane' });
  } else if (!isInteger(payload.rating)) {
    errors.push({
      field: 'rating',
      message: 'Ocena musi być liczbą całkowitą',
    });
  } else if ((payload.rating as number) < 1 || (payload.rating as number) > 5) {
    errors.push({
      field: 'rating',
      message: 'Ocena musi mieścić się w zakresie 1–5',
    });
  }

  // --- body length (Wym. 23 #2) --------------------------------------------
  if (!isString(payload.body) || payload.body.trim().length === 0) {
    errors.push({ field: 'body', message: 'Pole jest wymagane' });
  } else {
    const len = payload.body.trim().length;
    if (len < MIN_REVIEW_BODY || len > MAX_REVIEW_BODY) {
      errors.push({
        field: 'body',
        message: `Treść opinii musi mieć od ${MIN_REVIEW_BODY} do ${MAX_REVIEW_BODY} znaków`,
      });
    }
  }

  // --- consent must be true (Wym. 23 #1, #5; Wym. 44 #2) -------------------
  if (payload.consent === undefined || payload.consent === null) {
    errors.push({ field: 'consent', message: 'Pole jest wymagane' });
  } else if (payload.consent !== true) {
    errors.push({
      field: 'consent',
      message: 'Wymagana zgoda na publikację',
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
