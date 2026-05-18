/**
 * Rome data layer.
 *
 * Read helpers for `rome_itinerary` and `rome_info_sections`.
 *
 * Wymagania pokryte: 20, 21, 33.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  DayPart,
  RomeInfoKind,
  RomeInfoSection,
  RomeItineraryItem,
} from '@/lib/types';

const ITINERARY_COLUMNS =
  'id, day_part, title, body, linked_restaurant_id, linked_attraction_id, display_order, published_at, created_at, updated_at';
const INFO_COLUMNS =
  'id, kind, title, body, display_order, published_at, created_at, updated_at';

interface ItineraryRow {
  id: string;
  day_part: DayPart;
  title: string;
  body: string;
  linked_restaurant_id: string | null;
  linked_attraction_id: string | null;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface InfoRow {
  id: string;
  kind: RomeInfoKind;
  title: string;
  body: string;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapItinerary(row: ItineraryRow): RomeItineraryItem {
  return {
    id: row.id,
    dayPart: row.day_part,
    title: row.title,
    body: row.body,
    linkedRestaurantId: row.linked_restaurant_id,
    linkedAttractionId: row.linked_attraction_id,
    displayOrder: row.display_order,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInfo(row: InfoRow): RomeInfoSection {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    displayOrder: row.display_order,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getRomeItinerary(
  client: SupabaseClient,
  opts: { includeUnpublished?: boolean } = {},
): Promise<RomeItineraryItem[]> {
  let query = client.from('rome_itinerary').select(ITINERARY_COLUMNS);
  if (!opts.includeUnpublished) {
    query = query.not('published_at', 'is', null);
  }
  query = query.order('display_order', { ascending: true });
  const { data, error } = await query;
  if (error) throw new Error(`getRomeItinerary: ${error.message}`);
  return (data ?? []).map((row) => mapItinerary(row as ItineraryRow));
}

export async function getRomeInfoSections(
  client: SupabaseClient,
  opts: { includeUnpublished?: boolean } = {},
): Promise<RomeInfoSection[]> {
  let query = client.from('rome_info_sections').select(INFO_COLUMNS);
  if (!opts.includeUnpublished) {
    query = query.not('published_at', 'is', null);
  }
  query = query.order('display_order', { ascending: true });
  const { data, error } = await query;
  if (error) throw new Error(`getRomeInfoSections: ${error.message}`);
  return (data ?? []).map((row) => mapInfo(row as InfoRow));
}
