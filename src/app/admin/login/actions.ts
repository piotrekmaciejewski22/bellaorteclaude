"use server";

/**
 * Server actions for `/admin/login`.
 *
 * The login flow needs to bypass the chicken-and-egg problem of the
 * `admin_users` RLS policy: the policy is "you can SELECT admin_users
 * if your auth.uid() is in admin_users", which means a freshly
 * authenticated user cannot self-confirm membership through the anon
 * key. We avoid this by:
 *   1. Performing `signInWithPassword` on the server-side client, so
 *      the auth cookies are written into the response.
 *   2. Looking up `admin_users` with the `service_role` client (bypasses
 *      RLS).
 *   3. If the lookup fails, signing the user out so a non-admin who
 *      knows a valid password cannot establish a half-session.
 *
 * Wymagania pokryte: 26.
 */

import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function signInAdmin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const auth = await createServerClient();

  const signIn = await auth.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.user) {
    return { ok: false, error: 'Nieprawidłowy email lub hasło' };
  }

  const userId = signIn.data.user.id;

  // Verify membership in admin_users with the service-role client so we
  // bypass RLS that would otherwise block this very lookup.
  const admin = createServiceClient();
  const membership = await admin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (membership.error || !membership.data) {
    // Not an admin → revoke the session we just created.
    await auth.auth.signOut();
    return { ok: false, error: 'Brak uprawnień administracyjnych' };
  }

  return { ok: true };
}
