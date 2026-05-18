/**
 * `/admin/rome` — Rome content editor (itinerary + info sections).
 *
 * Wymagania pokryte: 33.
 */

import { createServerClient } from '@/lib/supabase/server';
import { getRomeItinerary, getRomeInfoSections } from '@/lib/data/rome';
import { getRestaurants } from '@/lib/data/restaurants';
import { getAttractions } from '@/lib/data/attractions';
import { ItineraryEditor } from '@/components/admin/ItineraryEditor';

export default async function AdminRomePage() {
  const client = await createServerClient();

  const [items, info, restaurants, attractions] = await Promise.all([
    getRomeItinerary(client, { includeUnpublished: true }),
    getRomeInfoSections(client, { includeUnpublished: true }),
    getRestaurants(client, { region: 'rome', includeUnpublished: true }),
    getAttractions(client, { region: 'rome', includeUnpublished: true }),
  ]);

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">Rzym</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Treści sekcji Rzym</h1>
        <p className="text-ui mt-2 text-cypress/80">
          Plan dnia oraz 5 sekcji informacyjnych. Zmiany pojawiają się
          publicznie po zapisaniu (dzięki autoblur).
        </p>
      </header>

      <ItineraryEditor
        initialItems={items}
        initialInfo={info}
        restaurantOptions={restaurants.map((r) => ({ id: r.id, name: r.name }))}
        attractionOptions={attractions.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
