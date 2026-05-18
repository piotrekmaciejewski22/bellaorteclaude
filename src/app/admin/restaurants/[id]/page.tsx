/**
 * `/admin/restaurants/[id]` — edit existing restaurant.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { PlaceEditor } from '@/components/admin/PlaceEditor';
import { createServerClient } from '@/lib/supabase/server';
import { getRestaurantBySlug } from '@/lib/data/restaurants';
import type { Restaurant } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function EditRestaurantPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const client = await createServerClient();
  // Fetch by id (including unpublished/deleted for admin view).
  const { data, error } = await client
    .from('restaurants')
    .select(
      'id, slug, name, description, region, cuisine_categories, tags, opening_hours, phone, website, tip_for_guest, address, place_id, latitude, longitude, maps_url, published_at, deleted_at, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    // Fallback: try by slug (in case URL was the slug).
    const slugFallback = await getRestaurantBySlug(client, id, { includeUnpublished: true }).catch(() => null);
    if (!slugFallback) notFound();
  }

  type Row = {
    id: string;
    slug: string;
    name: string;
    description: string;
    region: 'orte_area' | 'rome';
    cuisine_categories: string[] | null;
    tags: string[] | null;
    opening_hours: string | null;
    phone: string | null;
    website: string | null;
    tip_for_guest: string | null;
    address: string | null;
    place_id: string | null;
    latitude: number | null;
    longitude: number | null;
    maps_url: string | null;
    published_at: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const row = data as Row;
  const restaurant: Restaurant = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    region: row.region,
    cuisineCategories: row.cuisine_categories ?? [],
    tags: row.tags ?? [],
    openingHours: row.opening_hours,
    phone: row.phone,
    website: row.website,
    tipForGuest: row.tip_for_guest,
    address: row.address,
    placeId: row.place_id,
    latitude: row.latitude,
    longitude: row.longitude,
    mapsUrl: row.maps_url,
    publishedAt: row.published_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return (
    <div>
      <Link
        href="/admin/restaurants"
        className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
      >
        <ArrowLeft size={14} /> Powrót do listy
      </Link>
      <header className="my-6">
        <p className="text-eyebrow">Restauracja</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">{restaurant.name}</h1>
      </header>
      <PlaceEditor mode={{ kind: 'restaurant', initial: restaurant }} />
    </div>
  );
}
