/**
 * `PATCH /api/admin/restaurants/[id]` — edit a restaurant.
 * `DELETE /api/admin/restaurants/[id]` — soft delete (deleted_at = now()).
 *
 * Wymagania pokryte: 31, 41.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';
import { validateRestaurant } from '@/lib/validation/restaurant';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PatchBody {
  name?: string;
  slug?: string;
  description?: string;
  region?: string;
  cuisineCategories?: string[];
  tags?: string[];
  openingHours?: string | null;
  phone?: string | null;
  website?: string | null;
  tipForGuest?: string | null;
  address?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapsUrl?: string | null;
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

  const result = validateRestaurant({
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

  const update: Record<string, unknown> = {
    name: body.name,
    slug: body.slug,
    description: body.description ?? '',
    region: body.region,
    cuisine_categories: body.cuisineCategories ?? [],
    tags: body.tags ?? [],
    opening_hours: body.openingHours ?? null,
    phone: body.phone ?? null,
    website: body.website ?? null,
    tip_for_guest: body.tipForGuest ?? null,
    address: body.address ?? null,
    place_id: body.placeId ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    maps_url: body.mapsUrl ?? null,
  };
  if (typeof body.published === 'boolean') {
    update.published_at = body.published ? new Date().toISOString() : null;
  }

  const client = createServiceClient();
  const { error } = await client.from('restaurants').update(update).eq('id', id);
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { errors: [{ field: 'slug', message: 'Slug jest już zajęty' }] },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: `Nie udało się zaktualizować restauracji: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/restaurants', 'layout');
  revalidatePath('/rome/restaurants');
  revalidatePath('/admin/restaurants');

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
  const { error } = await client
    .from('restaurants')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: `Nie udało się usunąć restauracji: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/restaurants', 'layout');
  revalidatePath('/rome/restaurants');
  revalidatePath('/admin/restaurants');

  return NextResponse.json({ ok: true });
}
