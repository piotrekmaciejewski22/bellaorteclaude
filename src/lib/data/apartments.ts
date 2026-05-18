/**
 * Apartments data layer.
 *
 * Read helpers for `apartments` and the related `gallery_photos`. Public
 * queries are filtered by `published_at IS NOT NULL` (Wym. 4) and rely on
 * RLS on the anon key for defense-in-depth — RLS would also enforce the
 * filter, but expressing it in the query keeps the SQL plan obvious.
 *
 * Wymagania pokryte: 4, 5, 28.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Apartment, GalleryPhoto, SourceKind } from '@/lib/types';

const APARTMENT_COLUMNS =
  'id, slug, name, description, max_guests, bedrooms, bathrooms, amenities, house_rules, published_at, created_at, updated_at';

const GALLERY_COLUMNS =
  'id, apartment_id, restaurant_id, attraction_id, storage_path, alt, source_kind, display_order, created_at';

interface ApartmentRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[] | null;
  house_rules: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface GalleryPhotoRow {
  id: string;
  apartment_id: string | null;
  restaurant_id: string | null;
  attraction_id: string | null;
  storage_path: string;
  alt: string | null;
  source_kind: SourceKind;
  display_order: number;
  created_at: string;
}

function mapApartment(row: ApartmentRow): Apartment {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    maxGuests: row.max_guests,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    amenities: row.amenities ?? [],
    houseRules: row.house_rules ?? '',
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGalleryPhoto(row: GalleryPhotoRow): GalleryPhoto {
  return {
    id: row.id,
    apartmentId: row.apartment_id,
    restaurantId: row.restaurant_id,
    attractionId: row.attraction_id,
    storagePath: row.storage_path,
    alt: row.alt ?? '',
    sourceKind: row.source_kind,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

/**
 * Fetch every published apartment, ordered by creation date. Public path.
 */
export async function getApartments(
  client: SupabaseClient,
): Promise<Apartment[]> {
  const { data, error } = await client
    .from('apartments')
    .select(APARTMENT_COLUMNS)
    .not('published_at', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`getApartments: ${error.message}`);
  }

  return (data ?? []).map((row) => mapApartment(row as ApartmentRow));
}

/**
 * Fetch one published apartment by slug. Returns `null` if not found.
 */
export async function getApartmentBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<Apartment | null> {
  const { data, error } = await client
    .from('apartments')
    .select(APARTMENT_COLUMNS)
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .maybeSingle();

  if (error) {
    throw new Error(`getApartmentBySlug: ${error.message}`);
  }

  return data ? mapApartment(data as ApartmentRow) : null;
}

/**
 * Fetch the gallery photos for one apartment, ordered by `display_order`.
 */
export async function getApartmentGallery(
  client: SupabaseClient,
  apartmentId: string,
): Promise<GalleryPhoto[]> {
  const { data, error } = await client
    .from('gallery_photos')
    .select(GALLERY_COLUMNS)
    .eq('apartment_id', apartmentId)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(`getApartmentGallery: ${error.message}`);
  }

  return (data ?? []).map((row) => mapGalleryPhoto(row as GalleryPhotoRow));
}

/**
 * Build the public CDN URL for a `site-media` storage path. The bucket is
 * `public = true`, so we can deterministically construct the URL without
 * an extra round-trip through `storage.from('site-media').getPublicUrl()`.
 */
export function publicSiteMediaUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return `/placeholders/orte-1.svg`;
  }
  return `${supabaseUrl}/storage/v1/object/public/site-media/${storagePath}`;
}


/**
 * Filter rule from Wymaganie 40: show interior photos only when at least
 * one `interior_real` exists; otherwise stick to placeholders + exteriors.
 */
export function filterDisplayablePhotos(
  photos: GalleryPhoto[],
): GalleryPhoto[] {
  const hasInteriorReal = photos.some((p) => p.sourceKind === 'interior_real');
  if (hasInteriorReal) {
    return photos
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }
  return photos
    .filter((p) => p.sourceKind !== 'interior_real')
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
