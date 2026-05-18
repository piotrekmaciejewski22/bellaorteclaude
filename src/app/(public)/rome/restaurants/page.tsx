export const dynamic = 'force-dynamic';

/**
 * `/rome/restaurants` — restaurants in Rome region.
 *
 * Wymagania pokryte: 19.
 */

import { PlaceCard } from '@/components/public/PlaceCard';
import { createServerClient } from '@/lib/supabase/server';
import { getRestaurants } from '@/lib/data/restaurants';
import { getRestaurantReviewStats } from '@/lib/data/review-stats';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import type { Restaurant } from '@/lib/types';

async function loadRomeRestaurants(): Promise<Restaurant[]> {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      return await getRestaurants(client, { region: 'rome' });
    } catch (err) {
      console.warn('rome restaurants: fallback to mock:', err);
    }
  }
  return MOCK_RESTAURANTS.filter((r) => r.region === 'rome');
}

export default async function RomeRestaurantsPage() {
  const restaurants = await loadRomeRestaurants();
  let stats = new Map();
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && restaurants.length > 0) {
    try {
      const client = await createServerClient();
      stats = await getRestaurantReviewStats(client, restaurants.map((r) => r.id));
    } catch {
      stats = new Map();
    }
  }

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-eyebrow">Rzym · Restauracje</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Gdzie zjeść w Rzymie
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-cypress/80">
          Klasyki kuchni rzymskiej w wybranych dzielnicach. Każde miejsce
          z polecanym lunchem lub kolacją podczas jednodniowej wycieczki z Orte.
        </p>

        {restaurants.length === 0 ? (
          <p className="mt-12 text-sm text-muted">Brak restauracji w Rzymie.</p>
        ) : (
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => {
              const stat = stats.get(r.id);
              return (
                <li key={r.id}>
                  <PlaceCard
                    type="restaurant"
                    slug={r.slug}
                    name={r.name}
                    description={r.description}
                    tags={[...r.cuisineCategories, ...r.tags]}
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
