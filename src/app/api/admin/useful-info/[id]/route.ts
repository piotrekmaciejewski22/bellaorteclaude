/**
 * `PATCH/DELETE /api/admin/useful-info/[id]` — manage travel_info row.
 *
 * Wymagania pokryte: 34.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KINDS = ['car_rental', 'rome_transfer', 'trains', 'travel_directions'] as const;

interface PatchBody {
  kind?: string;
  title?: string;
  body?: string;
  externalLinks?: { label: string; url: string }[];
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
  if (body.kind !== undefined) {
    if (!(KINDS as readonly string[]).includes(body.kind)) {
      return NextResponse.json(
        { errors: [{ field: 'kind', message: 'Nieprawidłowy kind' }] },
        { status: 400 },
      );
    }
    update.kind = body.kind;
  }
  if (body.title !== undefined) update.title = body.title;
  if (body.body !== undefined) update.body = body.body;
  if (body.externalLinks !== undefined) update.external_links = body.externalLinks;
  if (body.displayOrder !== undefined) update.display_order = body.displayOrder;
  if (typeof body.published === 'boolean') {
    update.published_at = body.published ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('travel_info').update(update).eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się zaktualizować wpisu: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/useful-info');
  revalidatePath('/admin/useful-info');

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
  const { error } = await client.from('travel_info').delete().eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się usunąć wpisu: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/useful-info');
  revalidatePath('/admin/useful-info');

  return NextResponse.json({ ok: true });
}
