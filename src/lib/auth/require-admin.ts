import 'server-only';

/**
 * Route Handler guard. Returns the admin session or throws an HTTP-shaped
 * `NextResponse` (401) that the handler can `return` directly.
 *
 * Usage:
 *   const session = await requireAdmin();
 *   if (session instanceof NextResponse) return session;
 *
 * Wymagania pokryte: 26, 38.
 */

import { NextResponse } from 'next/server';

import { getAdminSession, type AdminSession } from './session';

export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Brak uprawnień' },
      { status: 401 },
    );
  }
  return session;
}
