/**
 * `POST /api/admin/events` — create new event (local or seasonal).
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const KINDS = ['local', 'seasonal'] as const;

interface CreateBody {
  kind?: string;
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

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  if (!body.kind || !(KINDS as readonly string[]).includes(body.kind)) {
    return NextResponse.json(
      { errors: [{ field: 'kind', message: 'Wymagany typ: local lub seasonal' }] },
      { status: 400 },
    );
  }
  if (!body.title || body.title.trim().length === 0) {
    return NextResponse.json(
      { errors: [{ field: 'title', message: 'Tytuł jest wymagany' }] },
      { status: 400 },
    );
  }

  const client = createServiceClient();
  const insert = await client
    .from('events')
    .insert({
      kind: body.kind,
      title: body.title,
      excerpt: body.excerpt ?? '',
      body_md: body.bodyMd ?? '',
      start_date: body.startDate ?? null,
      end_date: body.endDate ?? null,
      display_period: body.displayPeriod ?? null,
      hero_image_path: body.heroImagePath ?? null,
      external_url: body.externalUrl ?? null,
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

  revalidatePath('/wydarzenia');
  revalidatePath('/');
  revalidatePath('/admin/events');

  return NextResponse.json({ id: insert.data.id }, { status: 201 });
}
