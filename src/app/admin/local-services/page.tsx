/**
 * `/admin/local-services` — zarządzanie usługami dla gości.
 */

import { createServerClient } from '@/lib/supabase/server';
import { getLocalServices } from '@/lib/data/local-services';
import { LocalServicesAdmin } from '@/components/admin/LocalServicesAdmin';

export default async function AdminLocalServicesPage() {
  const client = await createServerClient();
  const items = await getLocalServices(client, { includeUnpublished: true }).catch(() => []);

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">Dla gości</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">
          Lokalne usługi (sklepy, apteki, transport)
        </h1>
        <p className="text-ui mt-3 max-w-2xl text-sm text-cypress/85">
          Punkty pomocne dla gości w trakcie pobytu — wyświetlane na stronie /dla-gosci.
        </p>
      </header>
      <LocalServicesAdmin initialItems={items} />
    </div>
  );
}
