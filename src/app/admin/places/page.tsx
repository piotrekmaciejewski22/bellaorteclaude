/**
 * `/admin/places` — list of attractions.
 *
 * Wymagania pokryte: 32.
 */

import Link from 'next/link';
import { Plus } from 'lucide-react';

import { createServerClient } from '@/lib/supabase/server';
import { getAttractions } from '@/lib/data/attractions';

export default async function AdminPlacesPage() {
  const client = await createServerClient();
  const attractions = await getAttractions(client, { includeUnpublished: true });

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-eyebrow">Atrakcje</p>
          <h1 className="heading-display mt-2 text-3xl text-ink">Lista atrakcji</h1>
        </div>
        <Link
          href="/admin/places/new"
          className="inline-flex items-center gap-2 rounded-full bg-italian-green px-5 py-2.5 text-sm font-semibold text-flag-white hover:bg-cypress"
        >
          <Plus size={14} />
          Dodaj atrakcję
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-flag-white">
        {attractions.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">Brak atrakcji.</p>
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
              {attractions.map((a) => (
                <tr key={a.id} className="border-t border-border text-cypress">
                  <td className="px-4 py-3">
                    <p className="font-display text-base text-ink">{a.name}</p>
                    <p className="text-xs text-muted">{a.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {a.region === 'rome' ? 'Rzym' : 'Okolica Orte'}
                  </td>
                  <td className="px-4 py-3">
                    {a.deletedAt ? (
                      <span className="rounded-full bg-italian-red/10 px-2 py-0.5 text-xs font-medium text-italian-red">
                        Usunięta
                      </span>
                    ) : a.publishedAt ? (
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
                      href={`/admin/places/${a.id}`}
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
