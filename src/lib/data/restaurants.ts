/**
 * Restaurants data layer.
 *
 * Public read paths filter by `published_at IS NOT NULL AND deleted_at IS NULL`
 * (Wym. 14, 31). Admin can call the same helpers with the service-role
 * client and skip the filter via the `includeUnpublished` flag.
 *
 * Wymagania pokryte: 14, 15, 31, 41.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Region, Restaurant } from '@/lib/types';

const COLUMNS =
  'id, slug, name, description, region, cuisine_categories, tags, opening_hours, phone, website, tip_for_guest, address, place_id, latitude, longitude, maps_url, published_at, deleted_at, created_at, updated_at';

interface RestaurantRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  region: Region;
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
}

function mapRestaurant(row: RestaurantRow): Restaurant {
  return {
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
}

export interface RestaurantQuery {
  region?: Region;
  includeUnpublished?: boolean;
  limit?: number;
}

export async function getRestaurants(
  client: SupabaseClient,
  q: RestaurantQuery = {},
): Promise<Restaurant[]> {
  let query = client.from('restaurants').select(COLUMNS);
  if (!q.includeUnpublished) {
    query = query.not('published_at', 'is', null).is('deleted_at', null);
  }
  if (q.region) {
    query = query.eq('region', q.region);
  }
  if (q.limit) {
    query = query.limit(q.limit);
  }
  query = query.order('name', { ascending: true });

  const { data, error } = await query;
  if (error) throw new Error(`getRestaurants: ${error.message}`);
  return (data ?? []).map((row) => mapRestaurant(row as RestaurantRow));
}

export async function getRestaurantBySlug(
  client: SupabaseClient,
  slug: string,
  opts: { includeUnpublished?: boolean } = {},
): Promise<Restaurant | null> {
  let query = client.from('restaurants').select(COLUMNS).eq('slug', slug);
  if (!opts.includeUnpublished) {
    query = query.not('published_at', 'is', null).is('deleted_at', null);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`getRestaurantBySlug: ${error.message}`);
  return data ? mapRestaurant(data as RestaurantRow) : null;
}
