export const dynamic = 'force-dynamic';

/**
 * `/rome/itinerary` — one-day Rome itinerary.
 *
 * Wymagania pokryte: 20.
 */

import Link from 'next/link';
import { Sun, Sunrise, Sunset, Moon, ExternalLink } from 'lucide-react';

import { MapEmbed } from '@/components/public/MapEmbed';
import { createServerClient } from '@/lib/supabase/server';
import { getRomeItinerary } from '@/lib/data/rome';
import { getRestaurants } from '@/lib/data/restaurants';
import { getAttractions } from '@/lib/data/attractions';
import type {
  Attraction,
  DayPart,
  Restaurant,
  RomeItineraryItem,
} from '@/lib/types';

const DAY_PART_LABEL: Record<DayPart, string> = {
  morning: 'Poranek',
  noon: 'Południe',
  afternoon: 'Popołudnie',
  evening: 'Wieczór',
};

const DAY_PART_ICON: Record<DayPart, React.ComponentType<{ size?: number; className?: string }>> = {
  morning: Sunrise,
  noon: Sun,
  afternoon: Sunset,
  evening: Moon,
};

const ORDER: DayPart[] = ['morning', 'noon', 'afternoon', 'evening'];

export default async function RomeItineraryPage() {
  let items: RomeItineraryItem[] = [];
  const restaurantById = new Map<string, Restaurant>();
  const attractionById = new Map<string, Attraction>();

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      items = await getRomeItinerary(client);

      const restaurantIds = items
        .map((i) => i.linkedRestaurantId)
        .filter((id): id is string => id !== null);
      const attractionIds = items
        .map((i) => i.linkedAttractionId)
        .filter((id): id is string => id !== null);

      if (restaurantIds.length > 0) {
        const restaurants = await getRestaurants(client, { region: 'rome' });
        for (const r of restaurants) restaurantById.set(r.id, r);
      }
      if (attractionIds.length > 0) {
        const attractions = await getAttractions(client, { region: 'rome' });
        for (const a of attractions) attractionById.set(a.id, a);
      }
    } catch (err) {
      console.warn('rome itinerary: failed to load:', err);
    }
  }

  const grouped = ORDER.map((dayPart) => ({
    dayPart,
    items: items.filter((i) => i.dayPart === dayPart),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-eyebrow">Rzym · Itinerary</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Jeden dzień w Rzymie
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-cypress/80">
          Plan poranek → wieczór, zaprojektowany pod realny przyjazd pociągiem
          z Orte. Każdy punkt linkuje do strony szczegółowej restauracji lub
          atrakcji.
        </p>

        {grouped.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-border bg-flag-white p-6 text-sm text-muted">
            Plan dnia będzie dostępny po skonfigurowaniu bazy.
          </p>
        ) : (
          <div className="mt-12 space-y-10">
            {grouped.map(({ dayPart, items }) => {
              const Icon = DAY_PART_ICON[dayPart];
              return (
                <section key={dayPart}>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-soft-green text-italian-green">
                      <Icon size={20} />
                    </span>
                    <h2 className="heading-section text-3xl text-ink">
                      {DAY_PART_LABEL[dayPart]}
                    </h2>
                  </div>
                  <div className="mt-4 space-y-6">
                    {items.map((item) => {
                      const restaurant = item.linkedRestaurantId
                        ? restaurantById.get(item.linkedRestaurantId)
                        : null;
                      const attraction = item.linkedAttractionId
                        ? attractionById.get(item.linkedAttractionId)
                        : null;

                      return (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-border bg-flag-white p-6"
                        >
                          <h3 className="heading-section text-2xl text-ink">
                            {item.title}
                          </h3>
                          <p className="text-ui mt-3 whitespace-pre-line text-cypress/85">
                            {item.body}
                          </p>

                          {(restaurant || attraction) && (
                            <div className="mt-5">
                              {restaurant && (
                                <Link
                                  href={`/restaurants/${restaurant.slug}`}
                                  className="inline-flex items-center gap-2 rounded-full border border-italian-green/30 bg-soft-green px-4 py-1.5 text-xs font-semibold text-italian-green hover:bg-italian-green hover:text-flag-white"
                                >
                                  Restauracja: {restaurant.name}
                                  <ExternalLink size={12} />
                                </Link>
                              )}
                              {attraction && (
                                <Link
                                  href={`/places/${attraction.slug}`}
                                  className="inline-flex items-center gap-2 rounded-full border border-italian-green/30 bg-soft-green px-4 py-1.5 text-xs font-semibold text-italian-green hover:bg-italian-green hover:text-flag-white"
                                >
                                  Atrakcja: {attraction.name}
                                  <ExternalLink size={12} />
                                </Link>
                              )}
                            </div>
                          )}

                          {(restaurant || attraction) && (
                            <div className="mt-4">
                              <MapEmbed
                                address={restaurant?.address ?? attraction?.address}
                                placeId={restaurant?.placeId ?? attraction?.placeId}
                                latitude={restaurant?.latitude ?? attraction?.latitude}
                                longitude={restaurant?.longitude ?? attraction?.longitude}
                                mapsUrl={restaurant?.mapsUrl ?? attraction?.mapsUrl}
                                name={restaurant?.name ?? attraction?.name}
                              />
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
