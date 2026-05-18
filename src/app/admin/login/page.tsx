/**
 * `/admin/login` — admin sign-in.
 *
 * Server Component shell + client `LoginForm`. Login uses Supabase Auth
 * with email + password, then verifies that the user is in `admin_users`.
 * If not, the session is signed out and the form shows the generic
 * "Nieprawidłowy email lub hasło" message (Wym. 26 #3 — never disclose
 * whether the email exists).
 *
 * Wymagania pokryte: 26.
 */

import { redirect } from 'next/navigation';

import { LoginForm } from './LoginForm';
import { getAdminSession } from '@/lib/auth/session';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getAdminSession();
  const params = await searchParams;
  const next = typeof params.next === 'string' && params.next.startsWith('/admin')
    ? params.next
    : '/admin';

  if (session) {
    redirect(next);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-flag-white p-8 shadow-sm">
        <p className="text-eyebrow">Panel administracyjny</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Logowanie</h1>
        <p className="text-ui mt-3 text-sm text-cypress/80">
          Tylko dla administratorów BELLAORTE.
        </p>

        <LoginForm next={next} />
      </div>
    </main>
  );
}
