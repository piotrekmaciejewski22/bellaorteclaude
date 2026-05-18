/**
 * `PATCH /api/admin/calendar-blocks/[id]` — edit a block.
 * `DELETE /api/admin/calendar-blocks/[id]` — remove a block.
 *
 * Wymagania pokryte: 29 #3, #4.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REASONS = ['maintenance', 'owner_stay', 'cleaning', 'other'] as const;

interface PatchBody {
  startsOn?: string;
  endsOn?: string;
  reason?: string;
  note?: string | null;
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
  if (body.startsOn !== undefined) {
    if (!ISO_DATE_RE.test(body.startsOn)) {
      return NextResponse.json(
        { errors: [{ field: 'startsOn', message: 'Wymagany format YYYY-MM-DD' }] },
        { status: 400 },
      );
    }
    update.start_date = body.startsOn;
  }
  if (body.endsOn !== undefined) {
    if (!ISO_DATE_RE.test(body.endsOn)) {
      return NextResponse.json(
        { errors: [{ field: 'endsOn', message: 'Wymagany format YYYY-MM-DD' }] },
        { status: 400 },
      );
    }
    update.end_date = body.endsOn;
  }
  if (body.reason !== undefined) {
    if (!(REASONS as readonly string[]).includes(body.reason)) {
      return NextResponse.json(
        { errors: [{ field: 'reason', message: 'Nieprawidłowy powód' }] },
        { status: 400 },
      );
    }
    update.reason = body.reason;
  }
  if (body.note !== undefined) update.note = body.note;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('calendar_blocks').update(update).eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się zaktualizować blokady: ${error.message}` },
      { status: 500 },
    );
  }

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
  const { error } = await client.from('calendar_blocks').delete().eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się usunąć blokady: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/admin/calendar');
  return NextResponse.json({ ok: true });
}
