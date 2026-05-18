/**
 * `GET /api/availability` — public availability calendar API.
 *
 * Query params:
 *   - apartmentId — UUID of the apartment.
 *   - from        — ISO YYYY-MM-DD, inclusive window start.
 *   - to          — ISO YYYY-MM-DD, inclusive window end.
 *
 * Returns JSON:
 *   { days: Array<{ date: string, status: DayStatus }> }
 *
 * NEVER returns guest PII; the underlying RPC `get_availability` returns
 * only `(date, status)` pairs (Wymaganie 42).
 *
 * Wymagania pokryte: 7, 42.
 */

import { NextResponse } from 'next/server';

import { getAvailability } from '@/lib/data/availability';
import { createServerClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const apartmentId = url.searchParams.get('apartmentId');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!apartmentId || !UUID_RE.test(apartmentId)) {
    return NextResponse.json(
      { error: 'Nieprawidłowy lub brakujący apartmentId' },
      { status: 400 },
    );
  }
  if (!from || !ISO_DATE_RE.test(from)) {
    return NextResponse.json(
      { error: 'Nieprawidłowy lub brakujący parametr from (YYYY-MM-DD)' },
      { status: 400 },
    );
  }
  if (!to || !ISO_DATE_RE.test(to)) {
    return NextResponse.json(
      { error: 'Nieprawidłowy lub brakujący parametr to (YYYY-MM-DD)' },
      { status: 400 },
    );
  }
  if (from > to) {
    return NextResponse.json(
      { error: 'Parametr from musi być wcześniejszy lub równy to' },
      { status: 400 },
    );
  }

  try {
    const client = await createServerClient();
    const days = await getAvailability(client, apartmentId, from, to);
    return NextResponse.json({ days });
  } catch (err) {
    console.error('GET /api/availability failed:', err);
    return NextResponse.json(
      { error: 'Nie udało się pobrać dostępności' },
      { status: 500 },
    );
  }
}
