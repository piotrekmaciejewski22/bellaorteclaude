import "server-only";

/**
 * Supabase — klient serwisowy (service role).
 *
 * UWAGA — KLIENT OMIJA RLS:
 *  - Może czytać i pisać wszystko, w tym tabele admin-only.
 *  - Wolno go używać WYŁĄCZNIE po stronie serwera (Route Handlery,
 *    Server Actions, skrypty serwerowe).
 *  - NIGDY nie eksponujemy klucza service role w bundlu klienta —
 *    Wymaganie 49.2.
 *  - Każdy Route Handler korzystający z tego klienta MUSI najpierw
 *    sprawdzić sesję admina (patrz `src/lib/auth/require-admin.ts` —
 *    powstanie w późniejszym tasku).
 *
 * Klient nie utrzymuje sesji ani jej nie odświeża — to zwykły
 * service-account, nie kontekst użytkownika.
 *
 * Patrz Wymaganie 48 i 49 (requirements.md, Obszar N).
 */

import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createServiceClient must not be used in the browser. Service role key bypasses RLS and is server-only.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Missing env var NEXT_PUBLIC_SUPABASE_URL. Skopiuj `.env.example` do `.env.local` i uzupełnij wartość.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing env var SUPABASE_SERVICE_ROLE_KEY. Skopiuj `.env.example` do `.env.local` i uzupełnij wartość.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
