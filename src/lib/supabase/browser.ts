/**
 * Supabase — klient przeglądarkowy (anon key).
 *
 * Używaj WYŁĄCZNIE w Client Components ("use client") tam, gdzie potrzebny
 * jest interaktywny dostęp do Supabase z poziomu przeglądarki.
 *
 * - Klucz `NEXT_PUBLIC_SUPABASE_ANON_KEY` jest publiczny i bezpieczny
 *   do osadzenia w bundlu klienta — dostęp do danych ogranicza RLS.
 * - Ten klient jest przeznaczony do publicznych odczytów (np. przez RPC
 *   `get_availability`) oraz do operacji odbywających się po stronie
 *   klienta po zalogowaniu (jeśli zajdzie potrzeba). Operacje zapisu
 *   modyfikujące dane krytyczne idą przez Route Handlery.
 *
 * Patrz Wymaganie 48 i 49 (requirements.md, Obszar N).
 */

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

export function createBrowserClient() {
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

  return createSupabaseBrowserClient(url, anonKey);
}
