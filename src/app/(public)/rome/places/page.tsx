export const dynamic = 'force-dynamic';

import { PlaceCard } from '@/components/public/PlaceCard';
import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { RomanArchIcon } from '@/components/public/decorative/ItalianIcons';
import { createServerClient } from '@/lib/supabase/server';
import { getAttractions } from '@/lib/data/attractions';
import { getAttractionReviewStats } from '@/lib/data/review-stats';
import { MOCK_ATTRACTIONS } from '@/lib/mock-data';
import type { Attraction } from '@/lib/types';

async function loadRomeAttractions(): Promise<Attraction[]> {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      return await getAttractions(client, { region: 'rome' });
    } catch (err) {
      console.warn('rome attractions: fallback to mock:', err);
    }
  }
  return MOCK_ATTRACTIONS.filter((a) => a.region === 'rome');
}

export default async function RomeAttractionsPage() {
  const attractions = await loadRomeAttractions();
  let stats = new Map();
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && attractions.length > 0) {
    try {
      const client = await createServerClient();
      stats = await getAttractionReviewStats(client, attractions.map((a) => a.id));
    } catch {
      stats = new Map();
    }
  }

  return (
    <div className="bg-crema">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Rzym · Atrakcje</span>
          <TricoloreRule size="md" />
        </div>

        <div className="mt-5 flex items-end gap-4">
          <RomanArchIcon size={42} className="text-olive shrink-0" />
          <h1 className="heading-display text-5xl text-ink md:text-7xl">
            Co <span className="italic text-olive">zobaczyć</span> w Rzymie
          </h1>
        </div>
        <p className="text-motto mt-3 text-lg md:text-xl">— le meraviglie di Roma —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Wybór atrakcji rzymskich, które polecamy gościom Bellaorte — z naciskiem
          na to, co da się obejść jednego dnia.
        </p>

        <SectionDivider motto="la città eterna" />

        {attractions.length === 0 ? (
          <p className="font-display italic text-stone">Brak atrakcji w Rzymie.</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {attractions.map((a) => {
              const stat = stats.get(a.id);
              return (
                <li key={a.id}>
                  <PlaceCard
                    type="attraction"
                    slug={a.slug}
                    name={a.name}
                    description={a.description}
                    tags={a.tags}
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
