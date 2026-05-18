/**
 * `POST /api/admin/hero` — upload a new hero image, store path in
 * `site_settings.hero_image_path`, delete previous file if any.
 *
 * Body: multipart/form-data { file }
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';
import { ALLOWED_PHOTO_MIME, MAX_PHOTO_BYTES } from '@/lib/constants';

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return 'jpg';
  return filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

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
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
  }
  if (!ALLOWED_PHOTO_MIME.includes(file.type as (typeof ALLOWED_PHOTO_MIME)[number])) {
    return NextResponse.json(
      { error: 'Nieprawidłowy typ pliku. Dozwolone: JPEG, PNG, WebP' },
      { status: 400 },
    );
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: 'Plik za duży. Maksymalnie 8 MB' },
      { status: 400 },
    );
  }

  const client = createServiceClient();

  // Read previous hero path so we can delete it after successful upload.
  const prev = await client
    .from('site_settings')
    .select('hero_image_path')
    .eq('id', 1)
    .maybeSingle();

  const ext = extOf(file.name);
  const newPath = `site/hero/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await client.storage
    .from('site-media')
    .upload(newPath, buffer, { contentType: file.type, upsert: false });
  if (upload.error) {
    return NextResponse.json(
      { error: `Upload nie powiódł się: ${upload.error.message}` },
      { status: 500 },
    );
  }

  const update = await client
    .from('site_settings')
    .update({ hero_image_path: newPath })
    .eq('id', 1);
  if (update.error) {
    await client.storage.from('site-media').remove([newPath]);
    return NextResponse.json(
      { error: `Zapis ścieżki nie powiódł się: ${update.error.message}` },
      { status: 500 },
    );
  }

  // Best-effort delete of the previous hero file.
  const prevPath = prev.data?.hero_image_path;
  if (prevPath && prevPath !== newPath) {
    await client.storage.from('site-media').remove([prevPath]);
  }

  revalidatePath('/');

  return NextResponse.json({ path: newPath }, { status: 201 });
}

export async function DELETE() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const client = createServiceClient();
  const prev = await client
    .from('site_settings')
    .select('hero_image_path')
    .eq('id', 1)
    .maybeSingle();

  await client.from('site_settings').update({ hero_image_path: null }).eq('id', 1);

  if (prev.data?.hero_image_path) {
    await client.storage.from('site-media').remove([prev.data.hero_image_path]);
  }

  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
