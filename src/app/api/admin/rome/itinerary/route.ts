/**
 * `POST /api/admin/rome/itinerary` — create a Rome itinerary point.
 *
 * Wymagania pokryte: 33.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const DAY_PARTS = ['morning', 'noon', 'afternoon', 'evening'] as const;

interface CreateBody {
  dayPart?: string;
  title?: string;
  body?: string;
  linkedRestaurantId?: string | null;
  linkedAttractionId?: string | null;
  displayOrder?: number;
  published?: boolean;
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

  if (!body.dayPart || !(DAY_PARTS as readonly string[]).includes(body.dayPart)) {
    return NextResponse.json(
      { errors: [{ field: 'dayPart', message: 'Nieprawidłowa pora dnia' }] },
      { status: 400 },
    );
  }
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    return NextResponse.json(
      { errors: [{ field: 'title', message: 'Tytuł jest wymagany' }] },
      { status: 400 },
    );
  }

  const client = createServiceClient();
  const insert = await client
    .from('rome_itinerary')
    .insert({
      day_part: body.dayPart,
      title: body.title,
      body: body.body ?? '',
      linked_restaurant_id: body.linkedRestaurantId ?? null,
      linked_attraction_id: body.linkedAttractionId ?? null,
      display_order: body.displayOrder ?? 0,
      published_at: body.published ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (insert.error) {
    return NextResponse.json(
      { error: `Nie udało się utworzyć punktu: ${insert.error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/rome/itinerary');
  revalidatePath('/admin/rome');

  return NextResponse.json({ id: insert.data.id }, { status: 201 });
}
