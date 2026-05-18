/**
 * Home page (`/`).
 *
 * Server Component. Currently consumes mock data from `@/lib/mock-data`;
 * once task 8.2 / data layer ships, swap for `getApartments()` and
 * `computeNextAvailability()`.
 *
 * Wymaganie 1.
 */

import Link from "next/link";
import { ArrowRight, MapPin, Train, Utensils } from "lucide-react";
import { HeroSection } from "@/components/public/HeroSection";
import { ApartmentCard } from "@/components/public/ApartmentCard";
import {
  MOCK_APARTMENTS,
  MOCK_APARTMENT_HERO,
  MOCK_NEXT_AVAILABLE,
} from "@/lib/mock-data";
import { createServerClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data/settings";
import { publicSiteMediaUrl } from "@/lib/data/apartments";

const GUIDE_LINKS = [
  {
    href: "/restaurants",
    label: "Restauracje w okolicy",
    icon: Utensils,
    blurb:
      "Od trattori w Orte po klasyki kuchni rzymskiej. Polecamy tylko sprawdzone miejsca.",
  },
  {
    href: "/places",
    label: "Atrakcje i krajobrazy",
    icon: MapPin,
    blurb:
      "Orte Sotterranea, Bomarzo, Civita di Bagnoregio — szlak na pierwszą wizytę w regionie.",
  },
  {
    href: "/rome",
    label: "Rzym w jeden dzień",
    icon: Train,
    blurb:
      "Itinerary, transport z Orte i informacje praktyczne — wszystko w jednym miejscu.",
  },
] as const;

export default async function HomePage() {
  let heroUrl: string | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const client = await createServerClient();
      const settings = await getSiteSettings(client);
      if (settings?.heroImagePath) {
        heroUrl = publicSiteMediaUrl(settings.heroImagePath);
      }
    } catch {
      heroUrl = null;
    }
  }

  return (
    <>
      <HeroSection imageUrl={heroUrl} />

      <section
        id="apartamenty"
        className="mx-auto max-w-6xl px-6 py-20"
        aria-labelledby="apartamenty-heading"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-eyebrow">Apartamenty</p>
            <h2
              id="apartamenty-heading"
              className="heading-section mt-2 text-4xl text-ink md:text-5xl"
            >
              Dwa miejsca, dwa charaktery.
            </h2>
          </div>
          <Link
            href="/apartments"
            className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
          >
            Zobacz oba
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {MOCK_APARTMENTS.map((apartment) => (
            <ApartmentCard
              key={apartment.id}
              apartment={apartment}
              heroSrc={MOCK_APARTMENT_HERO[apartment.slug] ?? "/placeholders/orte-1.svg"}
              nextAvailability={MOCK_NEXT_AVAILABLE[apartment.slug]}
            />
          ))}
        </div>
      </section>

      <section
        className="border-y border-border bg-flag-white"
        aria-labelledby="przewodnik-heading"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-eyebrow">Przewodnik</p>
          <h2
            id="przewodnik-heading"
            className="heading-section mt-2 text-4xl text-ink md:text-5xl"
          >
            Co robić po przyjeździe.
          </h2>
          <p className="text-ui mt-4 max-w-2xl text-cypress/80">
            Lokalne wskazówki: gdzie zjeść, dokąd pojechać, jak dostać się do
            Rzymu. Bez listy „top 50” — tylko sprawdzone miejsca.
          </p>

          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {GUIDE_LINKS.map(({ href, label, icon: Icon, blurb }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-ivory p-6 transition-colors hover:border-italian-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-italian-green"
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
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-eyebrow">Dostępność</p>
        <h2 className="heading-section mt-2 text-4xl text-ink md:text-5xl">
          Termin sprawdzasz w 30 sekund.
        </h2>
        <p className="text-ui mt-4 text-cypress/80">
          Kalendarz pokazuje, kiedy apartament jest wolny, oczekujący lub
          zajęty. Zapytanie wysyłasz przez formularz — odpowiadamy
          potwierdzeniem mailowym, bez płatności online.
        </p>
        <Link
          href="/booking"
          className="mt-8 inline-flex rounded-full bg-italian-green px-7 py-3 text-base font-semibold text-flag-white shadow-sm transition-colors hover:bg-cypress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-italian-green"
        >
          Otwórz formularz rezerwacji
        </Link>
      </section>
    </>
  );
}
