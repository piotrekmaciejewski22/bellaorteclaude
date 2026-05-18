/**
 * `PATCH /api/admin/community-photos/[id]` — moderate.
 * `DELETE /api/admin/community-photos/[id]` — permanently delete.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = ['approved', 'rejected', 'hidden', 'pending'] as const;

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

  const body = (await request.json().catch(() => ({}))) as { status?: string };
  if (!body.status || !(STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json(
      { errors: [{ field: 'status', message: 'Nieprawidłowy status' }] },
      { status: 400 },
    );
  }

  const client = createServiceClient();
  const { error } = await client
    .from('community_photos')
    .update({ status: body.status })
    .eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Aktualizacja nie powiodła się: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/wasze-zdjecia');
  revalidatePath('/admin/community-photos');
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
  const photo = await client
    .from('community_photos')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (photo.error || !photo.data) {
    return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  }

  await client.storage.from('guest-media').remove([photo.data.storage_path]);
  const del = await client.from('community_photos').delete().eq('id', id);
  if (del.error) {
    return NextResponse.json(
      { error: `Usunięcie nie powiodło się: ${del.error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/wasze-zdjecia');
  revalidatePath('/admin/community-photos');
  return NextResponse.json({ ok: true });
}
