/**
 * `POST /api/admin/blog` — create a new blog post.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createServiceClient } from '@/lib/supabase/admin';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface CreateBody {
  slug?: string;
  title?: string;
  excerpt?: string;
  bodyMd?: string;
  authorSignature?: string;
  heroImagePath?: string | null;
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

  const errors: { field: string; message: string }[] = [];
  if (!body.slug || !SLUG_RE.test(body.slug)) {
    errors.push({ field: 'slug', message: 'Slug w formacie kebab-case (małe litery, cyfry, myślniki)' });
  }
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Tytuł jest wymagany' });
  }
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const client = createServiceClient();
  const insert = await client
    .from('blog_posts')
    .insert({
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt ?? '',
      body_md: body.bodyMd ?? '',
      author_signature: body.authorSignature ?? '',
      hero_image_path: body.heroImagePath ?? null,
      published_at: body.published ? new Date().toISOString() : null,
    })
    .select('id, slug')
    .single();

  if (insert.error) {
    if (insert.error.code === '23505') {
      return NextResponse.json(
        { errors: [{ field: 'slug', message: 'Slug jest już zajęty' }] },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: `Nie udało się utworzyć wpisu: ${insert.error.message}` },
      { status: 500 },
    );
  }

  revalidatePath('/blog');
  revalidatePath('/admin/blog');
  return NextResponse.json({ id: insert.data.id, slug: insert.data.slug }, { status: 201 });
}
