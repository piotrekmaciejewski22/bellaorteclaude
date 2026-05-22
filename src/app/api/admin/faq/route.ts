/**
 * `POST /api/admin/faq` — create new FAQ item.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

interface CreateBody {
  question?: string;
  answerMd?: string;
  displayOrder?: number;
  published?: boolean;
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  if (!body.question || body.question.trim().length === 0) {
    return NextResponse.json(
      { errors: [{ field: 'question', message: 'Pytanie jest wymagane' }] },
      { status: 400 },
    );
  }

  const client = createServiceClient();
  const insert = await client
    .from('faq_items')
    .insert({
      question: body.question,
      answer_md: body.answerMd ?? '',
      display_order: body.displayOrder ?? 0,
      published_at: body.published ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (insert.error) {
    return NextResponse.json(
      { error: `Nie udało się utworzyć: ${insert.error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/useful-info');
  revalidatePath('/admin/faq');
  return NextResponse.json({ id: insert.data.id }, { status: 201 });
}
