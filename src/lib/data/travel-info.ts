/**
 * Travel info data layer for `/useful-info`.
 *
 * Wymagania pokryte: 22, 34.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { TravelInfo, TravelInfoKind } from '@/lib/types';

const COLUMNS =
  'id, kind, title, body, external_links, display_order, published_at, created_at, updated_at';

interface TravelInfoRow {
  id: string;
  kind: TravelInfoKind;
  title: string;
  body: string;
  external_links: { label: string; url: string }[] | null;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapTravelInfo(row: TravelInfoRow): TravelInfo {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    externalLinks: row.external_links ?? [],
    displayOrder: row.display_order,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getTravelInfo(
  client: SupabaseClient,
  opts: { includeUnpublished?: boolean } = {},
): Promise<TravelInfo[]> {
  let query = client.from('travel_info').select(COLUMNS);
  if (!opts.includeUnpublished) {
    query = query.not('published_at', 'is', null);
  }
  query = query.order('display_order', { ascending: true });
  const { data, error } = await query;
  if (error) throw new Error(`getTravelInfo: ${error.message}`);
  return (data ?? []).map((row) => mapTravelInfo(row as TravelInfoRow));
}

export const TRAVEL_INFO_KIND_PL: Record<TravelInfoKind, string> = {
  trains: 'Pociągi',
  rome_transfer: 'Dojazd do Rzymu',
  car_rental: 'Wynajem samochodu',
  travel_directions: 'Kierunki podróży',
};
