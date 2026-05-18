/**
 * `POST /api/guest-photos` — public guest photo upload.
 *
 * Multipart form data:
 *   - file: image (JPEG/PNG/WebP, ≤8 MB)
 *   - targetType: 'restaurant' | 'attraction'
 *   - targetId: UUID
 *   - reviewId: optional UUID
 *
 * Uploads to private bucket `guest-media`, INSERTs `guest_photos` with
 * status='pending'.
 *
 * Wymagania pokryte: 24, 25, 39, 44.
 */

import { NextResponse } from 'next/server';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit/memory-store';
import { createServiceClient } from '@/lib/supabase/admin';
import { validateGuestPhoto } from '@/lib/validation/guest-photo';

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return 'bin';
  return filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`guest-photos:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zbyt wiele prób. Spróbuj ponownie za chwilę.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      },
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
  const payload = {
    targetType: formData.get('targetType'),
    targetId: formData.get('targetId'),
    reviewId: formData.get('reviewId') || undefined,
  };

  const result = validateGuestPhoto(file, payload);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const f = file as File;
  const targetType = payload.targetType as 'restaurant' | 'attraction';
  const targetId = payload.targetId as string;
  const reviewId = (payload.reviewId as string | undefined) || null;

  const client = createServiceClient();

  // Verify target exists and is published.
  const table = targetType === 'restaurant' ? 'restaurants' : 'attractions';
  const target = await client
    .from(table)
    .select('id, published_at, deleted_at')
    .eq('id', targetId)
    .maybeSingle();

  if (target.error || !target.data) {
    return NextResponse.json(
      { errors: [{ field: 'targetId', message: 'Cel zdjęcia nie istnieje' }] },
      { status: 400 },
    );
  }
  if (!target.data.published_at || target.data.deleted_at) {
    return NextResponse.json(
      { errors: [{ field: 'targetId', message: 'Cel zdjęcia nie jest dostępny' }] },
      { status: 400 },
    );
  }

  const ext = extOf(f.name);
  const objectPath = `${targetType}/${targetId}/${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await f.arrayBuffer());
  const upload = await client.storage
    .from('guest-media')
    .upload(objectPath, buffer, {
      contentType: f.type,
      upsert: false,
    });
  if (upload.error) {
    console.error('guest-media upload:', upload.error);
    return NextResponse.json(
      { error: `Upload zdjęcia nie powiódł się: ${upload.error.message}` },
      { status: 500 },
    );
  }

  const insert = await client
    .from('guest_photos')
    .insert({
      restaurant_id: targetType === 'restaurant' ? targetId : null,
      attraction_id: targetType === 'attraction' ? targetId : null,
      review_id: reviewId,
      storage_path: objectPath,
      mime_type: f.type,
      size_bytes: f.size,
      status: 'pending',
      consent_at: new Date().toISOString(),
      source_ip: ip === 'unknown' ? null : ip,
    })
    .select('id')
    .single();

  if (insert.error) {
    await client.storage.from('guest-media').remove([objectPath]);
    return NextResponse.json(
      { error: `Zapis zdjęcia nie powiódł się: ${insert.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: insert.data.id }, { status: 201 });
}
