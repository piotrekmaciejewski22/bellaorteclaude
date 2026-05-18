export const dynamic = 'force-dynamic';

/**
 * `/useful-info` — practical travel information.
 *
 * Wymagania pokryte: 22.
 */

import { ExternalLink } from 'lucide-react';

import { createServerClient } from '@/lib/supabase/server';
import { getTravelInfo, TRAVEL_INFO_KIND_PL } from '@/lib/data/travel-info';
import type { TravelInfo, TravelInfoKind } from '@/lib/types';

const ORDER: TravelInfoKind[] = [
  'rome_transfer',
  'trains',
  'car_rental',
  'travel_directions',
];

const FALLBACK_NOTE =
  'Po podłączeniu bazy w tej sekcji pojawią się informacje praktyczne dot. dojazdu i podróży.';

export default async function UsefulInfoPage() {
  let entries: TravelInfo[] = [];
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      entries = await getTravelInfo(client);
    } catch (err) {
      console.warn('useful-info: fallback empty:', err);
    }
  }

  // Group by kind in fixed order.
  const groups = ORDER.map((kind) => ({
    kind,
    title: TRAVEL_INFO_KIND_PL[kind],
    items: entries.filter((e) => e.kind === kind),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-eyebrow">Przewodnik · Praktyczne</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Informacje, które przydadzą Ci się w drodze
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-cypress/80">
          Pociągi, dojazd do Rzymu, wynajem samochodu, kierunki podróży —
          wszystko zebrane w jednym miejscu.
        </p>

        {groups.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-border bg-flag-white p-6 text-sm text-muted">
            {FALLBACK_NOTE}
          </p>
        ) : (
          <div className="mt-12 space-y-10">
            {groups.map((group) => (
              <section key={group.kind}>
                <p className="text-eyebrow">{group.title}</p>
                <div className="mt-4 space-y-6">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-border bg-flag-white p-6"
                    >
                      <h2 className="heading-section text-2xl text-ink">
                        {item.title}
                      </h2>
                      <div className="text-ui mt-3 whitespace-pre-line text-cypress/85">
                        {item.body}
                      </div>
                      {item.externalLinks.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {item.externalLinks.map((link) => (
                            <li key={link.url}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full border border-italian-green/30 bg-soft-green px-3 py-1.5 text-xs font-semibold text-italian-green hover:bg-italian-green hover:text-flag-white"
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
      </div>
    </div>
  );
}
