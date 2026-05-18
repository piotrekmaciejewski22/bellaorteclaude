/**
 * Server-side validation for the public Guest_Photo upload endpoint
 * (`POST /api/guest-photos`).
 *
 * - Implements the file shape and size rules from Wymaganie 24 acceptance
 *   criteria 2 and 3 in one pure, dependency-free function. Wymaganie 44
 *   #3 explicitly requires the server to re-run the same checks the client
 *   already does, so the same module is also imported by the React form.
 * - The function never throws on bad input; everything is reported as a
 *   structured `errors[]` list whose `field` keys mirror the payload fields,
 *   so a UI can attach messages directly to the offending input.
 * - The endpoint accepts `multipart/form-data`, so the file arrives as a
 *   Web `File` and the rest of the metadata as form fields. We only depend
 *   on the trio (`size`, `type`, `name`) of the Web `File` interface so
 *   that this module stays runtime-agnostic and trivially testable with a
 *   plain object cast to the local `GuestPhotoFile` shape.
 * - Target identification mirrors `validateReview`: a Guest_Photo always
 *   belongs to either a Restaurant or an Attraction. Optionally the photo
 *   may be linked to a Review through `reviewId` — when present it must be
 *   a UUID. The route handler later resolves and verifies the target row;
 *   that DB-aware step is intentionally outside this module.
 * - This module MUST stay free of runtime dependencies (no Supabase, no
 *   React, no Zod, etc.) so it can be unit-tested in isolation and reused
 *   on both edge and Node runtimes — same rule as `booking-inquiry.ts` and
 *   `review.ts`.
 *
 * Wymagania: 24, 44.
 */

import { ALLOWED_PHOTO_MIME, MAX_PHOTO_BYTES } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Minimal subset of the Web `File` interface that the validator needs. Using
 * a structural alias instead of `File` lets tests pass plain object literals
 * without constructing an actual `Blob`/`File` (the DOM `File` constructor
 * is not available on every Node runtime).
 */
export interface GuestPhotoFile {
  size: number;
  type: string;
  name: string;
}

/**
 * Shape of the metadata payload accepted by `validateGuestPhoto`. Every field
 * is intentionally optional / `unknown` so that wire data with missing or
 * mistyped fields can flow into the validator and be reported back as
 * errors instead of crashing the route handler.
 */
export interface GuestPhotoPayload {
  targetType?: unknown;
  targetId?: unknown;
  /** Optional — set when the photo is uploaded together with a Review. */
  reviewId?: unknown;
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

/** Allowed values of `targetType`. Mirrors `validateReview`. */
export const GUEST_PHOTO_TARGET_TYPES = ['restaurant', 'attraction'] as const;
export type GuestPhotoTargetType = (typeof GUEST_PHOTO_TARGET_TYPES)[number];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Canonical UUID v1–v5 shape (8-4-4-4-12 hex). Matches the regex used in
 * `validateReview` so that all public validators agree on what counts as a
 * UUID string on the wire.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Set lookup of allowed MIME types. `ALLOWED_PHOTO_MIME` is a `readonly`
 * tuple in `constants.ts`; promoting it to a `Set<string>` once here keeps
 * the per-call cost of the membership check at O(1).
 */
const ALLOWED_MIME_SET: ReadonlySet<string> = new Set<string>(ALLOWED_PHOTO_MIME);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True if value is a non-empty string after trimming. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** True if value matches the canonical UUID shape. */
function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/**
 * Narrow `value` to the structural `GuestPhotoFile` shape. Returns `false`
 * for `null`, `undefined`, primitives and any object missing the trio of
 * properties we actually use. Type-correctness of those properties is
 * checked separately so that a "wrong file shape" error and a "wrong MIME"
 * error don't fire for the same payload.
 */
function isGuestPhotoFileLike(value: unknown): value is GuestPhotoFile {
  if (value === null || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return 'size' in obj && 'type' in obj && 'name' in obj;
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate an inbound guest-photo upload. Returns `{ ok: true }` on success,
 * otherwise a list of errors.
 *
 * Each rule corresponds to one acceptance criterion of Wymaganie 24:
 *  - file MIME must be one of `ALLOWED_PHOTO_MIME` (Wym. 24 #2).
 *  - file size must be ≤ `MAX_PHOTO_BYTES` (Wym. 24 #3).
 *  - `targetType` must be one of {restaurant, attraction} (Wym. 24 #4 — a
 *    Guest_Photo always belongs to a Restaurant or Attraction row).
 *  - `targetId` must be a UUID string (Wym. 24 #4).
 *  - `reviewId` is optional. When present (non-empty) it must be a UUID.
 *    Wymaganie 24 #1 explicitly allows the photo to be uploaded "razem z
 *    Review lub jako osobny upload".
 *
 * The 8 MiB limit and the JPEG/PNG/WebP whitelist are reported with the
 * exact text required by Wymaganie 24 #5 ("komunikat błędu opisujący
 * dozwolone formaty i limit rozmiaru").
 */
export function validateGuestPhoto(
  file: unknown,
  payload: GuestPhotoPayload,
): ValidationResult {
  const errors: ValidationError[] = [];

  // --- file shape & content (Wym. 24 #2, #3, #5) ---------------------------
  if (!isGuestPhotoFileLike(file)) {
    errors.push({ field: 'file', message: 'Plik jest wymagany' });
  } else {
    // MIME type whitelist (Wym. 24 #2). Reject empty/non-string `type`
    // separately from a "wrong MIME" so that the user gets a clear message.
    if (typeof file.type !== 'string' || file.type.length === 0) {
      errors.push({
        field: 'file',
        message:
          'Nieprawidłowy typ pliku. Dozwolone formaty: JPEG, PNG, WebP',
      });
    } else if (!ALLOWED_MIME_SET.has(file.type)) {
      errors.push({
        field: 'file',
        message:
          'Nieprawidłowy typ pliku. Dozwolone formaty: JPEG, PNG, WebP',
      });
    }

    // Size limit (Wym. 24 #3). Negative or non-finite sizes are also
    // treated as invalid; a real upload always reports a finite byte count.
    if (typeof file.size !== 'number' || !Number.isFinite(file.size) || file.size < 0) {
      errors.push({
        field: 'file',
        message: 'Nieprawidłowy rozmiar pliku',
      });
    } else if (file.size > MAX_PHOTO_BYTES) {
      errors.push({
        field: 'file',
        message: 'Plik jest za duży. Maksymalny rozmiar to 8 MB',
      });
    }
  }

  // --- targetType (Wym. 24 #4) ---------------------------------------------
  if (!isNonEmptyString(payload.targetType)) {
    errors.push({ field: 'targetType', message: 'Pole jest wymagane' });
  } else if (
    !GUEST_PHOTO_TARGET_TYPES.includes(payload.targetType as GuestPhotoTargetType)
  ) {
    errors.push({
      field: 'targetType',
      message: 'Nieprawidłowy typ celu zdjęcia',
    });
  }

  // --- targetId (Wym. 24 #4) -----------------------------------------------
  if (!isNonEmptyString(payload.targetId)) {
    errors.push({ field: 'targetId', message: 'Pole jest wymagane' });
  } else if (!isUuid(payload.targetId)) {
    errors.push({
      field: 'targetId',
      message: 'Nieprawidłowy identyfikator celu zdjęcia',
    });
  }

  // --- reviewId (Wym. 24 #1, optional) -------------------------------------
  // The upload may be standalone (`reviewId` omitted, `null`, `undefined` or
  // empty string) or coupled to a review (`reviewId` set to a UUID).
  if (
    payload.reviewId !== undefined &&
    payload.reviewId !== null &&
    payload.reviewId !== ''
  ) {
    if (!isUuid(payload.reviewId)) {
      errors.push({
        field: 'reviewId',
        message: 'Nieprawidłowy identyfikator opinii',
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
