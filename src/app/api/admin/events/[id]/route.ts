/**
 * `PATCH/DELETE /api/admin/events/[id]` — edit or remove event.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PatchBody {
  kind?: 'local' | 'seasonal';
  title?: string;
  excerpt?: string;
  bodyMd?: string;
  startDate?: string | null;
  endDate?: string | null;
  displayPeriod?: string | null;
  heroImagePath?: string | null;
  externalUrl?: string | null;
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
  if (body.title !== undefined) update.title = body.title;
  if (body.excerpt !== undefined) update.excerpt = body.excerpt;
  if (body.bodyMd !== undefined) update.body_md = body.bodyMd;
  if (body.startDate !== undefined) update.start_date = body.startDate;
  if (body.endDate !== undefined) update.end_date = body.endDate;
  if (body.displayPeriod !== undefined) update.display_period = body.displayPeriod;
  if (body.heroImagePath !== undefined) update.hero_image_path = body.heroImagePath;
  if (body.externalUrl !== undefined) update.external_url = body.externalUrl;
  if (body.displayOrder !== undefined) update.display_order = body.displayOrder;
  if (typeof body.published === 'boolean') {
    update.published_at = body.published ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('events').update(update).eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się zapisać: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/wydarzenia');
  revalidatePath('/');
  revalidatePath('/admin/events');
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
  const { error } = await client.from('events').delete().eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Usunięcie nie powiodło się: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/wydarzenia');
  revalidatePath('/');
  revalidatePath('/admin/events');
  return NextResponse.json({ ok: true });
}
