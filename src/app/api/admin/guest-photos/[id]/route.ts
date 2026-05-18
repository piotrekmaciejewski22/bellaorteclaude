/**
 * `PATCH /api/admin/guest-photos/[id]` — moderate a guest photo (status).
 * `DELETE /api/admin/guest-photos/[id]` — permanently delete photo + storage.
 *
 * Wymagania pokryte: 36.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = ['approved', 'rejected', 'hidden', 'pending'] as const;

interface PatchBody {
  status?: string;
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

  if (!body.status || !(STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json(
      { errors: [{ field: 'status', message: 'Nieprawidłowy status' }] },
      { status: 400 },
    );
  }

  const client = createServiceClient();
  const { error } = await client
    .from('guest_photos')
    .update({ status: body.status })
    .eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się zaktualizować zdjęcia: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/restaurants', 'layout');
  revalidatePath('/places', 'layout');
  revalidatePath('/admin/photos');
  revalidatePath('/admin');

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

  const photo = await client
    .from('guest_photos')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (photo.error || !photo.data) {
    return NextResponse.json({ error: 'Zdjęcie nie istnieje' }, { status: 404 });
  }

  const remove = await client.storage
    .from('guest-media')
    .remove([photo.data.storage_path]);
  if (remove.error) {
    console.error('guest-media remove failed:', remove.error);
  }

  const del = await client.from('guest_photos').delete().eq('id', id);
  if (del.error) {
    return NextResponse.json(
      { error: `Nie udało się usunąć zdjęcia: ${del.error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/restaurants', 'layout');
  revalidatePath('/places', 'layout');
  revalidatePath('/admin/photos');

  return NextResponse.json({ ok: true });
}
