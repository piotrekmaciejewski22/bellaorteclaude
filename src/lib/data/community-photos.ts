/**
 * Community photos — galeria "Wasze zdjęcia".
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ModerationStatus } from '@/lib/types';

const SIGNED_URL_TTL_SECONDS = 60 * 30;

export interface CommunityPhoto {
  id: string;
  storagePath: string;
  caption: string;
  contributorName: string;
  locationLabel: string | null;
  status: ModerationStatus;
  createdAt: string;
}

export interface CommunityPhotoWithUrl extends CommunityPhoto {
  signedUrl: string;
}

interface Row {
  id: string;
  storage_path: string;
  caption: string;
  contributor_name: string;
  location_label: string | null;
  status: ModerationStatus;
  created_at: string;
}

function mapRow(r: Row): CommunityPhoto {
  return {
    id: r.id,
    storagePath: r.storage_path,
    caption: r.caption,
    contributorName: r.contributor_name,
    locationLabel: r.location_label,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function getApprovedCommunityPhotosWithUrls(
  client: SupabaseClient,
): Promise<CommunityPhotoWithUrl[]> {
  const { data, error } = await client
    .from('community_photos')
    .select('id, storage_path, caption, contributor_name, location_label, status, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`getApprovedCommunityPhotos: ${error.message}`);

  const rows = (data ?? []).map((r) => mapRow(r as Row));

  const withUrls = await Promise.all(
    rows.map(async (row) => {
      const signed = await client.storage
        .from('guest-media')
        .createSignedUrl(row.storagePath, SIGNED_URL_TTL_SECONDS);
      if (signed.error || !signed.data) return null;
      return { ...row, signedUrl: signed.data.signedUrl };
    }),
  );

  return withUrls.filter((p): p is CommunityPhotoWithUrl => p !== null);
}
