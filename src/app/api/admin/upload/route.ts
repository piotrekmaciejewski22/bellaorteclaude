/**
 * `POST /api/admin/upload` — generic admin upload to `site-media`.
 *
 * Used by editors that need to attach an image (blog post hero,
 * future event hero, etc.). Returns the storage path + public URL.
 */

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';
import { ALLOWED_PHOTO_MIME, MAX_PHOTO_BYTES } from '@/lib/constants';

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return 'jpg';
  return filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

const ALLOWED_KINDS = ['blog', 'event', 'misc'] as const;

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Oczekiwano multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file');
  const kindRaw = (formData.get('kind') as string | null) ?? 'misc';
  const kind = (ALLOWED_KINDS as readonly string[]).includes(kindRaw) ? kindRaw : 'misc';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
  }
  if (!ALLOWED_PHOTO_MIME.includes(file.type as (typeof ALLOWED_PHOTO_MIME)[number])) {
    return NextResponse.json({ error: 'Nieprawidłowy typ pliku' }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: 'Plik za duży (max 8 MB)' }, { status: 400 });
  }

  const ext = extOf(file.name);
  const path = `site/${kind}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const client = createServiceClient();
  const upload = await client.storage.from('site-media').upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) {
    return NextResponse.json(
      { error: `Upload nie powiódł się: ${upload.error.message}` },
      { status: 500 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const url = `${supabaseUrl}/storage/v1/object/public/site-media/${path}`;

  return NextResponse.json({ path, url }, { status: 201 });
}
