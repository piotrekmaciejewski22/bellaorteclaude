import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const KINDS = ['grocery', 'pharmacy', 'atm', 'transit', 'laundry', 'medical', 'other'] as const;

interface CreateBody {
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
      { errors: [{ field: 'kind', message: 'Wymagany typ usługi' }] },
      { status: 400 },
    );
  }
  if (!body.name || body.name.trim().length === 0) {
    return NextResponse.json(
      { errors: [{ field: 'name', message: 'Nazwa jest wymagana' }] },
      { status: 400 },
    );
  }

  const client = createServiceClient();
  const insert = await client
    .from('local_services')
    .insert({
      kind: body.kind,
      name: body.name,
      address: body.address ?? '',
      notes: body.notes ?? '',
      hours: body.hours ?? null,
      walk_minutes: body.walkMinutes ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
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

  revalidatePath('/dla-gosci');
  revalidatePath('/admin/local-services');
  return NextResponse.json({ id: insert.data.id }, { status: 201 });
}
