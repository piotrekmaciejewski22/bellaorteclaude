/**
 * Site-settings data layer.
 *
 * Singleton row with id=1.
 *
 * Wymagania pokryte: 37, 43.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { SiteSettings } from '@/lib/types';

const COLUMNS =
  'id, contact_email, contact_phone, footer_address, privacy_policy_md, consent_text_booking, consent_text_review, consent_text_photo, hero_image_path, updated_at';

interface SiteSettingsRow {
  id: 1;
  contact_email: string;
  contact_phone: string | null;
  footer_address: string;
  privacy_policy_md: string;
  consent_text_booking: string;
  consent_text_review: string;
  consent_text_photo: string;
  hero_image_path: string | null;
  updated_at: string;
}

function mapSettings(row: SiteSettingsRow): SiteSettings {
  return {
    id: 1,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    footerAddress: row.footer_address,
    privacyPolicyMd: row.privacy_policy_md,
    consentTextBooking: row.consent_text_booking,
    consentTextReview: row.consent_text_review,
    consentTextPhoto: row.consent_text_photo,
    heroImagePath: row.hero_image_path,
    updatedAt: row.updated_at,
  };
}

export async function getSiteSettings(
  client: SupabaseClient,
): Promise<SiteSettings | null> {
  const { data, error } = await client
    .from('site_settings')
    .select(COLUMNS)
    .eq('id', 1)
    .maybeSingle();
  if (error) throw new Error(`getSiteSettings: ${error.message}`);
  return data ? mapSettings(data as SiteSettingsRow) : null;
}
