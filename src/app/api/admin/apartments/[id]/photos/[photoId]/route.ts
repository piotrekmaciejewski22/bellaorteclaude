/**
 * `DELETE /api/admin/apartments/[id]/photos/[photoId]`
 *
 * Removes the storage object and the DB row in that order. If the
 * storage delete fails we still return error and DO NOT delete the row,
 * to avoid orphaned DB references to live objects.
 *
 * Wymagania pokryte: 28 #4, 39.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; photoId: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id: apartmentId, photoId } = await context.params;
  if (!UUID_RE.test(apartmentId) || !UUID_RE.test(photoId)) {
    return NextResponse.json(
      { error: 'Nieprawidłowy identyfikator' },
      { status: 400 },
    );
  }

  const client = createServiceClient();

  const photo = await client
    .from('gallery_photos')
    .select('storage_path, apartment_id')
    .eq('id', photoId)
    .maybeSingle();

  if (photo.error || !photo.data) {
    return NextResponse.json(
      { error: 'Zdjęcie nie istnieje' },
      { status: 404 },
    );
  }
  if (photo.data.apartment_id !== apartmentId) {
    return NextResponse.json(
      { error: 'Zdjęcie nie należy do tego apartamentu' },
      { status: 400 },
    );
  }

  const remove = await client.storage
    .from('site-media')
    .remove([photo.data.storage_path]);

  if (remove.error) {
    console.error('site-media remove failed:', remove.error);
    return NextResponse.json(
      { error: `Nie udało się usunąć pliku: ${remove.error.message}` },
      { status: 500 },
    );
  }

  const del = await client.from('gallery_photos').delete().eq('id', photoId);
  if (del.error) {
    console.error('gallery_photos delete failed:', del.error);
    return NextResponse.json(
      { error: 'Nie udało się usunąć rekordu zdjęcia' },
      { status: 500 },
    );
  }

  revalidatePath('/apartments');
  revalidatePath(`/admin/apartments/${apartmentId}`);

  return NextResponse.json({ ok: true });
}

interface PatchBody {
  displayOrder?: number;
  alt?: string;
  sourceKind?: string;
}

const SOURCE_KINDS = [
  'placeholder_orte',
  'placeholder_italy',
  'placeholder_rome',
  'interior_real',
  'exterior_real',
] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; photoId: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id: apartmentId, photoId } = await context.params;
  if (!UUID_RE.test(apartmentId) || !UUID_RE.test(photoId)) {
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
  if (typeof body.displayOrder === 'number') update.display_order = body.displayOrder;
  if (typeof body.alt === 'string') update.alt = body.alt;
  if (
    typeof body.sourceKind === 'string' &&
    (SOURCE_KINDS as readonly string[]).includes(body.sourceKind)
  ) {
    update.source_kind = body.sourceKind;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client
    .from('gallery_photos')
    .update(update)
    .eq('id', photoId)
    .eq('apartment_id', apartmentId);

  if (error) {
    return NextResponse.json(
      { error: `Nie udało się zapisać: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/apartments');
  revalidatePath(`/admin/apartments/${apartmentId}`);
  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
