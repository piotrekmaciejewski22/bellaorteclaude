export const dynamic = 'force-dynamic';

import { PlaceCard } from '@/components/public/PlaceCard';
import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { CypressIcon } from '@/components/public/decorative/ItalianIcons';
import { createServerClient } from '@/lib/supabase/server';
import { getAttractions } from '@/lib/data/attractions';
import { getAttractionReviewStats } from '@/lib/data/review-stats';
import { MOCK_ATTRACTIONS } from '@/lib/mock-data';
import type { Attraction } from '@/lib/types';

async function loadAttractions(): Promise<Attraction[]> {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      return await getAttractions(client, { region: 'orte_area' });
    } catch (err) {
      console.warn('places: fallback to mock:', err);
    }
  }
  return MOCK_ATTRACTIONS.filter((a) => a.region === 'orte_area');
}

export default async function PlacesPage() {
  const attractions = await loadAttractions();
  let stats = new Map();
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && attractions.length > 0) {
    try {
      const client = await createServerClient();
      stats = await getAttractionReviewStats(client, attractions.map((a) => a.id));
    } catch {
      stats = new Map();
    }
  }

  return (
    <div className="bg-crema">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Przewodnik · Atrakcje</span>
          <TricoloreRule size="md" />
        </div>

        <div className="mt-5 flex items-end gap-4">
          <CypressIcon size={42} className="text-olive shrink-0" />
          <h1 className="heading-display text-5xl text-ink md:text-7xl">
            Co warto <span className="italic text-olive">zobaczyć</span>
          </h1>
        </div>
        <p className="text-motto mt-3 text-lg md:text-xl">— da non perdere —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Orte Sotterranea, Bomarzo, Civita di Bagnoregio i inne miejsca w
          okolicy — sprawdzone propozycje na półdniowe i całodniowe wycieczki.
        </p>

        <SectionDivider motto="da non perdere" />

        {attractions.length === 0 ? (
          <p className="font-display text-lg italic text-stone">
            Pagina ancora bianca — brak atrakcji w tym regionie.
          </p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {attractions.map((a) => {
              const stat = stats.get(a.id);
              return (
                <li key={a.id}>
                  <PlaceCard
                    type="attraction"
                    slug={a.slug}
                    name={a.name}
                    description={a.description}
                    tags={a.tags}
                    averageRating={stat?.average ?? null}
                    reviewCount={stat?.count ?? 0}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
