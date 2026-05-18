/**
 * Edge proxy (Next.js 16 successor of middleware) — propagates the
 * request pathname as `x-pathname` so Server Components can read it via
 * `headers()`. Without this nagłówek Next.js App Router would not expose
 * the current path to layouts.
 *
 * Used by `src/app/admin/layout.tsx` to skip the auth guard for
 * `/admin/login` (otherwise the guard redirects the login page to
 * itself → infinite redirect loop).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Clone request headers (originals are immutable) and add x-pathname.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Run on every route except API routes, static assets and Next internals.
    '/((?!api|_next/static|_next/image|favicon\\.ico|placeholders).*)',
  ],
};
