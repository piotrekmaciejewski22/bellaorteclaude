import "server-only";

/**
 * Supabase — klient serwerowy (anon key, cookies-aware).
 *
 * Używaj w:
 *  - Server Components (App Router) — odczyty publiczne, sesja admina przez cookie.
 *  - Server Actions / Route Handlerach — operacje, które muszą odczytać
 *    sesję użytkownika z cookies.
 *
 * Klient korzysta z anon key (RLS pilnuje uprawnień). Sesja jest
 * propagowana przez cookies wystawiane przez `@supabase/ssr`. Zapisy
 * cookies w czystym Server Component są ignorowane przez Next.js — dlatego
 * `setAll` jest opakowany w try/catch (Next.js dopuszcza zapis cookies
 * tylko w Server Actions / Route Handlerach).
 *
 * Patrz Wymaganie 48 i 49 (requirements.md, Obszar N).
 */

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing env var NEXT_PUBLIC_SUPABASE_URL. Skopiuj `.env.example` do `.env.local` i uzupełnij wartość.",
    );
  }
  if (!anonKey) {
    throw new Error(
      "Missing env var NEXT_PUBLIC_SUPABASE_ANON_KEY. Skopiuj `.env.example` do `.env.local` i uzupełnij wartość.",
    );
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Wywołanie z czystego Server Component — Next.js nie pozwala
          // wtedy modyfikować cookies. Sesja zostanie odświeżona przy
          // najbliższym Server Action / Route Handlerze. Bezpiecznie
          // ignorujemy ten przypadek.
        }
      },
    },
  });
}
