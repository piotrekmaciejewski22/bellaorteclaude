/**
 * Events data layer — lokalne wydarzenia + polecenia sezonowe.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type EventKind = 'local' | 'seasonal';

export interface EventEntry {
  id: string;
  kind: EventKind;
  title: string;
  excerpt: string;
  bodyMd: string;
  startDate: string | null;
  endDate: string | null;
  displayPeriod: string | null;
  heroImagePath: string | null;
  externalUrl: string | null;
  displayOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EventRow {
  id: string;
  kind: EventKind;
  title: string;
  excerpt: string;
  body_md: string;
  start_date: string | null;
  end_date: string | null;
  display_period: string | null;
  hero_image_path: string | null;
  external_url: string | null;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS =
  'id, kind, title, excerpt, body_md, start_date, end_date, display_period, hero_image_path, external_url, display_order, published_at, created_at, updated_at';

function mapEvent(r: EventRow): EventEntry {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    excerpt: r.excerpt,
    bodyMd: r.body_md,
    startDate: r.start_date,
    endDate: r.end_date,
    displayPeriod: r.display_period,
    heroImagePath: r.hero_image_path,
    externalUrl: r.external_url,
    displayOrder: r.display_order,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getEvents(
  client: SupabaseClient,
  opts: {
    kind?: EventKind;
    includeUnpublished?: boolean;
    upcoming?: boolean;
    limit?: number;
  } = {},
): Promise<EventEntry[]> {
  let query = client.from('events').select(COLUMNS);

  if (!opts.includeUnpublished) {
    query = query.not('published_at', 'is', null);
  }
  if (opts.kind) {
    query = query.eq('kind', opts.kind);
  }
  if (opts.upcoming) {
    const today = new Date().toISOString().slice(0, 10);
    query = query.or(`end_date.gte.${today},and(start_date.is.null,end_date.is.null)`);
  }

  query = query.order('display_order', { ascending: true });
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw new Error(`getEvents: ${error.message}`);
  return (data ?? []).map((r) => mapEvent(r as EventRow));
}

/**
 * Heurystyka — który "sezon" jest aktualny dla strony głównej.
 * Zwraca pojedynczy seasonal event który zawiera dzisiejszą datę
 * w swoim zakresie [start_date, end_date]. Jeśli brak — pierwszy.
 */
export async function getCurrentSeasonalEvent(
  client: SupabaseClient,
): Promise<EventEntry | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await client
    .from('events')
    .select(COLUMNS)
    .eq('kind', 'seasonal')
    .not('published_at', 'is', null)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    // Fallback — pierwszy seasonal w ogóle
    const fallback = await client
      .from('events')
      .select(COLUMNS)
      .eq('kind', 'seasonal')
      .not('published_at', 'is', null)
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (fallback.error || !fallback.data) return null;
    return mapEvent(fallback.data as EventRow);
  }

  return mapEvent(data as EventRow);
}
