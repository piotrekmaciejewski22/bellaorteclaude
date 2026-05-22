/**
 * `PATCH/DELETE /api/admin/faq/[id]` — edit or remove FAQ item.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PatchBody {
  question?: string;
  answerMd?: string;
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
  if (body.question !== undefined) update.question = body.question;
  if (body.answerMd !== undefined) update.answer_md = body.answerMd;
  if (body.displayOrder !== undefined) update.display_order = body.displayOrder;
  if (typeof body.published === 'boolean') {
    update.published_at = body.published ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('faq_items').update(update).eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się zapisać: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/useful-info');
  revalidatePath('/admin/faq');
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
  const { error } = await client.from('faq_items').delete().eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Usunięcie nie powiodło się: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/useful-info');
  revalidatePath('/admin/faq');
  return NextResponse.json({ ok: true });
}
