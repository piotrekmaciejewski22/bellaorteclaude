/**
 * Local services data layer — sklepy, apteki, bankomaty itp. dla gości.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type LocalServiceKind =
  | 'grocery'
  | 'pharmacy'
  | 'atm'
  | 'transit'
  | 'laundry'
  | 'medical'
  | 'other';

export const LOCAL_SERVICE_KIND_PL: Record<LocalServiceKind, string> = {
  grocery: 'Sklepy spożywcze',
  pharmacy: 'Apteki',
  atm: 'Bankomaty',
  transit: 'Transport',
  laundry: 'Pralnie',
  medical: 'Pomoc medyczna',
  other: 'Inne',
};

export const LOCAL_SERVICE_KIND_ICON: Record<LocalServiceKind, string> = {
  grocery: '🥖',
  pharmacy: '💊',
  atm: '💶',
  transit: '🚆',
  laundry: '🧺',
  medical: '🏥',
  other: '📍',
};

export interface LocalService {
  id: string;
  kind: LocalServiceKind;
  name: string;
  address: string;
  notes: string;
  hours: string | null;
  walkMinutes: number | null;
  latitude: number | null;
  longitude: number | null;
  displayOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Row {
  id: string;
  kind: LocalServiceKind;
  name: string;
  address: string;
  notes: string;
  hours: string | null;
  walk_minutes: number | null;
  latitude: number | null;
  longitude: number | null;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS =
  'id, kind, name, address, notes, hours, walk_minutes, latitude, longitude, display_order, published_at, created_at, updated_at';

function mapRow(r: Row): LocalService {
  return {
    id: r.id,
    kind: r.kind,
    name: r.name,
    address: r.address,
    notes: r.notes,
    hours: r.hours,
    walkMinutes: r.walk_minutes,
    latitude: r.latitude,
    longitude: r.longitude,
    displayOrder: r.display_order,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getLocalServices(
  client: SupabaseClient,
  opts: { includeUnpublished?: boolean } = {},
): Promise<LocalService[]> {
  let query = client.from('local_services').select(COLUMNS);
  if (!opts.includeUnpublished) {
    query = query.not('published_at', 'is', null);
  }
  query = query.order('kind', { ascending: true }).order('display_order', { ascending: true });
  const { data, error } = await query;
  if (error) throw new Error(`getLocalServices: ${error.message}`);
  return (data ?? []).map((row) => mapRow(row as Row));
}
