export const dynamic = 'force-dynamic';

/**
 * `/apartments` — strona listy apartamentów.
 */

import { ApartmentCard } from "@/components/public/ApartmentCard";
import { SectionDivider } from "@/components/public/decorative/SectionDivider";
import { TricoloreRule } from "@/components/public/decorative/TricoloreRule";
import {
  MOCK_APARTMENTS,
  MOCK_APARTMENT_HERO,
  MOCK_NEXT_AVAILABLE,
} from "@/lib/mock-data";
import { createServerClient } from "@/lib/supabase/server";
import {
  getApartments,
  getApartmentGallery,
  filterDisplayablePhotos,
  publicSiteMediaUrl,
} from "@/lib/data/apartments";

export default async function ApartmentsPage() {
  let apartments: typeof MOCK_APARTMENTS = MOCK_APARTMENTS;
  const apartmentHeroByslug: Record<string, string> = {};

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const client = await createServerClient();
      const apts = await getApartments(client);
      if (apts.length > 0) apartments = apts;

      for (const apt of apts) {
        try {
          const photos = await getApartmentGallery(client, apt.id);
          const filtered = filterDisplayablePhotos(photos);
          if (filtered.length > 0) {
            apartmentHeroByslug[apt.slug] = publicSiteMediaUrl(filtered[0].storagePath);
          }
        } catch (err) {
          console.warn(`gallery for ${apt.slug}:`, err);
        }
      }
    } catch (err) {
      console.warn('apartments list:', err);
    }
  }

  return (
    <div className="bg-crema">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Wydanie I · Apartamenty</span>
          <TricoloreRule size="md" />
        </div>

        <h1 className="heading-display mt-5 text-5xl text-ink md:text-6xl">
          Dwa apartamenty <span className="italic text-olive">BELLAORTE</span>
        </h1>
        <p className="text-motto mt-3 text-lg md:text-xl">— due dimore in Tuscia —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Każdy apartament ma swój charakter. Ten sam standard wykończenia,
          w pełni wyposażone kuchnie, klimatyzacja i ręczniki na miejscu.
          Zarezerwuj termin — odpowiemy ręcznie mailem.
        </p>

        <SectionDivider motto="dolce far niente" />

        <div className="grid gap-8 md:grid-cols-2">
          {apartments.map((apartment, idx) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              heroSrc={
                apartmentHeroByslug[apartment.slug] ??
                MOCK_APARTMENT_HERO[apartment.slug] ??
                "/placeholders/orte-1.svg"
              }
              nextAvailability={MOCK_NEXT_AVAILABLE[apartment.slug]}
              numeral={idx === 0 ? "I" : "II"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
