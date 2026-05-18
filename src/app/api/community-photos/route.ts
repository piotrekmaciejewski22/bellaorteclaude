/**
 * `POST /api/community-photos` — public submission for "Wasze zdjęcia".
 */

import { NextResponse } from 'next/server';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit/memory-store';
import { createServiceClient } from '@/lib/supabase/admin';
import { ALLOWED_PHOTO_MIME, MAX_PHOTO_BYTES } from '@/lib/constants';

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return 'jpg';
  return filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`community-photos:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zbyt wiele prób. Spróbuj ponownie za chwilę.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Oczekiwano multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file');
  const caption = ((formData.get('caption') as string | null) ?? '').trim();
  const contributorName = ((formData.get('contributorName') as string | null) ?? '').trim();
  const locationLabel = ((formData.get('locationLabel') as string | null) ?? '').trim();
  const consent = formData.get('consent') === 'true' || formData.get('consent') === 'on';

  if (!(file instanceof File)) {
    return NextResponse.json({ errors: [{ field: 'file', message: 'Wybierz plik' }] }, { status: 400 });
  }
  if (!ALLOWED_PHOTO_MIME.includes(file.type as (typeof ALLOWED_PHOTO_MIME)[number])) {
    return NextResponse.json(
      { errors: [{ field: 'file', message: 'Dozwolone formaty: JPEG, PNG, WebP' }] },
      { status: 400 },
    );
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { errors: [{ field: 'file', message: 'Plik za duży. Max 8 MB' }] },
      { status: 400 },
    );
  }
  if (caption.length > 500) {
    return NextResponse.json(
      { errors: [{ field: 'caption', message: 'Opis za długi (max 500 znaków)' }] },
      { status: 400 },
    );
  }
  if (contributorName.length > 60) {
    return NextResponse.json(
      { errors: [{ field: 'contributorName', message: 'Imię za długie (max 60 znaków)' }] },
      { status: 400 },
    );
  }
  if (!consent) {
    return NextResponse.json(
      { errors: [{ field: 'consent', message: 'Wymagana zgoda na publikację' }] },
      { status: 400 },
    );
  }

  const ext = extOf(file.name);
  const path = `community/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const client = createServiceClient();
  const upload = await client.storage.from('guest-media').upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) {
    return NextResponse.json(
      { error: `Upload nie powiódł się: ${upload.error.message}` },
      { status: 500 },
    );
  }

  const insert = await client
    .from('community_photos')
    .insert({
      storage_path: path,
      caption,
      contributor_name: contributorName,
      location_label: locationLabel || null,
      status: 'pending',
      consent_at: new Date().toISOString(),
      source_ip: ip === 'unknown' ? null : ip,
    })
    .select('id')
    .single();

  if (insert.error) {
    await client.storage.from('guest-media').remove([path]);
    return NextResponse.json(
      { error: `Zapis nie powiódł się: ${insert.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: insert.data.id }, { status: 201 });
}
