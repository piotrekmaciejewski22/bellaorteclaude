/**
 * `POST /api/reviews` — public Review_Form submission.
 *
 * Wymagania pokryte: 23, 25, 44.
 */

import { NextResponse } from 'next/server';

import { checkRateLimit, getClientIp } from '@/lib/rate-limit/memory-store';
import { createServiceClient } from '@/lib/supabase/admin';
import { validateReview } from '@/lib/validation/review';

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`reviews:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Zbyt wiele prób. Spróbuj ponownie za chwilę.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON' }, { status: 400 });
  }

  const result = validateReview(payload as Record<string, unknown>);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const p = payload as {
    targetType: 'restaurant' | 'attraction';
    targetId: string;
    signature: string;
    rating: number;
    body: string;
  };

  const client = createServiceClient();

  // Verify target exists and is published.
  const table = p.targetType === 'restaurant' ? 'restaurants' : 'attractions';
  const target = await client
    .from(table)
    .select('id, published_at, deleted_at')
    .eq('id', p.targetId)
    .maybeSingle();

  if (target.error || !target.data) {
    return NextResponse.json(
      { errors: [{ field: 'targetId', message: 'Cel opinii nie istnieje' }] },
      { status: 400 },
    );
  }
  if (!target.data.published_at || target.data.deleted_at) {
    return NextResponse.json(
      { errors: [{ field: 'targetId', message: 'Cel opinii nie jest dostępny' }] },
      { status: 400 },
    );
  }

  const insert = await client
    .from('reviews')
    .insert({
      restaurant_id: p.targetType === 'restaurant' ? p.targetId : null,
      attraction_id: p.targetType === 'attraction' ? p.targetId : null,
      signature: p.signature.trim(),
      rating: p.rating,
      body: p.body.trim(),
      status: 'pending',
      consent_at: new Date().toISOString(),
      source_ip: ip === 'unknown' ? null : ip,
    })
    .select('id')
    .single();

  if (insert.error) {
    console.error('POST /api/reviews:', insert.error);
    return NextResponse.json(
      { error: `Nie udało się zapisać opinii: ${insert.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: insert.data.id }, { status: 201 });
}
