/**
 * ApartmentCard — w stylu karty z magazynu wnętrzarskiego.
 *
 * Numerek rzymski w gold-frame, kursywne nazwy detali, gold underline na
 * hover. Brak ceny w UI (Wym. 4).
 */

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BedDouble, Bath, Users } from "lucide-react";
import type { Apartment } from "@/lib/types";

interface ApartmentCardProps {
  apartment: Apartment;
  heroSrc: string;
  nextAvailability?: string;
  numeral?: "I" | "II";
}

export function ApartmentCard({
  apartment,
  heroSrc,
  nextAvailability,
  numeral,
}: ApartmentCardProps) {
  return (
    <article className="group relative">
      {/* Numer rzymski wystający */}
      {numeral && (
        <div
          aria-hidden="true"
          className="absolute -top-4 left-6 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-crema badge-roman text-base text-gold"
        >
          {numeral}
        </div>
      )}

      <Link
        href={`/apartments/${apartment.slug}`}
        className="block overflow-hidden border border-gold/30 bg-crema transition-all hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        aria-label={`Zobacz szczegóły apartamentu ${apartment.name}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-paper">
          <Image
            src={heroSrc}
            alt={`Widok apartamentu ${apartment.name}`}
            fill
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          {nextAvailability && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-2 border border-gold/50 bg-crema/90 px-3 py-1.5 text-xs font-display italic text-cypress shadow-warm backdrop-blur">
              <span className="text-gold">·</span>
              {nextAvailability}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-5 p-7">
          <div>
            <p className="text-eyebrow text-gold">
              {apartment.bedrooms === 1 ? "Per due" : "Per famiglia"}
            </p>
            <h3 className="heading-section mt-2 text-3xl text-ink transition-colors group-hover:text-terracotta md:text-4xl">
              {apartment.name}
            </h3>
          </div>

          <p className="text-ui line-clamp-3 text-cypress/80">
            {apartment.description}
          </p>

          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gold/20 pt-4 font-display italic text-cypress">
            <li className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-olive" />
              <span>
                fino a <strong className="not-italic font-medium">{apartment.maxGuests}</strong>{" "}
                {apartment.maxGuests === 1 ? "ospite" : "ospiti"}
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <BedDouble size={14} className="text-olive" />
              <span>
                <strong className="not-italic font-medium">{apartment.bedrooms}</strong>{" "}
                {apartment.bedrooms === 1 ? "camera" : "camere"}
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Bath size={14} className="text-olive" />
              <span>
                <strong className="not-italic font-medium">{apartment.bathrooms}</strong>{" "}
                {apartment.bathrooms === 1 ? "bagno" : "bagni"}
              </span>
            </li>
          </ul>

          {apartment.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {apartment.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="border border-gold/30 px-3 py-1 text-[11px] uppercase tracking-wider text-stone"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gold/20 pt-4">
            <span className="link-italic font-display italic text-terracotta">
              Dettagli e calendario
            </span>
            <ArrowRight size={16} className="text-terracotta transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </article>
  );
}
