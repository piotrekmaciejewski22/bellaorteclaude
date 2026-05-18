export const dynamic = 'force-dynamic';

/**
 * `/rome/places` — attractions in Rome region.
 *
 * Wymagania pokryte: 19.
 */

import { PlaceCard } from '@/components/public/PlaceCard';
import { createServerClient } from '@/lib/supabase/server';
import { getAttractions } from '@/lib/data/attractions';
import { getAttractionReviewStats } from '@/lib/data/review-stats';
import { MOCK_ATTRACTIONS } from '@/lib/mock-data';
import type { Attraction } from '@/lib/types';

async function loadRomeAttractions(): Promise<Attraction[]> {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      return await getAttractions(client, { region: 'rome' });
    } catch (err) {
      console.warn('rome attractions: fallback to mock:', err);
    }
  }
  return MOCK_ATTRACTIONS.filter((a) => a.region === 'rome');
}

export default async function RomeAttractionsPage() {
  const attractions = await loadRomeAttractions();
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
        <p className="text-eyebrow">Rzym · Atrakcje</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Co zobaczyć w Rzymie
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-cypress/80">
          Wybór atrakcji rzymskich, które polecamy gościom Bellaorte — z naciskiem
          na to, co da się obejść jednego dnia.
        </p>

        {attractions.length === 0 ? (
          <p className="mt-12 text-sm text-muted">Brak atrakcji w Rzymie.</p>
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
