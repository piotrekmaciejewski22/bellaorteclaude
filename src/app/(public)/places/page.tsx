export const dynamic = 'force-dynamic';

/**
 * `/places` — list of attractions in `orte_area`.
 *
 * Wymagania pokryte: 16.
 */

import { PlaceCard } from '@/components/public/PlaceCard';
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
    <div className="bg-ivory">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-eyebrow">Przewodnik · Atrakcje</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Co warto zobaczyć w regionie
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-cypress/80">
          Orte Sotterranea, Bomarzo, Civita di Bagnoregio i inne miejsca w
          okolicy — sprawdzone propozycje na półdniowe i całodniowe wycieczki.
        </p>

        {attractions.length === 0 ? (
          <p className="mt-12 text-sm text-muted">Brak atrakcji w tym regionie.</p>
        ) : (
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
