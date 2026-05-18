/**
 * `/admin/apartments/[id]` — admin editor for one apartment.
 *
 * Server Component. Loads the apartment + gallery, then renders the
 * client `ApartmentEditor`.
 *
 * Wymagania pokryte: 28.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { createServerClient } from '@/lib/supabase/server';
import { ApartmentEditor } from '@/components/admin/ApartmentEditor';
import { publicSiteMediaUrl } from '@/lib/data/apartments';
import type { Apartment } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminApartmentEditPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const client = await createServerClient();

  const aptRes = await client
    .from('apartments')
    .select(
      'id, slug, name, description, max_guests, bedrooms, bathrooms, amenities, house_rules, published_at, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (aptRes.error || !aptRes.data) {
    notFound();
  }

  const row = aptRes.data as {
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
  };

  const apartment: Apartment = {
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

  const photosRes = await client
    .from('gallery_photos')
    .select('id, storage_path, alt, source_kind, display_order')
    .eq('apartment_id', id)
    .order('display_order', { ascending: true });

  type PhotoRow = {
    id: string;
    storage_path: string;
    alt: string | null;
    source_kind: string;
    display_order: number;
  };

  const photos = (photosRes.data as PhotoRow[] | null ?? []).map((p) => ({
    id: p.id,
    storagePath: p.storage_path,
    publicUrl: publicSiteMediaUrl(p.storage_path),
    alt: p.alt ?? '',
    sourceKind: p.source_kind,
  }));

  return (
    <div>
      <Link
        href="/admin/apartments"
        className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
      >
        <ArrowLeft size={14} /> Powrót do listy
      </Link>

      <header className="my-6">
        <p className="text-eyebrow">Apartament</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">{apartment.name}</h1>
      </header>

      <ApartmentEditor apartment={apartment} photos={photos} />
    </div>
  );
}
