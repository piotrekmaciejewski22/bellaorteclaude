export const dynamic = 'force-dynamic';

/**
 * `/apartments/[slug]` — strona szczegółu apartamentu.
 *
 * Magazynowy lifting: numer rzymski, gold-frame galeria, italic detale.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BedDouble, Bath, Users, MapPin } from 'lucide-react';

import { AvailabilityCalendar } from '@/components/public/AvailabilityCalendar';
import { StatusLegend } from '@/components/public/StatusLegend';
import { MapEmbed } from '@/components/public/MapEmbed';
import { ApartmentGallery, type GalleryPhotoEntry } from '@/components/public/ApartmentGallery';
import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { RomanBadge } from '@/components/public/decorative/RomanBadge';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { OrnamentSimple } from '@/components/public/decorative/Ornament';
import { TowerIcon } from '@/components/public/decorative/ItalianIcons';
import {
  MOCK_APARTMENTS,
  MOCK_APARTMENT_HERO,
} from '@/lib/mock-data';
import {
  getApartmentBySlug,
  getApartmentGallery,
  filterDisplayablePhotos,
  publicSiteMediaUrl,
} from '@/lib/data/apartments';
import { getRestaurants } from '@/lib/data/restaurants';
import { getAttractions } from '@/lib/data/attractions';
import { NearbyPlaces } from '@/components/public/NearbyPlaces';
import { createServerClient } from '@/lib/supabase/server';
import type { Apartment } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadApartment(slug: string): Promise<Apartment | null> {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      const a = await getApartmentBySlug(client, slug);
      if (a) return a;
    } catch (err) {
      console.warn('Supabase fetch failed, using mock:', err);
    }
  }
  return MOCK_APARTMENTS.find((a) => a.slug === slug) ?? null;
}

export default async function ApartmentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const apartment = await loadApartment(slug);
  if (!apartment) notFound();

  const hero = MOCK_APARTMENT_HERO[slug] ?? '/placeholders/orte-1.svg';

  let galleryEntries: GalleryPhotoEntry[] = [
    {
      id: `${apartment.id}-hero-mock`,
      url: hero,
      alt: `Widok apartamentu ${apartment.name}`,
    },
  ];
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      const photos = await getApartmentGallery(client, apartment.id);
      const filtered = filterDisplayablePhotos(photos);
      if (filtered.length > 0) {
        galleryEntries = filtered.map((p) => ({
          id: p.id,
          url: publicSiteMediaUrl(p.storagePath),
          alt: p.alt || `Widok apartamentu ${apartment.name}`,
        }));
      }
    } catch (err) {
      console.warn('apartment gallery: fallback to placeholder:', err);
    }
  }

  const heroDisplay = galleryEntries[0]?.url ?? hero;

  // Najbliższe miejsca w okolicy Orte
  let nearbyRestaurants: Awaited<ReturnType<typeof getRestaurants>> = [];
  let nearbyAttractions: Awaited<ReturnType<typeof getAttractions>> = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const client = await createServerClient();
      [nearbyRestaurants, nearbyAttractions] = await Promise.all([
        getRestaurants(client),
        getAttractions(client),
      ]);
    } catch (err) {
      console.warn('apartment nearby:', err);
    }
  }

  return (
    <div className="bg-crema">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/apartments"
          className="link-italic inline-flex items-center gap-1 font-display italic text-terracotta hover:text-wine"
        >
          <ArrowLeft size={14} /> Wszystkie apartamenty
        </Link>

        <header className="mt-8 grid gap-10 lg:grid-cols-[1fr,1.1fr] lg:items-start">
          <div className="relative">
            {/* Numer rzymski wystający */}
            <div className="absolute -left-3 -top-5 z-10">
              <RomanBadge numeral={apartment.slug.includes('uno') ? 'I' : 'II'} size="lg" variant="gold" />
            </div>
            {/* Złoty frame z odsadzeniem */}
            <div aria-hidden="true" className="absolute -inset-3 -z-10 border border-gold/40" />
            <div className="relative aspect-[4/3] overflow-hidden bg-paper">
              <Image
                src={heroDisplay}
                alt={`Widok apartamentu ${apartment.name}`}
                fill
                priority
                unoptimized
                sizes="(min-width: 1024px) 540px, 100vw"
                className="object-cover"
              />
            </div>
            <p className="mt-5 flex items-center gap-3 font-display text-sm italic text-stone">
              <OrnamentSimple className="h-2 w-12 text-gold" />
              <span>{apartment.name} · Orte, Tuscia</span>
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="text-eyebrow text-gold">Apartament</span>
              <TricoloreRule size="md" />
            </div>
            <h1 className="heading-display mt-4 text-5xl text-ink md:text-6xl">
              {apartment.name}
            </h1>
            <p className="text-motto mt-3 text-lg">— una casa nel cuore di Orte —</p>

            <p className="text-ui mt-6 text-cypress/85">{apartment.description}</p>

            <ul className="mt-7 grid grid-cols-3 gap-4 border-y border-gold/30 py-5 font-display text-cypress">
              <li className="flex flex-col items-center gap-1">
                <Users size={18} className="text-olive" />
                <span className="text-2xl">{apartment.maxGuests}</span>
                <span className="text-xs uppercase tracking-wider text-stone">
                  {apartment.maxGuests === 1 ? 'gość' : 'gości'}
                </span>
              </li>
              <li className="flex flex-col items-center gap-1">
                <BedDouble size={18} className="text-olive" />
                <span className="text-2xl">{apartment.bedrooms}</span>
                <span className="text-xs uppercase tracking-wider text-stone">
                  {apartment.bedrooms === 1 ? 'sypialnia' : 'sypialnie'}
                </span>
              </li>
              <li className="flex flex-col items-center gap-1">
                <Bath size={18} className="text-olive" />
                <span className="text-2xl">{apartment.bathrooms}</span>
                <span className="text-xs uppercase tracking-wider text-stone">
                  {apartment.bathrooms === 1 ? 'łazienka' : 'łazienki'}
                </span>
              </li>
            </ul>

            <div className="mt-7">
              <p className="text-eyebrow text-gold">Udogodnienia</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {apartment.amenities.map((a) => (
                  <li
                    key={a}
                    className="border border-gold/30 px-3 py-1 text-[11px] uppercase tracking-wider text-stone"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7">
              <p className="text-eyebrow text-gold">Zasady pobytu</p>
              <p className="mt-3 whitespace-pre-line text-sm text-cypress/85">
                {apartment.houseRules}
              </p>
            </div>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href={`/booking?apartmentId=${apartment.id}`}
                className="group inline-flex items-center gap-3 border-2 border-olive bg-olive px-7 py-3 font-display text-base text-crema shadow-warm hover:bg-olive-deep"
              >
                <span className="text-gold-soft">·</span>
                <span>Wyślij zapytanie</span>
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#kalendarz"
                className="link-italic font-display italic text-terracotta hover:text-wine"
              >
                Zobacz kalendarz
              </a>
            </div>
          </div>
        </header>

        {galleryEntries.length > 1 && (
          <>
            <SectionDivider motto="immagini di una casa" />
            <section>
              <p className="text-eyebrow text-gold">Galeria</p>
              <h2 className="heading-section mt-2 text-3xl text-ink">
                Wnętrza i okolica
              </h2>
              <div className="mt-6">
                <ApartmentGallery photos={galleryEntries} />
              </div>
            </section>
          </>
        )}

        <SectionDivider motto="quando volete venire" />

        <section
          id="kalendarz"
          aria-labelledby="kalendarz-heading"
          className="scroll-mt-20"
        >
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow text-gold">Dostępność</p>
              <h2
                id="kalendarz-heading"
                className="heading-section mt-2 text-3xl text-ink md:text-4xl"
              >
                Kiedy chcesz przyjechać?
              </h2>
            </div>
            <StatusLegend />
          </div>
          <AvailabilityCalendar
            apartmentId={apartment.id}
            apartmentSlug={apartment.slug}
            apartmentMaxGuests={apartment.maxGuests}
          />
        </section>

        <SectionDivider motto="dove siamo" />

        <section className="border border-gold/30 bg-paper/50 p-8 md:p-12">
          <div className="flex items-center gap-3">
            <TowerIcon size={28} className="text-olive" />
            <div>
              <p className="text-eyebrow text-gold">Lokalizacja</p>
              <h2 className="font-display text-2xl text-ink md:text-3xl">
                W sercu <span className="italic text-olive">Orte</span>
              </h2>
            </div>
          </div>
          <p className="text-ui mt-5 max-w-2xl text-cypress/85">
            Apartament znajduje się w zabytkowym centrum Orte, w odległości
            spaceru od Orte Sotterranea, lokalnych restauracji i stacji
            kolejowej z bezpośrednim dojazdem do Rzymu.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-italian-green">
            <MapPin size={14} /> Orte · Provincia di Viterbo · Włochy
          </p>

          <div className="mt-6">
            <MapEmbed
              latitude={42.4583}
              longitude={12.3833}
              address="Orte, Provincia di Viterbo, Włochy"
              name={apartment.name}
            />
          </div>
        </section>

        {(nearbyRestaurants.length > 0 || nearbyAttractions.length > 0) && (
          <>
            <SectionDivider motto="cinque minuti a piedi" />
            <NearbyPlaces
              restaurants={nearbyRestaurants}
              attractions={nearbyAttractions}
            />
          </>
        )}
      </div>
    </div>
  );
}
