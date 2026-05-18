/**
 * `/places/[slug]` — attraction detail.
 *
 * Wymagania pokryte: 16, 17, 41.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { MapEmbed } from '@/components/public/MapEmbed';
import { ReviewList } from '@/components/public/ReviewList';
import { ReviewForm } from '@/components/public/ReviewForm';
import { GuestPhotoUploader } from '@/components/public/GuestPhotoUploader';
import { StarRating } from '@/components/public/StarRating';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { getAttractionBySlug } from '@/lib/data/attractions';
import { getApprovedReviews, averageRating } from '@/lib/data/reviews';
import { getApprovedGuestPhotosWithUrls } from '@/lib/data/guest-photos';
import { getSiteSettings } from '@/lib/data/settings';
import { MOCK_ATTRACTIONS } from '@/lib/mock-data';
import type { Attraction, Review } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadAttraction(slug: string): Promise<Attraction | null> {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      const a = await getAttractionBySlug(client, slug);
      if (a) return a;
    } catch (err) {
      console.warn('attraction detail: fallback to mock:', err);
    }
  }
  return MOCK_ATTRACTIONS.find((a) => a.slug === slug) ?? null;
}

const FALLBACK_REVIEW_CONSENT =
  'Oświadczam, że treść opinii jest moją własną i wyrażam zgodę na publikację po zatwierdzeniu przez administratora.';
const FALLBACK_PHOTO_CONSENT =
  'Oświadczam, że posiadam prawa do wgrywanego zdjęcia i wyrażam zgodę na jego publikację po zatwierdzeniu.';

export default async function AttractionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const attraction = await loadAttraction(slug);
  if (!attraction) notFound();

  let reviews: Review[] = [];
  let photoUrls: { id: string; signedUrl: string }[] = [];
  let consentReview = FALLBACK_REVIEW_CONSENT;
  let consentPhoto = FALLBACK_PHOTO_CONSENT;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const client = await createServerClient();
      reviews = await getApprovedReviews(client, { attractionId: attraction.id });
      const adminClient = createServiceClient();
      const photos = await getApprovedGuestPhotosWithUrls(adminClient, {
        attractionId: attraction.id,
      });
      photoUrls = photos.map((p) => ({ id: p.id, signedUrl: p.signedUrl }));
      const settings = await getSiteSettings(client);
      if (settings) {
        consentReview = settings.consentTextReview || FALLBACK_REVIEW_CONSENT;
        consentPhoto = settings.consentTextPhoto || FALLBACK_PHOTO_CONSENT;
      }
    } catch (err) {
      console.warn('attraction detail extras failed:', err);
    }
  }

  const avg = averageRating(reviews);
  const isRome = attraction.region === 'rome';

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href={isRome ? '/rome/places' : '/places'}
          className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
        >
          <ArrowLeft size={14} />
          {isRome ? 'Atrakcje w Rzymie' : 'Wszystkie atrakcje'}
        </Link>

        <header className="mt-6">
          <p className="text-eyebrow">
            {isRome ? 'Atrakcja w Rzymie' : 'Atrakcja w regionie Orte'}
          </p>
          <h1 className="heading-display mt-2 text-4xl text-ink md:text-5xl">
            {attraction.name}
          </h1>
          {avg !== null && reviews.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating value={avg} size={18} showNumber />
              <span className="text-xs text-muted">
                ({reviews.length} {reviews.length === 1 ? 'opinia' : 'opinii'})
              </span>
            </div>
          )}
          <p className="text-ui mt-4 max-w-2xl text-cypress/80">
            {attraction.description}
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-flag-white p-6">
              <h2 className="heading-section text-2xl text-ink">Praktyczne</h2>
              {attraction.practicalInfo && (
                <div className="mt-4 text-sm text-cypress whitespace-pre-line">
                  {attraction.practicalInfo}
                </div>
              )}
              {attraction.travelInfo && (
                <div className="mt-6">
                  <p className="text-eyebrow">Jak dojechać</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-cypress">
                    {attraction.travelInfo}
                  </p>
                </div>
              )}
              {attraction.tags.length > 0 && (
                <div className="mt-6">
                  <p className="text-eyebrow">Tagi</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {attraction.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full bg-soft-green px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-italian-green"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section>
              <h2 className="heading-section text-2xl text-ink">Lokalizacja</h2>
              <div className="mt-4">
                <MapEmbed
                  address={attraction.address}
                  placeId={attraction.placeId}
                  latitude={attraction.latitude}
                  longitude={attraction.longitude}
                  mapsUrl={attraction.mapsUrl}
                  name={attraction.name}
                />
              </div>
            </section>

            {photoUrls.length > 0 && (
              <section>
                <h2 className="heading-section text-2xl text-ink">
                  Zdjęcia od gości
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {photoUrls.map((photo) => (
                    <li
                      key={photo.id}
                      className="overflow-hidden rounded-xl border border-border bg-flag-white"
                    >
                      <img
                        src={photo.signedUrl}
                        alt="Zdjęcie od gościa"
                        className="aspect-square w-full object-cover"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="heading-section text-2xl text-ink">Opinie</h2>
              <div className="mt-4">
                <ReviewList reviews={reviews} />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-flag-white p-6">
              <p className="text-eyebrow">Twoja opinia</p>
              <h3 className="heading-section mt-1 text-xl text-ink">
                Podziel się wrażeniami
              </h3>
              <div className="mt-4">
                <ReviewForm
                  targetType="attraction"
                  targetId={attraction.id}
                  consentTextReview={consentReview}
                  consentTextPhoto={consentPhoto}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-flag-white p-6">
              <p className="text-eyebrow">Tylko zdjęcie</p>
              <h3 className="heading-section mt-1 text-xl text-ink">
                Wgraj samo zdjęcie
              </h3>
              <div className="mt-4">
                <GuestPhotoUploader
                  targetType="attraction"
                  targetId={attraction.id}
                  consentText={consentPhoto}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
