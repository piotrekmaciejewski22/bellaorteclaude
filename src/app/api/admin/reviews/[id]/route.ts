/**
 * `PATCH /api/admin/reviews/[id]` — moderate a review.
 *
 * Body: { status: 'approved' | 'rejected' | 'hidden', adminNote?: string }
 *
 * Wymagania pokryte: 35.
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
  adminNote?: string | null;
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

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!(STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json(
        { errors: [{ field: 'status', message: 'Nieprawidłowy status' }] },
        { status: 400 },
      );
    }
    update.status = body.status;
  }
  if (body.adminNote !== undefined) update.admin_note = body.adminNote;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('reviews').update(update).eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się zaktualizować opinii: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/restaurants', 'layout');
  revalidatePath('/places', 'layout');
  revalidatePath('/rome', 'layout');
  revalidatePath('/admin/reviews');
  revalidatePath('/admin');

  return NextResponse.json({ ok: true });
}
