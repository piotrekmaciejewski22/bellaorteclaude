export const dynamic = 'force-dynamic';

/**
 * `/restaurants` — list of restaurants in `orte_area`.
 *
 * Wymagania pokryte: 14.
 */

import { PlaceCard } from '@/components/public/PlaceCard';
import { createServerClient } from '@/lib/supabase/server';
import { getRestaurants } from '@/lib/data/restaurants';
import { getRestaurantReviewStats } from '@/lib/data/review-stats';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import type { Restaurant } from '@/lib/types';

async function loadRestaurants(): Promise<Restaurant[]> {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      return await getRestaurants(client, { region: 'orte_area' });
    } catch (err) {
      console.warn('restaurants: fallback to mock:', err);
    }
  }
  return MOCK_RESTAURANTS.filter((r) => r.region === 'orte_area');
}

export default async function RestaurantsPage() {
  const restaurants = await loadRestaurants();
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
        <p className="text-eyebrow">Przewodnik · Restauracje</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Gdzie zjeść w okolicy Orte
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-cypress/80">
          Lista miejsc, które polecamy z czystym sumieniem — od trattorii w
          centrum po restauracje na obrzeżach. Każde sprawdzone osobiście.
        </p>

        {restaurants.length === 0 ? (
          <p className="mt-12 text-sm text-muted">
            Brak restauracji w tym regionie.
          </p>
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
