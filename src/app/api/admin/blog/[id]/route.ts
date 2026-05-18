/**
 * `PATCH /api/admin/blog/[id]` — edit a blog post.
 * `DELETE /api/admin/blog/[id]` — delete a blog post.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface PatchBody {
  slug?: string;
  title?: string;
  excerpt?: string;
  bodyMd?: string;
  authorSignature?: string;
  heroImagePath?: string | null;
  published?: boolean;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Nieprawidłowy identyfikator' }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.slug !== undefined) {
    if (!SLUG_RE.test(body.slug)) {
      return NextResponse.json(
        { errors: [{ field: 'slug', message: 'Slug w formacie kebab-case' }] },
        { status: 400 },
      );
    }
    update.slug = body.slug;
  }
  if (body.title !== undefined) update.title = body.title;
  if (body.excerpt !== undefined) update.excerpt = body.excerpt;
  if (body.bodyMd !== undefined) update.body_md = body.bodyMd;
  if (body.authorSignature !== undefined) update.author_signature = body.authorSignature;
  if (body.heroImagePath !== undefined) update.hero_image_path = body.heroImagePath;
  if (typeof body.published === 'boolean') {
    update.published_at = body.published ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Brak pól do zmiany' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('blog_posts').update(update).eq('id', id);
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { errors: [{ field: 'slug', message: 'Slug jest już zajęty' }] },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: `Nie udało się zapisać: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/blog', 'layout');
  revalidatePath('/admin/blog');
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Nieprawidłowy identyfikator' }, { status: 400 });
  }

  const client = createServiceClient();
  const { error } = await client.from('blog_posts').delete().eq('id', id);
  if (error) {
    return NextResponse.json(
      { error: `Nie udało się usunąć wpisu: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/blog', 'layout');
  revalidatePath('/admin/blog');
  return NextResponse.json({ ok: true });
}
