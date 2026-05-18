/**
 * Aggregate helpers for review statistics shown on list cards.
 *
 * Wymagania pokryte: 14, 16.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ReviewStat {
  count: number;
  average: number | null;
}

export type ReviewStatMap = Map<string, ReviewStat>;

async function buildStatMap(
  client: SupabaseClient,
  column: 'restaurant_id' | 'attraction_id',
  ids: string[],
): Promise<ReviewStatMap> {
  const map: ReviewStatMap = new Map();
  if (ids.length === 0) return map;

  const { data, error } = await client
    .from('reviews')
    .select(`${column}, rating`)
    .eq('status', 'approved')
    .in(column, ids);
  if (error) throw new Error(`buildStatMap: ${error.message}`);

  type Row = Record<typeof column, string> & { rating: number };
  for (const row of (data ?? []) as Row[]) {
    const id = row[column];
    const stat = map.get(id) ?? { count: 0, average: 0 };
    stat.count += 1;
    stat.average = ((stat.average ?? 0) * (stat.count - 1) + row.rating) / stat.count;
    map.set(id, stat);
  }

  for (const [id, s] of map) {
    if (s.average !== null) {
      map.set(id, { count: s.count, average: Math.round(s.average * 10) / 10 });
    }
  }

  return map;
}

export async function getRestaurantReviewStats(
  client: SupabaseClient,
  restaurantIds: string[],
): Promise<ReviewStatMap> {
  return buildStatMap(client, 'restaurant_id', restaurantIds);
}

export async function getAttractionReviewStats(
  client: SupabaseClient,
  attractionIds: string[],
): Promise<ReviewStatMap> {
  return buildStatMap(client, 'attraction_id', attractionIds);
}
