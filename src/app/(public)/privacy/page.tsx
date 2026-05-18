export const dynamic = 'force-dynamic';

/**
 * `/privacy` — privacy policy.
 *
 * Renders `site_settings.privacy_policy_md` as Markdown. If Supabase is
 * not configured, falls back to a stub note.
 *
 * Wymagania pokryte: 43.
 */

import ReactMarkdown from 'react-markdown';

import { createServerClient } from '@/lib/supabase/server';

const FALLBACK_MD = `# Polityka prywatności

Pełna treść polityki będzie dostępna po skonfigurowaniu bazy danych.
Niniejsza strona jest przeznaczona do publikacji szczegółowej
informacji o przetwarzaniu danych osobowych zgodnie z RODO.

W razie pytań skontaktuj się z nami pod adresem podanym w stopce.`;

async function loadPrivacyMd(): Promise<string> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return FALLBACK_MD;
  }
  try {
    const client = await createServerClient();
    const { data } = await client
      .from('site_settings')
      .select('privacy_policy_md')
      .eq('id', 1)
      .maybeSingle();
    if (data?.privacy_policy_md) return data.privacy_policy_md as string;
  } catch (err) {
    console.warn('privacy: fallback to stub:', err);
  }
  return FALLBACK_MD;
}

export default async function PrivacyPage() {
  const md = await loadPrivacyMd();

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-eyebrow">Dokumenty prawne</p>
        <article className="markdown-body mt-4">
          <ReactMarkdown>{md}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
