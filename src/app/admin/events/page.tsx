/**
 * `/admin/events` — lista wszystkich wydarzeń (lokalnych i sezonowych).
 */

import Link from 'next/link';
import { Plus } from 'lucide-react';

import { createServerClient } from '@/lib/supabase/server';
import { getEvents } from '@/lib/data/events';

export default async function AdminEventsPage() {
  const client = await createServerClient();
  const events = await getEvents(client, { includeUnpublished: true }).catch(() => []);

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-eyebrow">Wydarzenia</p>
          <h1 className="heading-display mt-2 text-3xl text-ink">
            Lokalne wydarzenia i polecenia sezonowe
          </h1>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-full bg-italian-green px-5 py-2.5 text-sm font-semibold text-flag-white hover:bg-cypress"
        >
          <Plus size={14} />
          Nowy wpis
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-flag-white">
        {events.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">Brak wpisów.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-soft-green text-cypress">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Tytuł</th>
                <th className="px-4 py-3 text-left font-medium">Typ</th>
                <th className="px-4 py-3 text-left font-medium">Okres</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-border text-cypress">
                  <td className="px-4 py-3">
                    <p className="font-display text-base text-ink">{e.title}</p>
                    {e.excerpt && <p className="line-clamp-1 text-xs text-muted">{e.excerpt}</p>}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {e.kind === 'local' ? 'Wydarzenie' : 'Sezonowe'}
                  </td>
                  <td className="px-4 py-3 text-xs">{e.displayPeriod ?? '—'}</td>
                  <td className="px-4 py-3">
                    {e.publishedAt ? (
                      <span className="rounded-full bg-soft-green px-2 py-0.5 text-xs font-medium text-italian-green">
                        Opublikowany
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted/15 px-2 py-0.5 text-xs font-medium text-muted">
                        Szkic
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/events/${e.id}`}
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
