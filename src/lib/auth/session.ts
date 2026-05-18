import 'server-only';

/**
 * Admin session helper.
 *
 * `getAdminSession()` reads the Supabase session from cookies (server
 * client) and confirms the user is in `public.admin_users`. The
 * membership SELECT goes through the service-role client to bypass the
 * RLS policy that otherwise creates a chicken-and-egg problem (the
 * policy itself requires the user already to be an admin to read the
 * table that proves they are).
 *
 * Wymagania pokryte: 26, 38.
 */

import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';

export interface AdminSession {
  userId: string;
  email: string | null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const auth = await createServerClient();

  const { data: userData, error: userErr } = await auth.auth.getUser();
  if (userErr || !userData.user) {
    return null;
  }

  const userId = userData.user.id;

  // Service-role bypasses RLS — we are server-side only (this module is
  // marked `server-only`), so this is safe.
  const admin = createServiceClient();
  const { data: row, error } = await admin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !row) {
    return null;
  }

  return {
    userId,
    email: userData.user.email ?? null,
  };
}
