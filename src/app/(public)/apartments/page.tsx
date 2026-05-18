/**
 * `/apartments` — list of all (currently 2) apartments.
 *
 * Server Component. Mocked data; once task 8.3 wires up Supabase, swap
 * `MOCK_APARTMENTS` for `getApartments({ publishedOnly: true })`.
 *
 * Wymaganie 4.
 */

import { ApartmentCard } from "@/components/public/ApartmentCard";
import {
  MOCK_APARTMENTS,
  MOCK_APARTMENT_HERO,
  MOCK_NEXT_AVAILABLE,
} from "@/lib/mock-data";

export default function ApartmentsPage() {
  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <p className="text-eyebrow">Apartamenty</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Dwa apartamenty BELLAORTE
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-lg text-cypress/80">
          Każdy apartament ma własny charakter — ten sam standard wykończenia,
          w pełni wyposażone kuchnie, klimatyzację i ręczniki na miejscu.
          Zarezerwuj termin, a my potwierdzimy go ręcznie mailowo.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {MOCK_APARTMENTS.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              heroSrc={MOCK_APARTMENT_HERO[apartment.slug] ?? "/placeholders/orte-1.svg"}
              nextAvailability={MOCK_NEXT_AVAILABLE[apartment.slug]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
