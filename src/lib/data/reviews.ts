/**
 * Reviews data layer.
 *
 * Public read returns only `status = 'approved'` (Wym. 25, 35, 38).
 *
 * Wymagania pokryte: 15, 17, 23, 25, 35.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ModerationStatus, Review } from '@/lib/types';

const COLUMNS =
  'id, restaurant_id, attraction_id, signature, rating, body, status, consent_at, source_ip, admin_note, created_at, updated_at';

interface ReviewRow {
  id: string;
  restaurant_id: string | null;
  attraction_id: string | null;
  signature: string;
  rating: number;
  body: string;
  status: ModerationStatus;
  consent_at: string;
  source_ip: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    attractionId: row.attraction_id,
    signature: row.signature,
    rating: row.rating,
    body: row.body,
    status: row.status,
    consentAt: row.consent_at,
    sourceIp: row.source_ip,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getApprovedReviews(
  client: SupabaseClient,
  target: { restaurantId?: string; attractionId?: string },
): Promise<Review[]> {
  let query = client
    .from('reviews')
    .select(COLUMNS)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (target.restaurantId) query = query.eq('restaurant_id', target.restaurantId);
  if (target.attractionId) query = query.eq('attraction_id', target.attractionId);

  const { data, error } = await query;
  if (error) throw new Error(`getApprovedReviews: ${error.message}`);
  return (data ?? []).map((row) => mapReview(row as ReviewRow));
}

export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
