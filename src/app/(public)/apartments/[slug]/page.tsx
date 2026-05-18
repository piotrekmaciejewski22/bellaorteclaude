/**
 * `/apartments/[slug]` — apartment detail page.
 *
 * Server Component. Falls back to mock data if Supabase is not yet
 * configured (so the page can be previewed before deploy). The kalendarz
 * (AvailabilityCalendar) calls `/api/availability` which itself works
 * only against a live Supabase project.
 *
 * Wymagania pokryte: 5, 6.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BedDouble, Bath, Users, MapPin } from 'lucide-react';

import { AvailabilityCalendar } from '@/components/public/AvailabilityCalendar';
import { StatusLegend } from '@/components/public/StatusLegend';
import { ApartmentGallery, type GalleryPhotoEntry } from '@/components/public/ApartmentGallery';
import {
  MOCK_APARTMENTS,
  MOCK_APARTMENT_HERO,
} from '@/lib/mock-data';
import { getApartmentBySlug, getApartmentGallery, filterDisplayablePhotos, publicSiteMediaUrl } from '@/lib/data/apartments';
import { createServerClient } from '@/lib/supabase/server';
import type { Apartment } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadApartment(slug: string): Promise<Apartment | null> {
  // Try Supabase first; if env not configured, fall back to mock.
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

  if (!apartment) {
    notFound();
  }

  const hero = MOCK_APARTMENT_HERO[slug] ?? '/placeholders/orte-1.svg';

  // Try loading gallery; fall back to a single hero placeholder.
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

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/apartments"
          className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
        >
          <ArrowLeft size={14} /> Wszystkie apartamenty
        </Link>

        <header className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
            <Image
              src={heroDisplay}
              alt={`Widok apartamentu ${apartment.name}`}
              fill
              priority
              unoptimized
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <p className="text-eyebrow">Apartament BELLAORTE</p>
            <h1 className="heading-display mt-2 text-5xl text-ink">
              {apartment.name}
            </h1>
            <p className="text-ui mt-4 text-cypress/80">
              {apartment.description}
            </p>

            <ul className="mt-6 grid grid-cols-3 gap-4 rounded-xl border border-border bg-flag-white p-4 text-sm text-cypress">
              <li className="flex flex-col items-center gap-1">
                <Users size={18} className="text-italian-green" />
                <span className="font-display text-lg">{apartment.maxGuests}</span>
                <span className="text-xs text-muted">
                  {apartment.maxGuests === 1 ? 'gość' : 'gości'}
                </span>
              </li>
              <li className="flex flex-col items-center gap-1">
                <BedDouble size={18} className="text-italian-green" />
                <span className="font-display text-lg">{apartment.bedrooms}</span>
                <span className="text-xs text-muted">
                  {apartment.bedrooms === 1 ? 'sypialnia' : 'sypialnie'}
                </span>
              </li>
              <li className="flex flex-col items-center gap-1">
                <Bath size={18} className="text-italian-green" />
                <span className="font-display text-lg">{apartment.bathrooms}</span>
                <span className="text-xs text-muted">
                  {apartment.bathrooms === 1 ? 'łazienka' : 'łazienki'}
                </span>
              </li>
            </ul>

            <div className="mt-6">
              <p className="text-eyebrow">Udogodnienia</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {apartment.amenities.map((a) => (
                  <li
                    key={a}
                    className="rounded-full bg-soft-green px-3 py-1 text-xs font-medium text-cypress"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <p className="text-eyebrow">Zasady pobytu</p>
              <p className="mt-2 whitespace-pre-line text-sm text-cypress/80">
                {apartment.houseRules}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/booking?apartmentId=${apartment.id}`}
                className="rounded-full bg-italian-green px-7 py-3 text-base font-semibold text-flag-white shadow-sm transition-colors hover:bg-cypress"
              >
                Wyślij zapytanie
              </Link>
              <a
                href="#kalendarz"
                className="rounded-full border border-cypress/30 bg-flag-white px-7 py-3 text-base font-semibold text-cypress hover:border-italian-green hover:text-italian-green"
              >
                Zobacz kalendarz
              </a>
            </div>
          </div>
        </header>

        {galleryEntries.length > 1 && (
          <section className="mt-12">
            <p className="text-eyebrow">Galeria</p>
            <h2 className="heading-section mt-1 text-3xl text-ink">
              Zobacz wnętrza i okolicę
            </h2>
            <div className="mt-6">
              <ApartmentGallery photos={galleryEntries} />
            </div>
          </section>
        )}

        <section
          id="kalendarz"
          aria-labelledby="kalendarz-heading"
          className="mt-12 scroll-mt-20"
        >
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow">Dostępność</p>
              <h2
                id="kalendarz-heading"
                className="heading-section mt-1 text-3xl text-ink"
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

        <section className="mt-16 rounded-2xl border border-border bg-flag-white p-8">
          <p className="text-eyebrow">Lokalizacja</p>
          <h2 className="heading-section mt-1 text-2xl text-ink">
            W sercu Orte
          </h2>
          <p className="text-ui mt-3 max-w-2xl text-cypress/80">
            Apartament znajduje się w zabytkowym centrum Orte, w odległości
            spaceru od Orte Sotterranea, lokalnych restauracji i stacji
            kolejowej z bezpośrednim dojazdem do Rzymu.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-italian-green">
            <MapPin size={14} /> Orte, Prowincja Viterbo, Włochy
          </p>
        </section>
      </div>
    </div>
  );
}
