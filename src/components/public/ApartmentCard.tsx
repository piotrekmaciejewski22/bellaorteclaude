/**
 * ApartmentCard — card linking to one apartment's detail page.
 *
 * Server Component. Currently uses mock SVG hero from `/placeholders/`;
 * once `gallery_photos` bucket has real assets, swap for the first
 * gallery photo URL.
 *
 * Wymaganie 4 (no price in UI).
 */

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BedDouble, Bath, Users } from "lucide-react";
import type { Apartment } from "@/lib/types";

interface ApartmentCardProps {
  apartment: Apartment;
  heroSrc: string;
  nextAvailability?: string;
}

export function ApartmentCard({
  apartment,
  heroSrc,
  nextAvailability,
}: ApartmentCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-flag-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/apartments/${apartment.slug}`}
        className="relative block aspect-[4/3] w-full overflow-hidden"
        aria-label={`Zobacz szczegóły apartamentu ${apartment.name}`}
      >
        <Image
          src={heroSrc}
          alt={`Widok apartamentu ${apartment.name}`}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(min-width: 768px) 50vw, 100vw"
        />
        {nextAvailability && (
          <span className="absolute left-4 top-4 rounded-full bg-flag-white/95 px-3 py-1 text-xs font-medium text-italian-green shadow-sm">
            {nextAvailability}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <p className="text-eyebrow">{apartment.bedrooms === 1 ? "Apartament dla pary" : "Apartament rodzinny"}</p>
          <h3 className="heading-section mt-2 text-3xl text-ink">
            <Link
              href={`/apartments/${apartment.slug}`}
              className="hover:text-italian-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-italian-green"
            >
              {apartment.name}
            </Link>
          </h3>
        </div>

        <p className="text-ui text-cypress/80 line-clamp-3">
          {apartment.description}
        </p>

        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-cypress">
          <li className="flex items-center gap-2">
            <Users size={16} className="text-italian-green" />
            do {apartment.maxGuests} {apartment.maxGuests === 1 ? "gościa" : "gości"}
          </li>
          <li className="flex items-center gap-2">
            <BedDouble size={16} className="text-italian-green" />
            {apartment.bedrooms} {apartment.bedrooms === 1 ? "sypialnia" : "sypialnie"}
          </li>
          <li className="flex items-center gap-2">
            <Bath size={16} className="text-italian-green" />
            {apartment.bathrooms} {apartment.bathrooms === 1 ? "łazienka" : "łazienki"}
          </li>
        </ul>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {apartment.amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="rounded-full bg-soft-green px-3 py-1 text-xs font-medium text-cypress"
            >
              {amenity}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Link
            href={`/apartments/${apartment.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
          >
            Szczegóły i kalendarz
            <ArrowRight size={16} />
          </Link>
          <Link
            href={`/booking?apartmentId=${apartment.id}`}
            className="rounded-full border border-italian-green/30 px-4 py-2 text-sm font-semibold text-italian-green transition-colors hover:bg-italian-green hover:text-flag-white"
          >
            Zapytaj o termin
          </Link>
        </div>
      </div>
    </article>
  );
}
