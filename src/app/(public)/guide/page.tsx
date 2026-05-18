export const dynamic = 'force-dynamic';

/**
 * `/guide` — guide hub.
 *
 * Wymagania pokryte: 13.
 */

import Link from 'next/link';
import { ArrowRight, Compass, Map, Train, Utensils } from 'lucide-react';

import { PlaceCard } from '@/components/public/PlaceCard';
import { createServerClient } from '@/lib/supabase/server';
import { getRestaurants } from '@/lib/data/restaurants';
import { getAttractions } from '@/lib/data/attractions';
import { MOCK_ATTRACTIONS, MOCK_RESTAURANTS } from '@/lib/mock-data';

const GUIDE_LINKS = [
  {
    href: '/restaurants',
    label: 'Restauracje w okolicy',
    blurb: 'Trattorie i pizzerie wokół Orte — sprawdzone osobiście.',
    icon: Utensils,
  },
  {
    href: '/places',
    label: 'Atrakcje regionu',
    blurb: 'Orte Sotterranea, Bomarzo, Civita di Bagnoregio.',
    icon: Map,
  },
  {
    href: '/rome',
    label: 'Jeden dzień w Rzymie',
    blurb: 'Itinerary, transport, bilety, wskazówki praktyczne.',
    icon: Compass,
  },
  {
    href: '/useful-info',
    label: 'Informacje praktyczne',
    blurb: 'Pociągi, wynajem auta, dojazd do Rzymu, kierunki.',
    icon: Train,
  },
] as const;

export default async function GuidePage() {
  let recommendedRestaurants = MOCK_RESTAURANTS.slice(0, 3);
  let recommendedAttractions = MOCK_ATTRACTIONS.slice(0, 3);

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      const [restaurants, attractions] = await Promise.all([
        getRestaurants(client, { region: 'orte_area', limit: 3 }),
        getAttractions(client, { region: 'orte_area', limit: 3 }),
      ]);
      if (restaurants.length > 0) recommendedRestaurants = restaurants;
      if (attractions.length > 0) recommendedAttractions = attractions;
    } catch (err) {
      console.warn('guide hub: fallback to mocks:', err);
    }
  }

  return (
    <div className="bg-ivory">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-eyebrow">Przewodnik</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Wszystko, co przyda Ci się w Orte
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-cypress/80">
          Cztery sekcje, jeden cel: spokojny pobyt bez przeglądania dziesiątek
          stron. Niczego nie polecamy „na ślepo” — każde miejsce sprawdzone na
          żywo.
        </p>

        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {GUIDE_LINKS.map(({ href, label, blurb, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-flag-white p-6 transition-colors hover:border-italian-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-italian-green"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-soft-green text-italian-green">
                  <Icon size={20} />
                </span>
                <p className="font-display text-2xl text-ink">{label}</p>
                <p className="text-sm text-cypress/80">{blurb}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-italian-green">
                  Otwórz
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-flag-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-eyebrow">Polecane restauracje</p>
              <h2 className="heading-section mt-1 text-3xl text-ink">
                Świeżo wybrane.
              </h2>
            </div>
            <Link
              href="/restaurants"
              className="text-sm font-semibold text-italian-green hover:text-cypress"
            >
              Zobacz wszystkie →
            </Link>
          </div>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {recommendedRestaurants.map((r) => (
              <li key={r.id}>
                <PlaceCard
                  type="restaurant"
                  slug={r.slug}
                  name={r.name}
                  description={r.description}
                  tags={[...r.cuisineCategories, ...r.tags]}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-eyebrow">Polecane atrakcje</p>
            <h2 className="heading-section mt-1 text-3xl text-ink">
              Co warto zobaczyć.
            </h2>
          </div>
          <Link
            href="/places"
            className="text-sm font-semibold text-italian-green hover:text-cypress"
          >
            Zobacz wszystkie →
          </Link>
        </div>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {recommendedAttractions.map((a) => (
            <li key={a.id}>
              <PlaceCard
                type="attraction"
                slug={a.slug}
                name={a.name}
                description={a.description}
                tags={a.tags}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
