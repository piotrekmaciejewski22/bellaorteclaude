/**
 * `POST /api/booking-inquiries` — public Booking_Form submission.
 *
 * Pipeline:
 *   1. Rate limit by IP (10 req / 10 min, Wym. 12 #4).
 *   2. JSON parse, validate against payload rules (Wym. 10).
 *   3. Resolve apartment for capacity check.
 *   4. Create inquiry with conflict detection (Wym. 10 #5).
 *   5. Return `201 { id }` — never any PII (Wym. 42).
 *
 * The handler uses the service-role client because:
 *   - RLS denies anon INSERT on `booking_inquiries` (Wym. 38).
 *   - Conflict detection reads `reservations` and `calendar_blocks`
 *     which anon cannot SELECT (Wym. 42).
 *
 * Wymagania pokryte: 9, 10, 12, 44.
 */

import { NextResponse } from 'next/server';

import { createBookingInquiry, ConflictError } from '@/lib/data/booking';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit/memory-store';
import { createServiceClient } from '@/lib/supabase/admin';
import { validateBookingInquiry } from '@/lib/validation/booking-inquiry';

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`booking-inquiries:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zbyt wiele prób. Spróbuj ponownie za chwilę.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Nieprawidłowy format JSON' },
      { status: 400 },
    );
  }

  const apartmentId =
    typeof (payload as { apartmentId?: unknown })?.apartmentId === 'string'
      ? ((payload as { apartmentId: string }).apartmentId)
      : null;

  if (!apartmentId) {
    return NextResponse.json(
      { errors: [{ field: 'apartmentId', message: 'Pole jest wymagane' }] },
      { status: 400 },
    );
  }

  const client = createServiceClient();

  // Resolve apartment for capacity check (Wym. 10 #7).
  const apartmentRes = await client
    .from('apartments')
    .select('id, max_guests, published_at')
    .eq('id', apartmentId)
    .maybeSingle();

  if (apartmentRes.error) {
    console.error('apartment lookup failed:', apartmentRes.error);
    return NextResponse.json(
      { error: 'Wystąpił błąd serwera' },
      { status: 500 },
    );
  }
  if (!apartmentRes.data || !apartmentRes.data.published_at) {
    return NextResponse.json(
      { errors: [{ field: 'apartmentId', message: 'Apartament nie istnieje' }] },
      { status: 400 },
    );
  }

  const apartment = {
    id: apartmentRes.data.id,
    maxGuests: apartmentRes.data.max_guests,
  };

  // Validate payload (Wym. 10).
  const result = validateBookingInquiry(
    payload as Record<string, unknown>,
    apartment,
  );
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const p = payload as {
    apartmentId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children?: number;
    fullName: string;
    email: string;
    phone?: string | null;
    message?: string | null;
  };

  try {
    const inquiry = await createBookingInquiry(
      client,
      {
        apartmentId: p.apartmentId,
        checkIn: p.checkIn,
        checkOut: p.checkOut,
        adults: p.adults,
        children: p.children,
        fullName: p.fullName,
        email: p.email,
        phone: p.phone ?? null,
        message: p.message ?? null,
      },
      ip === 'unknown' ? null : ip,
    );

    // Return ONLY the id — no PII (Wym. 42).
    return NextResponse.json({ id: inquiry.id }, { status: 201 });
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json(
        { error: 'Wybrane terminy są niedostępne' },
        { status: 409 },
      );
    }
    console.error('POST /api/booking-inquiries failed:', err);
    return NextResponse.json(
      { error: 'Nie udało się utworzyć zapytania' },
      { status: 500 },
    );
  }
}
