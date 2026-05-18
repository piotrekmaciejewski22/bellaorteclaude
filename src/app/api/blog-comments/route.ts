/**
 * `POST /api/blog-comments` — public comment submission.
 */

import { NextResponse } from 'next/server';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit/memory-store';
import { createServiceClient } from '@/lib/supabase/admin';
import { validateBlogComment } from '@/lib/validation/blog-comment';

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`blog-comments:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zbyt wiele prób. Spróbuj ponownie za chwilę.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  const result = validateBlogComment(payload as Record<string, unknown>);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const p = payload as { postId: string; signature: string; body: string };
  const client = createServiceClient();

  // Verify post exists and is published.
  const post = await client
    .from('blog_posts')
    .select('id, published_at')
    .eq('id', p.postId)
    .maybeSingle();
  if (post.error || !post.data || !post.data.published_at) {
    return NextResponse.json(
      { errors: [{ field: 'postId', message: 'Wpis nie istnieje' }] },
      { status: 400 },
    );
  }

  const insert = await client
    .from('blog_comments')
    .insert({
      post_id: p.postId,
      signature: p.signature.trim(),
      body: p.body.trim(),
      status: 'pending',
      consent_at: new Date().toISOString(),
      source_ip: ip === 'unknown' ? null : ip,
    })
    .select('id')
    .single();

  if (insert.error) {
    console.error('blog-comments insert:', insert.error);
    return NextResponse.json(
      { error: `Nie udało się zapisać komentarza: ${insert.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: insert.data.id }, { status: 201 });
}
