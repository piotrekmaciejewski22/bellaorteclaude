/**
 * `/api/admin/apartments` — guards for the "exactly 2 apartments" rule.
 *
 * MVP locks the apartment count at exactly 2 (Wymaganie 28 #6). Both
 * POST (create) and DELETE (remove) reject with 422 — the operator must
 * edit the existing rows rather than create or delete them.
 *
 * Wymagania pokryte: 28 #6.
 */

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';

const TOO_MANY = {
  error: 'MVP obsługuje dokładnie 2 apartamenty',
};

export async function POST() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  return NextResponse.json(TOO_MANY, { status: 422 });
}

export async function DELETE() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  return NextResponse.json(TOO_MANY, { status: 422 });
}
