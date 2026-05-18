/**
 * `/restaurants/[slug]` — restaurant detail.
 *
 * Wymagania pokryte: 14, 15, 41.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Globe, Phone } from 'lucide-react';

import { MapEmbed } from '@/components/public/MapEmbed';
import { ReviewList } from '@/components/public/ReviewList';
import { ReviewForm } from '@/components/public/ReviewForm';
import { GuestPhotoUploader } from '@/components/public/GuestPhotoUploader';
import { StarRating } from '@/components/public/StarRating';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { getRestaurantBySlug } from '@/lib/data/restaurants';
import { getApprovedReviews, averageRating } from '@/lib/data/reviews';
import { getApprovedGuestPhotosWithUrls } from '@/lib/data/guest-photos';
import { getSiteSettings } from '@/lib/data/settings';
import { MOCK_RESTAURANTS } from '@/lib/mock-data';
import type { Restaurant, Review } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadRestaurant(slug: string): Promise<Restaurant | null> {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      const r = await getRestaurantBySlug(client, slug);
      if (r) return r;
    } catch (err) {
      console.warn('restaurant detail: fallback to mock:', err);
    }
  }
  return MOCK_RESTAURANTS.find((r) => r.slug === slug) ?? null;
}

const FALLBACK_REVIEW_CONSENT =
  'Oświadczam, że treść opinii jest moją własną i wyrażam zgodę na publikację po zatwierdzeniu przez administratora.';
const FALLBACK_PHOTO_CONSENT =
  'Oświadczam, że posiadam prawa do wgrywanego zdjęcia i wyrażam zgodę na jego publikację po zatwierdzeniu.';

export default async function RestaurantDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await loadRestaurant(slug);
  if (!restaurant) notFound();

  let reviews: Review[] = [];
  let photoUrls: { id: string; signedUrl: string }[] = [];
  let consentReview = FALLBACK_REVIEW_CONSENT;
  let consentPhoto = FALLBACK_PHOTO_CONSENT;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const client = await createServerClient();
      reviews = await getApprovedReviews(client, { restaurantId: restaurant.id });
      const adminClient = createServiceClient();
      const photos = await getApprovedGuestPhotosWithUrls(adminClient, {
        restaurantId: restaurant.id,
      });
      photoUrls = photos.map((p) => ({ id: p.id, signedUrl: p.signedUrl }));
      const settings = await getSiteSettings(client);
      if (settings) {
        consentReview = settings.consentTextReview || FALLBACK_REVIEW_CONSENT;
        consentPhoto = settings.consentTextPhoto || FALLBACK_PHOTO_CONSENT;
      }
    } catch (err) {
      console.warn('restaurant detail extras failed:', err);
    }
  }

  const avg = averageRating(reviews);
  const isRome = restaurant.region === 'rome';

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href={isRome ? '/rome/restaurants' : '/restaurants'}
          className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
        >
          <ArrowLeft size={14} />
          {isRome ? 'Restauracje w Rzymie' : 'Wszystkie restauracje'}
        </Link>

        <header className="mt-6">
          <p className="text-eyebrow">
            {isRome ? 'Restauracja w Rzymie' : 'Restauracja w okolicy Orte'}
          </p>
          <h1 className="heading-display mt-2 text-4xl text-ink md:text-5xl">
            {restaurant.name}
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
            {restaurant.description}
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-flag-white p-6">
              <h2 className="heading-section text-2xl text-ink">Praktyczne</h2>
              <dl className="mt-4 space-y-3 text-sm text-cypress">
                {restaurant.openingHours && (
                  <div className="flex gap-3">
                    <Clock size={16} className="mt-0.5 text-italian-green" />
                    <div>
                      <dt className="text-eyebrow">Godziny otwarcia</dt>
                      <dd className="mt-1 whitespace-pre-line">
                        {restaurant.openingHours}
                      </dd>
                    </div>
                  </div>
                )}
                {restaurant.phone && (
                  <div className="flex gap-3">
                    <Phone size={16} className="mt-0.5 text-italian-green" />
                    <div>
                      <dt className="text-eyebrow">Telefon</dt>
                      <dd className="mt-1">
                        <a
                          href={`tel:${restaurant.phone.replace(/\s+/g, '')}`}
                          className="hover:text-italian-green"
                        >
                          {restaurant.phone}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
                {restaurant.website && (
                  <div className="flex gap-3">
                    <Globe size={16} className="mt-0.5 text-italian-green" />
                    <div>
                      <dt className="text-eyebrow">Strona internetowa</dt>
                      <dd className="mt-1">
                        <a
                          href={restaurant.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-italian-green underline"
                        >
                          {restaurant.website.replace(/^https?:\/\//, '')}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
              </dl>

              {(restaurant.cuisineCategories.length > 0 || restaurant.tags.length > 0) && (
                <div className="mt-6">
                  <p className="text-eyebrow">Charakter miejsca</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {[...restaurant.cuisineCategories, ...restaurant.tags].map((tag) => (
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

              {restaurant.tipForGuest && (
                <div className="mt-6 rounded-xl bg-soft-green p-4 text-sm text-cypress">
                  <p className="text-eyebrow">Wskazówka od nas</p>
                  <p className="mt-1">{restaurant.tipForGuest}</p>
                </div>
              )}
            </section>

            <section>
              <h2 className="heading-section text-2xl text-ink">Lokalizacja</h2>
              <div className="mt-4">
                <MapEmbed
                  address={restaurant.address}
                  placeId={restaurant.placeId}
                  latitude={restaurant.latitude}
                  longitude={restaurant.longitude}
                  mapsUrl={restaurant.mapsUrl}
                  name={restaurant.name}
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
              <p className="mt-2 text-sm text-cypress/80">
                Po wysłaniu opinia czeka na moderację administratora.
              </p>
              <div className="mt-4">
                <ReviewForm
                  targetType="restaurant"
                  targetId={restaurant.id}
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
                  targetType="restaurant"
                  targetId={restaurant.id}
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
