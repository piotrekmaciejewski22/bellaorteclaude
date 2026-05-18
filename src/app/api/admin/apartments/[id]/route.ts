/**
 * `PATCH /api/admin/apartments/[id]` — admin edit of an apartment row.
 *
 * Body contains any subset of editable fields:
 *   { name, slug, description, maxGuests, bedrooms, bathrooms,
 *     amenities, houseRules, publishedAt }
 *
 * Validation runs through `validateApartment` (4 baseline rules); slug
 * uniqueness is enforced by the DB unique index. After a successful
 * UPDATE we revalidate the public pages that read apartment data.
 *
 * Wymagania pokryte: 28, 38, 44.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';
import { validateApartment } from '@/lib/validation/apartment';

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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  // Validate just the fields present that the validator covers.
  const result = validateApartment({
    name: body.name,
    slug: body.slug,
    maxGuests: body.maxGuests,
    bedrooms: body.bedrooms,
    bathrooms: body.bathrooms,
  });
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    name: body.name,
    slug: body.slug,
    description: body.description ?? '',
    max_guests: body.maxGuests,
    bedrooms: body.bedrooms,
    bathrooms: body.bathrooms,
    amenities: Array.isArray(body.amenities) ? body.amenities : [],
    house_rules: typeof body.houseRules === 'string' ? body.houseRules : '',
  };

  // publishedAt — explicit null = unpublish, ISO string = set, undefined = no change.
  if (body.publishedAt === null) {
    update.published_at = null;
  } else if (typeof body.publishedAt === 'string' && body.publishedAt.length > 0) {
    update.published_at = body.publishedAt;
  } else if (typeof body.published === 'boolean') {
    update.published_at = body.published ? new Date().toISOString() : null;
  }

  const client = createServiceClient();
  const { error } = await client
    .from('apartments')
    .update(update)
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { errors: [{ field: 'slug', message: 'Slug jest już zajęty' }] },
        { status: 400 },
      );
    }
    console.error('PATCH /api/admin/apartments/[id]:', error);
    return NextResponse.json(
      { error: `Nie udało się zapisać apartamentu: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/');
  revalidatePath('/apartments');
  revalidatePath(`/apartments/${body.slug}`);
  revalidatePath('/admin/apartments');

  return NextResponse.json({ ok: true });
}
