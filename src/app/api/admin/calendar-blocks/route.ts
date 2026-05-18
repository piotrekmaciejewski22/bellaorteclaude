/**
 * `POST /api/admin/calendar-blocks` — create an admin calendar block.
 *
 * Body: { apartmentId, startsOn, endsOn, reason, note? }
 * Conflict-checks against active reservations → 409.
 *
 * Wymagania pokryte: 29.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REASONS = ['maintenance', 'owner_stay', 'cleaning', 'other'] as const;

interface CreateBody {
  apartmentId?: string;
  startsOn?: string;
  endsOn?: string;
  reason?: string;
  note?: string | null;
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  const errors: { field: string; message: string }[] = [];
  if (!body.apartmentId || !UUID_RE.test(body.apartmentId)) {
    errors.push({ field: 'apartmentId', message: 'Nieprawidłowy identyfikator' });
  }
  if (!body.startsOn || !ISO_DATE_RE.test(body.startsOn)) {
    errors.push({ field: 'startsOn', message: 'Wymagany format YYYY-MM-DD' });
  }
  if (!body.endsOn || !ISO_DATE_RE.test(body.endsOn)) {
    errors.push({ field: 'endsOn', message: 'Wymagany format YYYY-MM-DD' });
  }
  if (
    body.startsOn &&
    body.endsOn &&
    ISO_DATE_RE.test(body.startsOn) &&
    ISO_DATE_RE.test(body.endsOn) &&
    body.endsOn <= body.startsOn
  ) {
    errors.push({
      field: 'endsOn',
      message: 'Data końca musi być późniejsza niż data początku',
    });
  }
  if (!body.reason || !(REASONS as readonly string[]).includes(body.reason)) {
    errors.push({
      field: 'reason',
      message: `Powód musi być jednym z: ${REASONS.join(', ')}`,
    });
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const client = createServiceClient();

  // Conflict check against active reservations.
  const conflicts = await client
    .from('reservations')
    .select('id')
    .eq('apartment_id', body.apartmentId)
    .eq('status', 'active')
    .lt('check_in', body.endsOn)
    .gt('check_out', body.startsOn)
    .limit(1);
  if (conflicts.error) {
    return NextResponse.json({ error: 'Błąd sprawdzania konfliktów' }, { status: 500 });
  }
  if (conflicts.data && conflicts.data.length > 0) {
    return NextResponse.json(
      { error: 'Termin koliduje z aktywną rezerwacją' },
      { status: 409 },
    );
  }

  const insert = await client
    .from('calendar_blocks')
    .insert({
      apartment_id: body.apartmentId,
      start_date: body.startsOn,
      end_date: body.endsOn,
      reason: body.reason,
      note: body.note ?? null,
    })
    .select('id')
    .single();

  if (insert.error) {
    console.error('calendar_blocks insert:', insert.error);
    return NextResponse.json(
      { error: `Nie udało się utworzyć blokady: ${insert.error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/admin/calendar');
  revalidatePath('/admin');

  return NextResponse.json({ id: insert.data.id }, { status: 201 });
}
