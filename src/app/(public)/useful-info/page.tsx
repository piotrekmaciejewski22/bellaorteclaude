export const dynamic = 'force-dynamic';

import { ExternalLink } from 'lucide-react';

import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { RomanBadge } from '@/components/public/decorative/RomanBadge';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { FaqAccordion } from '@/components/public/FaqAccordion';
import { createServerClient } from '@/lib/supabase/server';
import { getTravelInfo, TRAVEL_INFO_KIND_PL } from '@/lib/data/travel-info';
import { getFaqItems, type FaqItem } from '@/lib/data/faq';
import type { TravelInfo, TravelInfoKind } from '@/lib/types';

const ORDER: TravelInfoKind[] = [
  'rome_transfer',
  'trains',
  'car_rental',
  'travel_directions',
];

const ROMAN_FOR_KIND: Record<TravelInfoKind, 'I' | 'II' | 'III' | 'IV'> = {
  rome_transfer: 'I',
  trains: 'II',
  car_rental: 'III',
  travel_directions: 'IV',
};

export default async function UsefulInfoPage() {
  let entries: TravelInfo[] = [];
  let faqItems: FaqItem[] = [];
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      [entries, faqItems] = await Promise.all([
        getTravelInfo(client),
        getFaqItems(client).catch(() => []),
      ]);
    } catch (err) {
      console.warn('useful-info: fallback empty:', err);
    }
  }

  const groups = ORDER.map((kind) => ({
    kind,
    title: TRAVEL_INFO_KIND_PL[kind],
    items: entries.filter((e) => e.kind === kind),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="bg-crema">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Praktyczne</span>
          <TricoloreRule size="md" />
        </div>
        <h1 className="heading-display mt-5 text-5xl text-ink md:text-7xl">
          Informacje, <span className="italic text-olive">które się przydadzą</span>
        </h1>
        <p className="text-motto mt-3 text-lg md:text-xl">— informazioni utili —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Pociągi, dojazd do Rzymu, wynajem samochodu, kierunki podróży —
          wszystko zebrane w jednym miejscu.
        </p>

        {groups.length === 0 ? (
          <p className="mt-12 border border-gold/30 bg-flag-white p-8 text-center font-display italic text-stone">
            Pagina ancora bianca — informacje pojawią się po skonfigurowaniu bazy.
          </p>
        ) : (
          <div className="mt-12 space-y-12">
            {groups.map((group) => (
              <section key={group.kind}>
                <SectionDivider motto={group.title.toLowerCase()} />

                <div className="flex items-center gap-4">
                  <RomanBadge numeral={ROMAN_FOR_KIND[group.kind]} size="md" variant="gold" />
                  <h2 className="heading-section text-2xl text-ink md:text-4xl">
                    {group.title}
                  </h2>
                </div>

                <div className="mt-6 space-y-6">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      className="border border-gold/30 bg-flag-white p-7 shadow-warm"
                    >
                      <h3 className="font-display text-2xl text-ink">{item.title}</h3>
                      <div className="text-ui mt-4 whitespace-pre-line text-cypress/85">
                        {item.body}
                      </div>
                      {item.externalLinks.length > 0 && (
                        <ul className="mt-5 flex flex-wrap gap-2">
                          {item.externalLinks.map((link) => (
                            <li key={link.url}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 border border-gold/40 bg-paper px-3 py-1.5 text-xs font-display italic text-terracotta hover:border-gold hover:bg-gold/5"
                              >
                                {link.label}
                                <ExternalLink size={11} />
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {faqItems.length > 0 && (
          <section className="mt-16">
            <SectionDivider motto="domande frequenti" />
            <div className="flex items-center gap-4">
              <RomanBadge numeral="V" size="md" variant="gold" />
              <h2 className="heading-section text-2xl text-ink md:text-4xl">
                Najczęściej zadawane <span className="italic text-olive">pytania</span>
              </h2>
            </div>
            <p className="text-motto mt-3 text-lg">— le risposte rapide —</p>

            <div className="mt-8">
              <FaqAccordion items={faqItems} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
