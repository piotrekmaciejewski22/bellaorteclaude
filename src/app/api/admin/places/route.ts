/**
 * `POST /api/admin/places` — create an attraction.
 *
 * Wymagania pokryte: 32, 41.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';
import { validateAttraction } from '@/lib/validation/attraction';

interface CreateBody {
  name?: string;
  slug?: string;
  description?: string;
  region?: string;
  tags?: string[];
  practicalInfo?: string | null;
  travelInfo?: string | null;
  address?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapsUrl?: string | null;
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

  const result = validateAttraction({
    name: body.name,
    slug: body.slug,
    region: body.region,
    address: body.address,
    placeId: body.placeId,
    latitude: body.latitude,
    longitude: body.longitude,
  });
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const client = createServiceClient();
  const insert = await client
    .from('attractions')
    .insert({
      name: body.name,
      slug: body.slug,
      description: body.description ?? '',
      region: body.region,
      tags: body.tags ?? [],
      practical_info: body.practicalInfo ?? null,
      travel_info: body.travelInfo ?? null,
      address: body.address ?? null,
      place_id: body.placeId ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      maps_url: body.mapsUrl ?? null,
      published_at: body.published ? new Date().toISOString() : null,
    })
    .select('id, slug')
    .single();

  if (insert.error) {
    if (insert.error.code === '23505') {
      return NextResponse.json(
        { errors: [{ field: 'slug', message: 'Slug jest już zajęty' }] },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: `Nie udało się utworzyć atrakcji: ${insert.error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/places');
  revalidatePath('/rome/places');
  revalidatePath('/admin/places');

  return NextResponse.json({ id: insert.data.id, slug: insert.data.slug }, { status: 201 });
}
