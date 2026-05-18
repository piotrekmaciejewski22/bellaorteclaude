/**
 * `PATCH /api/admin/rome/itinerary/[id]` — edit an itinerary point.
 * `DELETE /api/admin/rome/itinerary/[id]` — remove a point.
 *
 * Wymagania pokryte: 33.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DAY_PARTS = ['morning', 'noon', 'afternoon', 'evening'] as const;

interface PatchBody {
  dayPart?: string;
  title?: string;
  body?: string;
  linkedRestaurantId?: string | null;
  linkedAttractionId?: string | null;
  displayOrder?: number;
  published?: boolean;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Nieprawidłowy identyfikator' }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.dayPart !== undefined) {
    if (!(DAY_PARTS as readonly string[]).includes(body.dayPart)) {
      return NextResponse.json(
        { errors: [{ field: 'dayPart', message: 'Nieprawidłowa pora dnia' }] },
        { status: 400 },
      );
    }
    update.day_part = body.dayPart;
  }
  if (body.title !== undefined) update.title = body.title;
  if (body.body !== undefined) update.body = body.body;
  if (body.linkedRestaurantId !== undefined) update.linked_restaurant_id = body.linkedRestaurantId;
  if (body.linkedAttractionId !== undefined) update.linked_attraction_id = body.linkedAttractionId;
  if (body.displayOrder !== undefined) update.display_order = body.displayOrder;
  if (typeof body.published === 'boolean') {
    update.published_at = body.published ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('rome_itinerary').update(update).eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się zaktualizować punktu: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/rome/itinerary');
  revalidatePath('/admin/rome');

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
    return NextResponse.json({ error: 'Nieprawidłowy identyfikator' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('rome_itinerary').delete().eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się usunąć punktu: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/rome/itinerary');
  revalidatePath('/admin/rome');

  return NextResponse.json({ ok: true });
}
