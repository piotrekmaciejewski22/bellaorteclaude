/**
 * `/admin/useful-info` — manage travel info entries.
 *
 * Wymagania pokryte: 34.
 */

import { createServerClient } from '@/lib/supabase/server';
import { getTravelInfo } from '@/lib/data/travel-info';
import { TravelInfoEditor } from '@/components/admin/TravelInfoEditor';

export default async function AdminUsefulInfoPage() {
  const client = await createServerClient();
  const items = await getTravelInfo(client, { includeUnpublished: true }).catch(() => []);

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">Informacje praktyczne</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">
          Edytor sekcji `/useful-info`
        </h1>
        <p className="text-ui mt-2 text-cypress/80">
          Pociągi, dojazd do Rzymu, wynajem auta, kierunki — zmiany pojawiają
          się publicznie po wyjściu z pola edycji.
        </p>
      </header>

      <TravelInfoEditor initial={items} />
    </div>
  );
}
