export const dynamic = 'force-dynamic';

import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { PlacesMap } from '@/components/public/PlacesMap';
import { createServerClient } from '@/lib/supabase/server';
import { getRestaurants } from '@/lib/data/restaurants';
import { getAttractions } from '@/lib/data/attractions';
import { getApartments } from '@/lib/data/apartments';

export default async function MapaPage() {
  let restaurants: Awaited<ReturnType<typeof getRestaurants>> = [];
  let attractions: Awaited<ReturnType<typeof getAttractions>> = [];
  let apartments: Awaited<ReturnType<typeof getApartments>> = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const client = await createServerClient();
      [restaurants, attractions, apartments] = await Promise.all([
        getRestaurants(client),
        getAttractions(client),
        getApartments(client),
      ]);
    } catch (err) {
      console.warn('mapa:', err);
    }
  }

  // Konwertujemy do uniwersalnego formatu dla komponentu mapy
  const places = [
    ...apartments.map((a) => ({
      id: a.id,
      type: 'apartment' as const,
      name: a.name,
      address: 'Orte, Provincia di Viterbo',
      latitude: 42.4583, // przybliżenie dla Orte
      longitude: 12.3833,
      slug: a.slug,
      region: 'orte_area' as const,
    })),
    ...restaurants
      .filter((r) => r.latitude !== null && r.longitude !== null)
      .map((r) => ({
        id: r.id,
        type: 'restaurant' as const,
        name: r.name,
        address: r.address ?? '',
        latitude: r.latitude!,
        longitude: r.longitude!,
        slug: r.slug,
        region: r.region,
      })),
    ...attractions
      .filter((a) => a.latitude !== null && a.longitude !== null)
      .map((a) => ({
        id: a.id,
        type: 'attraction' as const,
        name: a.name,
        address: a.address ?? '',
        latitude: a.latitude!,
        longitude: a.longitude!,
        slug: a.slug,
        region: a.region,
      })),
  ];

  return (
    <div className="bg-crema">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Mapa</span>
          <TricoloreRule size="md" />
        </div>

        <h1 className="heading-display mt-5 text-5xl text-ink md:text-7xl">
          Wszystkie <span className="italic text-olive">miejsca</span>
        </h1>
        <p className="text-motto mt-3 text-lg md:text-xl">— la mappa di Bellaorte —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Apartamenty, restauracje i atrakcje w jednym miejscu. Kliknij pin żeby
          zobaczyć szczegóły. Filtruj po regionie i typie.
        </p>

        <SectionDivider motto="dove andare" />

        <PlacesMap places={places} />
      </div>
    </div>
  );
}
