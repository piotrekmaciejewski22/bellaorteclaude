/**
 * Admin layout. Guards every page under `/admin/*` except `/admin/login`.
 *
 * Server Component. Reads the request pathname from the `x-pathname`
 * header injected by `src/middleware.ts`. If the path is `/admin/login`
 * the guard is skipped so unauthenticated visitors can reach the form.
 * Otherwise we read the session via `getAdminSession()`; if absent or
 * the user is not in `admin_users`, redirect to `/admin/login?next=...`.
 *
 * Wymagania pokryte: 26, 38.
 */

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { getAdminSession } from '@/lib/auth/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';

  if (pathname.startsWith('/admin/login')) {
    // Render bare children — no sidebar, no auth guard. The login page
    // has its own session check (redirects to /admin if already logged
    // in).
    return <>{children}</>;
  }

  const session = await getAdminSession();
  if (!session) {
    const next = pathname && pathname.startsWith('/admin') ? pathname : '/admin';
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="flex min-h-screen bg-ivory">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
