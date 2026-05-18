/**
 * `POST /api/admin/apartments/[id]/photos` — upload a new gallery photo.
 *
 * Accepts `multipart/form-data` with fields:
 *   - file: the binary photo (JPEG/PNG/WebP, ≤ 8 MB)
 *   - alt: descriptive text for screen readers
 *   - sourceKind: one of the SourceKind values
 *
 * Uploads to bucket `site-media` under `apartments/<id>/<uuid>.<ext>`,
 * then INSERTs a `gallery_photos` row.
 *
 * Wymagania pokryte: 28 #3, 39, 40.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';
import {
  ALLOWED_PHOTO_MIME,
  MAX_PHOTO_BYTES,
} from '@/lib/constants';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_SOURCE_KINDS = [
  'placeholder_orte',
  'placeholder_italy',
  'placeholder_rome',
  'interior_real',
  'exterior_real',
] as const;
type SourceKindLiteral = (typeof ALLOWED_SOURCE_KINDS)[number];

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return 'bin';
  return filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id: apartmentId } = await context.params;
  if (!UUID_RE.test(apartmentId)) {
    return NextResponse.json(
      { error: 'Nieprawidłowy identyfikator apartamentu' },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Oczekiwano multipart/form-data' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  const alt = (formData.get('alt') as string | null) ?? '';
  const sourceKind = (formData.get('sourceKind') as string | null) ?? '';

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Brak pliku w żądaniu' },
      { status: 400 },
    );
  }
  if (!ALLOWED_PHOTO_MIME.includes(file.type as (typeof ALLOWED_PHOTO_MIME)[number])) {
    return NextResponse.json(
      { error: 'Nieprawidłowy typ pliku. Dozwolone: JPEG, PNG, WebP' },
      { status: 400 },
    );
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: 'Plik za duży. Maksymalny rozmiar to 8 MB' },
      { status: 400 },
    );
  }
  if (!ALLOWED_SOURCE_KINDS.includes(sourceKind as SourceKindLiteral)) {
    return NextResponse.json(
      { error: `Nieprawidłowy sourceKind. Dozwolone: ${ALLOWED_SOURCE_KINDS.join(', ')}` },
      { status: 400 },
    );
  }

  const client = createServiceClient();

  // Verify apartment exists.
  const apt = await client
    .from('apartments')
    .select('id')
    .eq('id', apartmentId)
    .maybeSingle();
  if (apt.error || !apt.data) {
    return NextResponse.json(
      { error: 'Apartament nie istnieje' },
      { status: 404 },
    );
  }

  const ext = extOf(file.name);
  const objectPath = `apartments/${apartmentId}/${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await client.storage
    .from('site-media')
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (upload.error) {
    console.error('site-media upload failed:', upload.error);
    return NextResponse.json(
      { error: `Upload zdjęcia nie powiódł się: ${upload.error.message}` },
      { status: 500 },
    );
  }

  // Determine next display_order.
  const orderRes = await client
    .from('gallery_photos')
    .select('display_order')
    .eq('apartment_id', apartmentId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (orderRes.data?.display_order ?? -1) + 1;

  const insert = await client
    .from('gallery_photos')
    .insert({
      apartment_id: apartmentId,
      storage_path: objectPath,
      alt,
      source_kind: sourceKind,
      display_order: nextOrder,
    })
    .select('id')
    .single();

  if (insert.error) {
    // Clean up the uploaded file if the DB insert failed.
    await client.storage.from('site-media').remove([objectPath]);
    return NextResponse.json(
      { error: `Zapis zdjęcia nie powiódł się: ${insert.error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/apartments');
  revalidatePath(`/admin/apartments/${apartmentId}`);

  return NextResponse.json(
    { id: insert.data.id, storagePath: objectPath },
    { status: 201 },
  );
}
