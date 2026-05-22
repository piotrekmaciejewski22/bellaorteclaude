export const dynamic = 'force-dynamic';

import { PlaceCard } from '@/components/public/PlaceCard';
import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { AmphoraIcon } from '@/components/public/decorative/ItalianIcons';
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
    <div className="bg-crema">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Przewodnik · Restauracje</span>
          <TricoloreRule size="md" />
        </div>

        <div className="mt-5 flex items-end gap-4">
          <AmphoraIcon size={42} className="text-olive shrink-0" />
          <h1 className="heading-display text-5xl text-ink md:text-7xl">
            Gdzie zjeść <span className="italic text-olive">w okolicy Orte</span>
          </h1>
        </div>
        <p className="text-motto mt-3 text-lg md:text-xl">— dove mangiare —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Lista miejsc, które polecamy z czystym sumieniem — od trattorii w
          centrum po restauracje na obrzeżach. Każde sprawdzone osobiście.
        </p>

        <SectionDivider motto="buon appetito" />

        {restaurants.length === 0 ? (
          <p className="font-display text-lg italic text-stone">
            Pagina ancora bianca — brak restauracji w tym regionie.
          </p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
