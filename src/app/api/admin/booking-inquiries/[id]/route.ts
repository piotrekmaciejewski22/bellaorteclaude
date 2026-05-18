/**
 * `PATCH /api/admin/booking-inquiries/[id]` — admin moderation of inquiries.
 *
 * Body: { action?: 'confirm'|'reject', adminNote?: string }
 *
 * On `confirm`:
 *   - Conflict check against active reservations and calendar blocks.
 *   - INSERT a new `reservations` row (DB EXCLUDE constraint provides
 *     a second safety net).
 *   - UPDATE inquiry to status='confirmed'.
 *   - Returns 409 on conflict.
 *
 * On `reject`: UPDATE status='rejected'.
 *
 * Wymagania pokryte: 30 #3, #4, #6.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  let body: { action?: string; adminNote?: string };
  try {
    body = (await request.json()) as { action?: string; adminNote?: string };
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  const client = createServiceClient();

  // Fetch inquiry first.
  const inquiry = await client
    .from('booking_inquiries')
    .select('id, apartment_id, check_in, check_out, status')
    .eq('id', id)
    .maybeSingle();

  if (inquiry.error || !inquiry.data) {
    return NextResponse.json(
      { error: 'Zapytanie nie istnieje' },
      { status: 404 },
    );
  }

  if (body.action === 'confirm') {
    if (inquiry.data.status !== 'pending') {
      return NextResponse.json(
        { error: 'Można potwierdzać tylko zapytania ze statusem pending' },
        { status: 400 },
      );
    }

    // Conflict check.
    const conflicts = await client
      .from('reservations')
      .select('id')
      .eq('apartment_id', inquiry.data.apartment_id)
      .eq('status', 'active')
      .lt('check_in', inquiry.data.check_out)
      .gt('check_out', inquiry.data.check_in)
      .limit(1);
    if (conflicts.error) {
      return NextResponse.json(
        { error: 'Błąd sprawdzania konfliktów' },
        { status: 500 },
      );
    }
    if (conflicts.data && conflicts.data.length > 0) {
      return NextResponse.json(
        { error: 'Termin koliduje z istniejącą rezerwacją' },
        { status: 409 },
      );
    }

    const blocks = await client
      .from('calendar_blocks')
      .select('id')
      .eq('apartment_id', inquiry.data.apartment_id)
      .lt('start_date', inquiry.data.check_out)
      .gt('end_date', inquiry.data.check_in)
      .limit(1);
    if (blocks.error) {
      return NextResponse.json(
        { error: 'Błąd sprawdzania blokad' },
        { status: 500 },
      );
    }
    if (blocks.data && blocks.data.length > 0) {
      return NextResponse.json(
        { error: 'Termin koliduje z blokadą' },
        { status: 409 },
      );
    }

    // INSERT reservation.
    const insert = await client.from('reservations').insert({
      apartment_id: inquiry.data.apartment_id,
      inquiry_id: inquiry.data.id,
      check_in: inquiry.data.check_in,
      check_out: inquiry.data.check_out,
      status: 'active',
      admin_note: body.adminNote ?? null,
    });
    if (insert.error) {
      if (insert.error.code === '23P01' || insert.error.code === '23505') {
        return NextResponse.json(
          { error: 'Termin został w międzyczasie zajęty' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: `Nie udało się utworzyć rezerwacji: ${insert.error.message}` },
        { status: 500 },
      );
    }

    const update = await client
      .from('booking_inquiries')
      .update({
        status: 'confirmed',
        admin_note: body.adminNote ?? null,
      })
      .eq('id', id);
    if (update.error) {
      return NextResponse.json(
        { error: 'Nie udało się zaktualizować zapytania' },
        { status: 500 },
      );
    }

    revalidatePath('/admin/reservations');
    revalidatePath('/admin/calendar');
    revalidatePath('/admin');
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'reject') {
    const update = await client
      .from('booking_inquiries')
      .update({ status: 'rejected', admin_note: body.adminNote ?? null })
      .eq('id', id);
    if (update.error) {
      return NextResponse.json(
        { error: 'Nie udało się zaktualizować zapytania' },
        { status: 500 },
      );
    }
    revalidatePath('/admin/reservations');
    revalidatePath('/admin');
    return NextResponse.json({ ok: true });
  }

  // Note-only update.
  if (typeof body.adminNote === 'string') {
    const update = await client
      .from('booking_inquiries')
      .update({ admin_note: body.adminNote })
      .eq('id', id);
    if (update.error) {
      return NextResponse.json(
        { error: 'Nie udało się zaktualizować notatki' },
        { status: 500 },
      );
    }
    revalidatePath('/admin/reservations');
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: 'Nieznana akcja' },
    { status: 400 },
  );
}
