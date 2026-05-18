/**
 * `PATCH /api/admin/reservations/[id]` — update notes or dates.
 * `DELETE /api/admin/reservations/[id]` — soft-cancel (status='cancelled').
 *
 * The DB EXCLUDE constraint on `reservations` prevents date overlap with
 * other active rows, so a date PATCH that would cause a clash returns
 * 409 surfaced from Postgres error code 23P01.
 *
 * Wymagania pokryte: 30 #5.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface PatchBody {
  checkIn?: string;
  checkOut?: string;
  adminNote?: string | null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: 'Nieprawidłowy identyfikator' },
      { status: 400 },
    );
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.checkIn !== undefined) {
    if (!ISO_DATE_RE.test(body.checkIn)) {
      return NextResponse.json(
        { errors: [{ field: 'checkIn', message: 'Wymagany format YYYY-MM-DD' }] },
        { status: 400 },
      );
    }
    update.check_in = body.checkIn;
  }
  if (body.checkOut !== undefined) {
    if (!ISO_DATE_RE.test(body.checkOut)) {
      return NextResponse.json(
        { errors: [{ field: 'checkOut', message: 'Wymagany format YYYY-MM-DD' }] },
        { status: 400 },
      );
    }
    update.check_out = body.checkOut;
  }
  if (body.adminNote !== undefined) update.admin_note = body.adminNote;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('reservations').update(update).eq('id', id);
  if (error) {
    if (error.code === '23P01' || error.code === '23505') {
      return NextResponse.json(
        { error: 'Nowy zakres dat koliduje z istniejącą rezerwacją' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: `Nie udało się zaktualizować rezerwacji: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/admin/reservations');
  revalidatePath('/admin/calendar');
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: 'Nieprawidłowy identyfikator' },
      { status: 400 },
    );
  }

  const client = createServiceClient();
  // Soft cancel — the EXCLUDE constraint releases the date range because
  // the predicate is `WHERE status = 'active'`.
  const { error } = await client
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się anulować rezerwacji: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/admin/reservations');
  revalidatePath('/admin/calendar');
  return NextResponse.json({ ok: true });
}
