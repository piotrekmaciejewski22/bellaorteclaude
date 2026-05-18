export const dynamic = 'force-dynamic';

/**
 * `/rome/info` — practical Rome info sections.
 *
 * Wymagania pokryte: 21.
 */

import { createServerClient } from '@/lib/supabase/server';
import { getRomeInfoSections } from '@/lib/data/rome';
import type { RomeInfoSection } from '@/lib/types';

export default async function RomeInfoPage() {
  let sections: RomeInfoSection[] = [];
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      sections = await getRomeInfoSections(client);
    } catch (err) {
      console.warn('rome info: fallback empty:', err);
    }
  }

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-eyebrow">Rzym · Praktyczne</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Co warto wiedzieć przed wyjazdem
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-cypress/80">
          Transport, bilety, godziny otwarcia i bezpieczeństwo — pakiet
          informacji, które przydadzą Ci się w Rzymie.
        </p>

        {sections.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-border bg-flag-white p-6 text-sm text-muted">
            Sekcje pojawią się po skonfigurowaniu bazy.
          </p>
        ) : (
          <div className="mt-12 space-y-8">
            {sections.map((s) => (
              <article
                key={s.id}
                className="rounded-2xl border border-border bg-flag-white p-6"
              >
                <h2 className="heading-section text-2xl text-ink">{s.title}</h2>
                <div className="text-ui mt-3 whitespace-pre-line text-cypress/85">
                  {s.body}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
