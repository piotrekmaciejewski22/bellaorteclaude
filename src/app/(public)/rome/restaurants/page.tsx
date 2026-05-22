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
    <div className="bg-crema">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Rzym · Restauracje</span>
          <TricoloreRule size="md" />
        </div>

        <div className="mt-5 flex items-end gap-4">
          <AmphoraIcon size={42} className="text-olive shrink-0" />
          <h1 className="heading-display text-5xl text-ink md:text-7xl">
            Gdzie <span className="italic text-olive">zjeść</span> w Rzymie
          </h1>
        </div>
        <p className="text-motto mt-3 text-lg md:text-xl">— mangiare a Roma —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Klasyki kuchni rzymskiej w wybranych dzielnicach. Każde miejsce z
          polecanym lunchem lub kolacją podczas jednodniowej wycieczki z Orte.
        </p>

        <SectionDivider motto="la cucina romana" />

        {restaurants.length === 0 ? (
          <p className="font-display italic text-stone">Brak restauracji w Rzymie.</p>
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
