export const dynamic = 'force-dynamic';

import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { AqueductIcon } from '@/components/public/decorative/ItalianIcons';
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
    <div className="bg-crema">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Rzym · Praktyczne</span>
          <TricoloreRule size="md" />
        </div>

        <div className="mt-5 flex items-end gap-4">
          <AqueductIcon size={42} className="text-olive shrink-0" />
          <h1 className="heading-display text-4xl text-ink md:text-6xl">
            Co warto <span className="italic text-olive">wiedzieć</span> przed wyjazdem
          </h1>
        </div>
        <p className="text-motto mt-3 text-lg md:text-xl">— informazioni utili a Roma —</p>

        <p className="text-ui mt-6 text-cypress/85">
          Transport, bilety, godziny otwarcia i bezpieczeństwo — pakiet
          informacji, które przydadzą się w Rzymie.
        </p>

        <SectionDivider motto="il segreto è la preparazione" />

        {sections.length === 0 ? (
          <p className="border border-gold/30 bg-flag-white p-8 text-center font-display italic text-stone">
            Pagina ancora bianca — sekcje pojawią się po skonfigurowaniu bazy.
          </p>
        ) : (
          <div className="space-y-8">
            {sections.map((s) => (
              <article
                key={s.id}
                className="border border-gold/30 bg-flag-white p-7 shadow-warm"
              >
                <h2 className="heading-section text-2xl text-ink md:text-3xl">{s.title}</h2>
                <div className="text-ui mt-4 whitespace-pre-line text-cypress/85">
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
