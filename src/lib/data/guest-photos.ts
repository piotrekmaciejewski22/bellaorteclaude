/**
 * Guest photos data layer.
 *
 * Public surface returns only `status='approved'` photos with 15-minute
 * signed URLs into the private `guest-media` bucket (Wym. 39 #4).
 *
 * Wymagania pokryte: 24, 25, 36, 39 #4.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { GuestPhoto, ModerationStatus } from '@/lib/types';

const SIGNED_URL_TTL_SECONDS = 60 * 15;

const COLUMNS =
  'id, restaurant_id, attraction_id, review_id, storage_path, mime_type, size_bytes, status, consent_at, source_ip, created_at, updated_at';

interface GuestPhotoRow {
  id: string;
  restaurant_id: string | null;
  attraction_id: string | null;
  review_id: string | null;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  status: ModerationStatus;
  consent_at: string;
  source_ip: string | null;
  created_at: string;
  updated_at: string;
}

function mapGuestPhoto(row: GuestPhotoRow): GuestPhoto {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    attractionId: row.attraction_id,
    reviewId: row.review_id,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    status: row.status,
    consentAt: row.consent_at,
    sourceIp: row.source_ip,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface GuestPhotoWithUrl extends GuestPhoto {
  signedUrl: string;
}

/**
 * Fetch approved guest photos and produce 15-min signed URLs. Pending,
 * rejected and hidden photos are filtered out at the SQL layer (RLS) so
 * no signed URL is ever generated for non-approved rows.
 */
export async function getApprovedGuestPhotosWithUrls(
  client: SupabaseClient,
  target: { restaurantId?: string; attractionId?: string },
): Promise<GuestPhotoWithUrl[]> {
  let query = client
    .from('guest_photos')
    .select(COLUMNS)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (target.restaurantId) query = query.eq('restaurant_id', target.restaurantId);
  if (target.attractionId) query = query.eq('attraction_id', target.attractionId);

  const { data, error } = await query;
  if (error) throw new Error(`getApprovedGuestPhotos: ${error.message}`);

  const rows = (data ?? []).map((r) => mapGuestPhoto(r as GuestPhotoRow));

  const withUrls = await Promise.all(
    rows.map(async (row) => {
      const signed = await client.storage
        .from('guest-media')
        .createSignedUrl(row.storagePath, SIGNED_URL_TTL_SECONDS);
      if (signed.error || !signed.data) {
        return null;
      }
      return { ...row, signedUrl: signed.data.signedUrl };
    }),
  );

  return withUrls.filter((p): p is GuestPhotoWithUrl => p !== null);
}
