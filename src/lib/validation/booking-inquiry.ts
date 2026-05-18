/**
 * Server-side validation for the public Booking_Form (`POST /api/booking-inquiries`).
 *
 * - Implements the eight rules from Wymaganie 10 (acceptance criteria 1–8) in
 *   one pure, dependency-free function. The same shape of errors is consumed
 *   by the client-side `BookingForm` component (Wymaganie 12 #2: server uses
 *   the same rules as the client).
 * - The function never throws on bad input; everything is reported as a
 *   structured `errors[]` list whose `field` keys mirror the payload fields,
 *   so a UI can attach messages directly to the offending input.
 * - Date fields are treated as `YYYY-MM-DD` strings (Postgres `DATE`). The
 *   "today" reference defaults to the local date but can be injected for
 *   tests via the third argument.
 * - This module MUST stay free of runtime dependencies (no Supabase, no
 *   React, no Zod, etc.) so it can be unit-tested in isolation and reused on
 *   both edge and Node runtimes.
 *
 * Wymagania: 10, 12, 44.
 */

import type { Apartment } from '@/lib/types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Shape of the JSON payload accepted by `validateBookingInquiry`. Every field
 * is intentionally optional / `unknown` so that wire data with missing or
 * mistyped fields can flow into the validator and be reported back as errors
 * instead of crashing the route handler.
 */
export interface BookingInquiryPayload {
  apartmentId?: unknown;
  checkIn?: unknown;
  checkOut?: unknown;
  adults?: unknown;
  children?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Pragmatic email regex. Not full RFC 5322 (no one writes that by hand) but
 * tight enough to reject obvious typos: requires `local@domain.tld` with
 * non-empty parts and at least one dot in the domain.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strict `YYYY-MM-DD` shape (cheap pre-check before `Date` parsing). */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

/**
 * Parse a `YYYY-MM-DD` string into a UTC midnight Date, or `null` if it does
 * not match the expected shape or refers to a non-existent calendar day
 * (e.g. `2025-02-30`).
 */
function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

/**
 * Format a Date as `YYYY-MM-DD` in UTC. Used to derive the "today" boundary
 * from the injected `now` reference.
 */
function toIsoDate(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate an inbound booking inquiry payload against the apartment it
 * targets. Returns `{ ok: true }` on success, otherwise a list of errors.
 *
 * Each rule corresponds to one acceptance criterion of Wymaganie 10:
 *  1. Required fields present (`apartmentId`, `checkIn`, `checkOut`, `adults`,
 *     `fullName`, `email`, `consent`).
 *  2. `checkOut > checkIn`.
 *  3. `checkIn >= today`.
 *  4. `email` matches the email regex.
 *  6. `adults >= 1`.
 *  7. `adults + children <= apartment.maxGuests`.
 *  8. `consent === true`.
 *
 * Criterion 5 (overlap with reserved/blocked days) is enforced at the data
 * layer in `createBookingInquiry` (task 3.3) since it requires a database
 * round-trip.
 *
 * @param payload — raw JSON body parsed from the request.
 * @param apartment — the resolved apartment row (looked up by `apartmentId`).
 * @param now — reference time for the "in the past" check; defaults to
 *   `new Date()` and is injected by tests.
 */
export function validateBookingInquiry(
  payload: BookingInquiryPayload,
  apartment: Pick<Apartment, 'id' | 'maxGuests'>,
  now: Date = new Date(),
): ValidationResult {
  const errors: ValidationError[] = [];

  // --- 1. Required fields (Wym. 10 #1) -------------------------------------
  // Order: apartmentId, checkIn, checkOut, adults, fullName, email, consent.
  // `consent` is required as a value but its truthiness is checked in #8.
  const apartmentIdOk = isNonEmptyString(payload.apartmentId);
  const checkInPresent = isNonEmptyString(payload.checkIn);
  const checkOutPresent = isNonEmptyString(payload.checkOut);
  const adultsPresent =
    payload.adults !== undefined && payload.adults !== null && payload.adults !== '';
  const fullNameOk = isNonEmptyString(payload.fullName);
  const emailPresent = isNonEmptyString(payload.email);
  const consentPresent = payload.consent !== undefined && payload.consent !== null;

  if (!apartmentIdOk) {
    errors.push({ field: 'apartmentId', message: 'Pole jest wymagane' });
  }
  if (!checkInPresent) {
    errors.push({ field: 'checkIn', message: 'Pole jest wymagane' });
  }
  if (!checkOutPresent) {
    errors.push({ field: 'checkOut', message: 'Pole jest wymagane' });
  }
  if (!adultsPresent) {
    errors.push({ field: 'adults', message: 'Pole jest wymagane' });
  }
  if (!fullNameOk) {
    errors.push({ field: 'fullName', message: 'Pole jest wymagane' });
  }
  if (!emailPresent) {
    errors.push({ field: 'email', message: 'Pole jest wymagane' });
  }
  if (!consentPresent) {
    errors.push({ field: 'consent', message: 'Pole jest wymagane' });
  }

  // --- 2 & 3. Date relationships (Wym. 10 #2, #3) --------------------------
  // We only run these when both date strings are present so that "missing
  // field" errors don't double up with "in the past" / "checkOut < checkIn".
  const checkInDate = checkInPresent ? parseIsoDate(payload.checkIn) : null;
  const checkOutDate = checkOutPresent ? parseIsoDate(payload.checkOut) : null;

  if (checkInPresent && checkInDate === null) {
    errors.push({
      field: 'checkIn',
      message: 'Nieprawidłowy format daty (YYYY-MM-DD)',
    });
  }
  if (checkOutPresent && checkOutDate === null) {
    errors.push({
      field: 'checkOut',
      message: 'Nieprawidłowy format daty (YYYY-MM-DD)',
    });
  }

  if (checkInDate !== null) {
    const todayIso = toIsoDate(now);
    const todayDate = parseIsoDate(todayIso)!;
    if (checkInDate.getTime() < todayDate.getTime()) {
      errors.push({
        field: 'checkIn',
        message: 'Data przyjazdu nie może być w przeszłości',
      });
    }
  }

  if (checkInDate !== null && checkOutDate !== null) {
    if (checkOutDate.getTime() <= checkInDate.getTime()) {
      errors.push({
        field: 'checkOut',
        message: 'Data wyjazdu musi być późniejsza niż data przyjazdu',
      });
    }
  }

  // --- 4. Email format (Wym. 10 #4) ----------------------------------------
  if (emailPresent) {
    const emailValue = (payload.email as string).trim();
    if (!EMAIL_RE.test(emailValue)) {
      errors.push({
        field: 'email',
        message: 'Nieprawidłowy format adresu email',
      });
    }
  }

  // --- 6. Adults >= 1 (Wym. 10 #6) -----------------------------------------
  // Also reports a type error if `adults` is present but not an integer.
  if (adultsPresent) {
    if (!isInteger(payload.adults)) {
      errors.push({
        field: 'adults',
        message: 'Liczba dorosłych musi być liczbą całkowitą',
      });
    } else if ((payload.adults as number) < 1) {
      errors.push({
        field: 'adults',
        message: 'Wymagana co najmniej 1 osoba dorosła',
      });
    }
  }

  // `children` is optional; default to 0. If present, must be an int >= 0.
  let childrenCount = 0;
  const childrenProvided =
    payload.children !== undefined && payload.children !== null && payload.children !== '';
  if (childrenProvided) {
    if (!isInteger(payload.children)) {
      errors.push({
        field: 'children',
        message: 'Liczba dzieci musi być liczbą całkowitą',
      });
    } else if ((payload.children as number) < 0) {
      errors.push({
        field: 'children',
        message: 'Liczba dzieci nie może być ujemna',
      });
    } else {
      childrenCount = payload.children as number;
    }
  }

  // --- 7. Total guests <= apartment capacity (Wym. 10 #7) ------------------
  // Run only when adult count is a valid non-negative integer; otherwise the
  // earlier errors already cover the broken state.
  if (
    isInteger(payload.adults) &&
    (payload.adults as number) >= 1 &&
    !errors.some((e) => e.field === 'children')
  ) {
    const total = (payload.adults as number) + childrenCount;
    if (total > apartment.maxGuests) {
      errors.push({
        field: 'adults',
        message: `Liczba gości przekracza pojemność apartamentu (max ${apartment.maxGuests})`,
      });
    }
  }

  // --- 8. Consent must be exactly `true` (Wym. 10 #8) ----------------------
  if (consentPresent && payload.consent !== true) {
    errors.push({
      field: 'consent',
      message: 'Wymagana zgoda na kontakt',
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
