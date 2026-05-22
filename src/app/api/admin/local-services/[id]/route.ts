import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PatchBody {
  kind?: string;
  name?: string;
  address?: string;
  notes?: string;
  hours?: string | null;
  walkMinutes?: number | null;
  latitude?: number | null;
  longitude?: number | null;
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
  if (body.kind !== undefined) update.kind = body.kind;
  if (body.name !== undefined) update.name = body.name;
  if (body.address !== undefined) update.address = body.address;
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.hours !== undefined) update.hours = body.hours;
  if (body.walkMinutes !== undefined) update.walk_minutes = body.walkMinutes;
  if (body.latitude !== undefined) update.latitude = body.latitude;
  if (body.longitude !== undefined) update.longitude = body.longitude;
  if (body.displayOrder !== undefined) update.display_order = body.displayOrder;
  if (typeof body.published === 'boolean') {
    update.published_at = body.published ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('local_services').update(update).eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się zapisać: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/dla-gosci');
  revalidatePath('/admin/local-services');
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
  const { error } = await client.from('local_services').delete().eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Usunięcie nie powiodło się: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/dla-gosci');
  revalidatePath('/admin/local-services');
  return NextResponse.json({ ok: true });
}
