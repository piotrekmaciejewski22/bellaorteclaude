/**
 * `/admin/community-photos` — moderacja "Waszych zdjęć".
 */

import { createServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { PhotoModerationQueue } from '@/components/admin/PhotoModerationQueue';

const SIGNED_URL_TTL = 60 * 15;

export default async function AdminCommunityPhotosPage() {
  // Auth idzie przez server client (cookies-aware admin session — guard
  // jest w layoucie). Storage signed URL idzie przez service_role bo
  // bucket guest-media jest prywatny i nie ma policies dla auth users.
  await createServerClient();
  const admin = createServiceClient();

  const { data, error } = await admin
    .from('community_photos')
    .select('id, status, created_at, storage_path, contributor_name, location_label')
    .order('created_at', { ascending: false });

  type Row = {
    id: string;
    status: string;
    created_at: string;
    storage_path: string;
    contributor_name: string;
    location_label: string | null;
  };

  const rows = error
    ? []
    : await Promise.all(
        (data as Row[]).map(async (row) => {
          const signed = await admin.storage
            .from('guest-media')
            .createSignedUrl(row.storage_path, SIGNED_URL_TTL);
          return {
            id: row.id,
            signedUrl: signed.error ? null : signed.data?.signedUrl ?? null,
            status: row.status,
            createdAt: row.created_at,
            targetType: 'attraction' as const,
            targetName: row.location_label || row.contributor_name || 'Wasze zdjęcie',
          };
        }),
      );

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">Moderacja</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Wasze zdjęcia</h1>
        <p className="text-ui mt-2 text-cypress/80">
          Zatwierdź, odrzuć, ukryj lub trwale usuń zdjęcia z galerii społeczności.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {error.message}
        </p>
      ) : (
        <PhotoModerationQueue rows={rows} endpoint="/api/admin/community-photos" />
      )}
    </div>
  );
}
