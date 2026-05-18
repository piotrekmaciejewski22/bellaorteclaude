/**
 * `/admin/restaurants` — list with filters by region/published.
 *
 * Wymagania pokryte: 31.
 */

import Link from 'next/link';
import { Plus } from 'lucide-react';

import { createServerClient } from '@/lib/supabase/server';
import { getRestaurants } from '@/lib/data/restaurants';

export default async function AdminRestaurantsPage() {
  const client = await createServerClient();
  const restaurants = await getRestaurants(client, { includeUnpublished: true });

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-eyebrow">Restauracje</p>
          <h1 className="heading-display mt-2 text-3xl text-ink">Lista restauracji</h1>
        </div>
        <Link
          href="/admin/restaurants/new"
          className="inline-flex items-center gap-2 rounded-full bg-italian-green px-5 py-2.5 text-sm font-semibold text-flag-white hover:bg-cypress"
        >
          <Plus size={14} />
          Dodaj restaurację
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-flag-white">
        {restaurants.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">Brak restauracji.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-soft-green text-cypress">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nazwa</th>
                <th className="px-4 py-3 text-left font-medium">Region</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id} className="border-t border-border text-cypress">
                  <td className="px-4 py-3">
                    <p className="font-display text-base text-ink">{r.name}</p>
                    <p className="text-xs text-muted">{r.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {r.region === 'rome' ? 'Rzym' : 'Okolica Orte'}
                  </td>
                  <td className="px-4 py-3">
                    {r.deletedAt ? (
                      <span className="rounded-full bg-italian-red/10 px-2 py-0.5 text-xs font-medium text-italian-red">
                        Usunięta
                      </span>
                    ) : r.publishedAt ? (
                      <span className="rounded-full bg-soft-green px-2 py-0.5 text-xs font-medium text-italian-green">
                        Opublikowana
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted/15 px-2 py-0.5 text-xs font-medium text-muted">
                        Szkic
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/restaurants/${r.id}`}
                      className="text-sm font-semibold text-italian-green hover:text-cypress"
                    >
                      Edytuj
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
