/**
 * `/admin/apartments` — list of the (exactly 2) apartments.
 *
 * Server Component. No Add/Delete buttons — Wym. 28 #6 locks the count.
 *
 * Wymagania pokryte: 28.
 */

import Link from 'next/link';

import { createServerClient } from '@/lib/supabase/server';
import type { Apartment } from '@/lib/types';

interface AdminApartmentRow extends Apartment {
  photoCount: number;
}

export default async function AdminApartmentsPage() {
  const client = await createServerClient();

  const { data, error } = await client
    .from('apartments')
    .select(
      'id, slug, name, description, max_guests, bedrooms, bathrooms, amenities, house_rules, published_at, created_at, updated_at',
    )
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <div>
        <h1 className="heading-display text-3xl text-ink">Apartamenty</h1>
        <p className="mt-4 rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          Błąd pobierania: {error.message}
        </p>
      </div>
    );
  }

  type ApartmentRow = {
    id: string;
    slug: string;
    name: string;
    description: string;
    max_guests: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[] | null;
    house_rules: string | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const apartments: AdminApartmentRow[] = await Promise.all(
    (data as ApartmentRow[] | null ?? []).map(async (row) => {
      const photos = await client
        .from('gallery_photos')
        .select('id', { count: 'exact', head: true })
        .eq('apartment_id', row.id);
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        maxGuests: row.max_guests,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        amenities: row.amenities ?? [],
        houseRules: row.house_rules ?? '',
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        photoCount: photos.count ?? 0,
      };
    }),
  );

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">Apartamenty</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">
          Edycja apartamentów
        </h1>
        <p className="text-ui mt-2 text-cypress/80">
          MVP obsługuje dokładnie 2 apartamenty. Możesz edytować ich treść i
          galerię, ale nie dodawać ani usuwać.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {apartments.map((a) => (
          <article
            key={a.id}
            className="rounded-2xl border border-border bg-flag-white p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-eyebrow">{a.slug}</p>
                <h2 className="heading-section mt-1 text-2xl text-ink">{a.name}</h2>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  a.publishedAt
                    ? 'bg-soft-green text-italian-green'
                    : 'bg-muted/15 text-muted'
                }`}
              >
                {a.publishedAt ? 'Opublikowany' : 'Szkic'}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-4 text-sm text-cypress">
              <div>
                <dt className="text-eyebrow">Goście</dt>
                <dd className="font-display text-2xl text-ink">{a.maxGuests}</dd>
              </div>
              <div>
                <dt className="text-eyebrow">Sypialnie</dt>
                <dd className="font-display text-2xl text-ink">{a.bedrooms}</dd>
              </div>
              <div>
                <dt className="text-eyebrow">Łazienki</dt>
                <dd className="font-display text-2xl text-ink">{a.bathrooms}</dd>
              </div>
            </dl>

            <p className="mt-4 text-sm text-cypress/80">
              {a.photoCount} {a.photoCount === 1 ? 'zdjęcie' : 'zdjęć'} w galerii ·{' '}
              {a.amenities.length} udogodnień
            </p>

            <Link
              href={`/admin/apartments/${a.id}`}
              className="mt-6 inline-flex rounded-full bg-italian-green px-5 py-2 text-sm font-semibold text-flag-white hover:bg-cypress"
            >
              Edytuj apartament
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
