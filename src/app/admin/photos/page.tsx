/**
 * `/admin/photos` — guest photo moderation.
 *
 * Server Component generates 15-min signed URLs for previews.
 *
 * Wymagania pokryte: 36.
 */

import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { PhotoModerationQueue } from '@/components/admin/PhotoModerationQueue';

const SIGNED_URL_TTL_SECONDS = 60 * 15;

export default async function AdminPhotosPage() {
  await createServerClient();
  const admin = createServiceClient();

  const { data, error } = await admin
    .from('guest_photos')
    .select(
      'id, status, created_at, storage_path, restaurant_id, attraction_id, restaurants:restaurant_id (name), attractions:attraction_id (name)',
    )
    .order('created_at', { ascending: false });

  type Joined = {
    id: string;
    status: string;
    created_at: string;
    storage_path: string;
    restaurant_id: string | null;
    attraction_id: string | null;
    restaurants: { name: string } | { name: string }[] | null;
    attractions: { name: string } | { name: string }[] | null;
  };

  function nameOf(rel: Joined['restaurants'] | Joined['attractions']): string {
    if (!rel) return '';
    if (Array.isArray(rel)) return rel[0]?.name ?? '';
    return rel.name;
  }

  const rows = error
    ? []
    : await Promise.all(
        (data as Joined[]).map(async (row) => {
          const signed = await admin.storage
            .from('guest-media')
            .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
          return {
            id: row.id,
            signedUrl: signed.error ? null : signed.data?.signedUrl ?? null,
            status: row.status,
            createdAt: row.created_at,
            targetType: (row.restaurant_id ? 'restaurant' : 'attraction') as
              | 'restaurant'
              | 'attraction',
            targetName: row.restaurant_id ? nameOf(row.restaurants) : nameOf(row.attractions),
          };
        }),
      );

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">Moderacja</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Zdjęcia gości</h1>
        <p className="text-ui mt-2 text-cypress/80">
          Zatwierdź, odrzuć, ukryj lub trwale usuń zdjęcia od gości. Tylko
          zatwierdzone zdjęcia są widoczne publicznie.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          Nie udało się pobrać zdjęć: {error.message}
        </p>
      ) : (
        <PhotoModerationQueue rows={rows} />
      )}
    </div>
  );
}
