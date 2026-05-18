/**
 * `POST /api/admin/useful-info` — create a travel info entry.
 *
 * Wymagania pokryte: 34.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const KINDS = ['car_rental', 'rome_transfer', 'trains', 'travel_directions'] as const;

interface CreateBody {
  kind?: string;
  title?: string;
  body?: string;
  externalLinks?: { label: string; url: string }[];
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
      { errors: [{ field: 'kind', message: 'Nieprawidłowy kind' }] },
      { status: 400 },
    );
  }
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    return NextResponse.json(
      { errors: [{ field: 'title', message: 'Tytuł jest wymagany' }] },
      { status: 400 },
    );
  }

  const client = createServiceClient();
  const insert = await client
    .from('travel_info')
    .insert({
      kind: body.kind,
      title: body.title,
      body: body.body ?? '',
      external_links: body.externalLinks ?? [],
      display_order: body.displayOrder ?? 0,
      published_at: body.published ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (insert.error) {
    return NextResponse.json(
      { error: `Nie udało się utworzyć wpisu: ${insert.error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/useful-info');
  revalidatePath('/admin/useful-info');

  return NextResponse.json({ id: insert.data.id }, { status: 201 });
}
