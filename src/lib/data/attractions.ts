/**
 * Attractions data layer.
 *
 * Public read paths filter by `published_at IS NOT NULL AND deleted_at IS NULL`
 * (Wym. 16, 32).
 *
 * Wymagania pokryte: 16, 17, 32, 41.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Attraction, Region } from '@/lib/types';

const COLUMNS =
  'id, slug, name, description, region, tags, practical_info, travel_info, address, place_id, latitude, longitude, maps_url, published_at, deleted_at, created_at, updated_at';

interface AttractionRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  region: Region;
  tags: string[] | null;
  practical_info: string | null;
  travel_info: string | null;
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

function mapAttraction(row: AttractionRow): Attraction {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    region: row.region,
    tags: row.tags ?? [],
    practicalInfo: row.practical_info,
    travelInfo: row.travel_info,
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

export interface AttractionQuery {
  region?: Region;
  includeUnpublished?: boolean;
  limit?: number;
}

export async function getAttractions(
  client: SupabaseClient,
  q: AttractionQuery = {},
): Promise<Attraction[]> {
  let query = client.from('attractions').select(COLUMNS);
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
  if (error) throw new Error(`getAttractions: ${error.message}`);
  return (data ?? []).map((row) => mapAttraction(row as AttractionRow));
}

export async function getAttractionBySlug(
  client: SupabaseClient,
  slug: string,
  opts: { includeUnpublished?: boolean } = {},
): Promise<Attraction | null> {
  let query = client.from('attractions').select(COLUMNS).eq('slug', slug);
  if (!opts.includeUnpublished) {
    query = query.not('published_at', 'is', null).is('deleted_at', null);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`getAttractionBySlug: ${error.message}`);
  return data ? mapAttraction(data as AttractionRow) : null;
}
