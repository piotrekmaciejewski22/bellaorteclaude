export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Sun, Sunrise, Sunset, Moon, ExternalLink } from 'lucide-react';

import { MapEmbed } from '@/components/public/MapEmbed';
import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { RomanBadge, toRoman } from '@/components/public/decorative/RomanBadge';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { RomanArchIcon } from '@/components/public/decorative/ItalianIcons';
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

const DAY_PART_MOTTO: Record<DayPart, string> = {
  morning: 'la mattina',
  noon: 'mezzogiorno',
  afternoon: 'pomeriggio',
  evening: 'la sera',
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
    <div className="bg-crema">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Rzym · Plan dnia</span>
          <TricoloreRule size="md" />
        </div>

        <div className="mt-5 flex items-end gap-4">
          <RomanArchIcon size={42} className="text-olive shrink-0" />
          <h1 className="heading-display text-5xl text-ink md:text-7xl">
            Jeden dzień <span className="italic text-olive">w Rzymie</span>
          </h1>
        </div>
        <p className="text-motto mt-3 text-lg md:text-xl">— una giornata romana —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Plan poranek → wieczór, zaprojektowany pod realny przyjazd pociągiem
          z Orte. Każdy punkt linkuje do strony szczegółowej restauracji lub
          atrakcji.
        </p>

        {grouped.length === 0 ? (
          <p className="mt-12 border border-gold/30 bg-flag-white p-8 text-center font-display italic text-stone">
            Pagina ancora bianca — plan dnia pojawi się po skonfigurowaniu bazy.
          </p>
        ) : (
          <div className="mt-8 space-y-12">
            {grouped.map(({ dayPart, items: partItems }, idx) => {
              const Icon = DAY_PART_ICON[dayPart];
              return (
                <section key={dayPart}>
                  <SectionDivider motto={DAY_PART_MOTTO[dayPart]} />

                  <div className="flex items-center gap-4">
                    <RomanBadge numeral={toRoman(idx + 1)} size="md" variant="terracotta" />
                    <Icon size={28} className="text-olive" />
                    <h2 className="heading-section text-2xl text-ink md:text-4xl">
                      {DAY_PART_LABEL[dayPart]}
                    </h2>
                  </div>

                  <div className="mt-6 space-y-6">
                    {partItems.map((item) => {
                      const restaurant = item.linkedRestaurantId
                        ? restaurantById.get(item.linkedRestaurantId)
                        : null;
                      const attraction = item.linkedAttractionId
                        ? attractionById.get(item.linkedAttractionId)
                        : null;

                      return (
                        <article
                          key={item.id}
                          className="border border-gold/30 bg-flag-white p-7 shadow-warm"
                        >
                          <h3 className="font-display text-2xl text-ink md:text-3xl">
                            {item.title}
                          </h3>
                          <p className="text-ui mt-3 whitespace-pre-line text-cypress/85">
                            {item.body}
                          </p>

                          {(restaurant || attraction) && (
                            <div className="mt-5 flex flex-wrap gap-2">
                              {restaurant && (
                                <Link
                                  href={`/restaurants/${restaurant.slug}`}
                                  className="inline-flex items-center gap-2 border border-gold/40 bg-paper px-3 py-1.5 text-xs font-display italic text-terracotta hover:border-gold hover:bg-gold/5"
                                >
                                  Restauracja: {restaurant.name}
                                  <ExternalLink size={12} />
                                </Link>
                              )}
                              {attraction && (
                                <Link
                                  href={`/places/${attraction.slug}`}
                                  className="inline-flex items-center gap-2 border border-gold/40 bg-paper px-3 py-1.5 text-xs font-display italic text-terracotta hover:border-gold hover:bg-gold/5"
                                >
                                  Atrakcja: {attraction.name}
                                  <ExternalLink size={12} />
                                </Link>
                              )}
                            </div>
                          )}

                          {(restaurant || attraction) && (
                            <div className="mt-5">
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
