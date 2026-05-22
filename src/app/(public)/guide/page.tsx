export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { PlaceCard } from '@/components/public/PlaceCard';
import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { RomanBadge } from '@/components/public/decorative/RomanBadge';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import {
  AmphoraIcon,
  AqueductIcon,
  CypressIcon,
  TuscanSunIcon,
} from '@/components/public/decorative/ItalianIcons';
import { createServerClient } from '@/lib/supabase/server';
import { getRestaurants } from '@/lib/data/restaurants';
import { getAttractions } from '@/lib/data/attractions';
import { MOCK_ATTRACTIONS, MOCK_RESTAURANTS } from '@/lib/mock-data';

const GUIDE_LINKS = [
  {
    href: '/restaurants',
    label: 'Restauracje',
    blurb: 'Trattorie i pizzerie wokół Orte — sprawdzone osobiście.',
    Icon: AmphoraIcon,
    roman: 'I' as const,
  },
  {
    href: '/places',
    label: 'Atrakcje',
    blurb: 'Orte Sotterranea, Bomarzo, Civita di Bagnoregio.',
    Icon: CypressIcon,
    roman: 'II' as const,
  },
  {
    href: '/rome',
    label: 'Jeden dzień w Rzymie',
    blurb: 'Plan dnia, transport, bilety, wskazówki praktyczne.',
    Icon: AqueductIcon,
    roman: 'III' as const,
  },
  {
    href: '/useful-info',
    label: 'Informacje praktyczne',
    blurb: 'Pociągi, wynajem auta, dojazd do Rzymu, kierunki.',
    Icon: TuscanSunIcon,
    roman: 'IV' as const,
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
    <div className="bg-crema">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Wydanie · Przewodnik</span>
          <TricoloreRule size="md" />
        </div>
        <h1 className="heading-display mt-5 text-5xl text-ink md:text-7xl">
          Wszystko, <span className="italic text-olive">co przyda się</span> w Orte
        </h1>
        <p className="text-motto mt-3 text-lg md:text-xl">— la guida di Bellaorte —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Cztery sekcje, jeden cel: spokojny pobyt bez przeglądania dziesiątek
          stron. Każde miejsce sprawdzone na żywo.
        </p>

        <SectionDivider motto="piano, piano" />

        <ul className="grid gap-6 md:grid-cols-2">
          {GUIDE_LINKS.map(({ href, label, blurb, Icon, roman }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-4 border border-gold/30 bg-flag-white p-7 transition-all hover:border-gold hover:shadow-warm-lg"
              >
                <div className="flex items-center justify-between">
                  <RomanBadge numeral={roman} size="md" variant="gold" />
                  <Icon size={32} className="text-olive" />
                </div>
                <p className="font-display text-3xl text-ink">{label}</p>
                <p className="text-sm text-cypress/80">{blurb}</p>
                <span className="mt-auto inline-flex items-center gap-1 font-display italic text-terracotta">
                  Otwórz <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SectionDivider motto="le nostre raccomandazioni" />

      <section className="border-y border-gold/30 bg-paper/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-eyebrow text-gold">Polecane restauracje</p>
              <h2 className="heading-section mt-2 text-3xl text-ink md:text-5xl">
                Świeżo <span className="italic text-olive">wybrane</span>
              </h2>
            </div>
            <Link
              href="/restaurants"
              className="link-italic font-display italic text-terracotta hover:text-wine"
            >
              Wszystkie →
            </Link>
          </div>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
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
            <p className="text-eyebrow text-gold">Polecane atrakcje</p>
            <h2 className="heading-section mt-2 text-3xl text-ink md:text-5xl">
              Co <span className="italic text-olive">warto</span> zobaczyć
            </h2>
          </div>
          <Link
            href="/places"
            className="link-italic font-display italic text-terracotta hover:text-wine"
          >
            Wszystkie →
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
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
