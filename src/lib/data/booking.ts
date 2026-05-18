/**
 * Booking inquiry data layer.
 *
 * Encapsulates the database side of the public Booking_Form flow:
 * conflict detection against active reservations and admin calendar
 * blocks, then INSERT into `booking_inquiries` with `status = 'pending'`.
 *
 * The validator (`src/lib/validation/booking-inquiry.ts`) is the only
 * source of payload-level rules; this module owns the DB-aware checks
 * (Wym. 10 #5 conflict, Wym. 30 #6 audit fields).
 *
 * The function is client-agnostic: callers pass either the cookies-aware
 * server client or — for the rate-limited public POST path — the
 * service-role client. Picking the right client is the caller's job.
 *
 * Wymagania pokryte: 9, 10 #5, 30 #6.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { BookingInquiry } from '@/lib/types';

/** Payload accepted by `createBookingInquiry`. Matches the validator output. */
export interface CreateBookingInquiryInput {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  fullName: string;
  email: string;
  phone?: string | null;
  message?: string | null;
}

/**
 * Thrown when the requested date range overlaps an existing active
 * reservation or an admin calendar block. The route handler maps this to
 * HTTP 409 (Wym. 10 #5).
 */
export class ConflictError extends Error {
  constructor(message = 'Wybrane terminy są niedostępne') {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Insert a new pending booking inquiry after verifying the date range is
 * free.
 *
 * Conflict detection runs two parallel queries against `reservations`
 * (status = 'active') and `calendar_blocks`. Each uses the half-open
 * range overlap predicate `[check_in, check_out)` × `[$from, $to)`
 * encoded with the standard SQL pattern
 * `existing.start < $to AND existing.end > $from`.
 *
 * Database-level safety nets:
 *   - The `reservations` table has an EXCLUDE constraint preventing two
 *     active rows from overlapping for the same apartment (task 2.1).
 *   - RLS prevents anon SELECT on these tables; the route handler uses
 *     the service-role client to query them.
 *
 * On success the row is mapped from snake_case columns to the camelCase
 * `BookingInquiry` shape used by the rest of the app.
 *
 * @throws {ConflictError} when the range overlaps an active reservation
 *   or a calendar block.
 * @throws {Error} for any other DB failure.
 */
export async function createBookingInquiry(
  client: SupabaseClient,
  payload: CreateBookingInquiryInput,
  ip: string | null,
): Promise<BookingInquiry> {
  const { apartmentId, checkIn, checkOut } = payload;

  // 1. Conflict against active reservations.
  const reservationsCheck = await client
    .from('reservations')
    .select('id')
    .eq('apartment_id', apartmentId)
    .eq('status', 'active')
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)
    .limit(1);

  if (reservationsCheck.error) {
    throw new Error(
      `createBookingInquiry: reservations conflict check failed: ${reservationsCheck.error.message}`,
    );
  }
  if (reservationsCheck.data && reservationsCheck.data.length > 0) {
    throw new ConflictError();
  }

  // 2. Conflict against calendar blocks.
  const blocksCheck = await client
    .from('calendar_blocks')
    .select('id')
    .eq('apartment_id', apartmentId)
    .lt('start_date', checkOut)
    .gt('end_date', checkIn)
    .limit(1);

  if (blocksCheck.error) {
    throw new Error(
      `createBookingInquiry: calendar_blocks conflict check failed: ${blocksCheck.error.message}`,
    );
  }
  if (blocksCheck.data && blocksCheck.data.length > 0) {
    throw new ConflictError();
  }

  // 3. INSERT new inquiry.
  const insert = await client
    .from('booking_inquiries')
    .insert({
      apartment_id: apartmentId,
      check_in: checkIn,
      check_out: checkOut,
      adults: payload.adults,
      children: payload.children ?? 0,
      guest_full_name: payload.fullName,
      guest_email: payload.email,
      guest_phone: payload.phone ?? null,
      message: payload.message ?? null,
      consent_at: new Date().toISOString(),
      status: 'pending',
      source_ip: ip,
    })
    .select(
      'id, apartment_id, check_in, check_out, adults, children, guest_full_name, guest_email, guest_phone, message, consent_at, status, source_ip, admin_note, created_at, updated_at',
    )
    .single();

  if (insert.error) {
    // Postgres exclusion / unique violations land here as well. Map them
    // to ConflictError so the route handler returns 409 consistently.
    if (insert.error.code === '23P01' || insert.error.code === '23505') {
      throw new ConflictError();
    }
    throw new Error(
      `createBookingInquiry: insert failed: ${insert.error.message}`,
    );
  }

  const row = insert.data;
  return {
    id: row.id,
    apartmentId: row.apartment_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    adults: row.adults,
    children: row.children,
    guestFullName: row.guest_full_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    message: row.message,
    consentAt: row.consent_at,
    status: row.status,
    sourceIp: row.source_ip,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
