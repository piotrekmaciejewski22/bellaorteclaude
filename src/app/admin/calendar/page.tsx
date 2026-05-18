/**
 * `/admin/calendar` — admin overview of reservations + blocks per apartment.
 *
 * Server Component, MVP-grade list view. A richer click-to-block UI is in
 * task 15.1 (`AdminCalendar` client component) — not included in the
 * minimum-viable cut. This page satisfies the immediate operational need:
 * see what is taken for each apartment.
 *
 * Wymagania pokryte: 29.
 */

import { createServerClient } from '@/lib/supabase/server';
import { AdminCalendar } from '@/components/admin/AdminCalendar';
import { getApartments } from '@/lib/data/apartments';

interface BlockRow {
  id: string;
  apartmentName: string;
  startsOn: string;
  endsOn: string;
  reason: string;
  note: string | null;
}

interface ReservationRow {
  id: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

export default async function AdminCalendarPage() {
  const client = await createServerClient();

  const [resQ, blocksQ] = await Promise.all([
    client
      .from('reservations')
      .select(
        'id, check_in, check_out, status, apartments:apartment_id (name)',
      )
      .order('check_in', { ascending: true })
      .limit(50),
    client
      .from('calendar_blocks')
      .select(
        'id, start_date, end_date, reason, note, apartments:apartment_id (name)',
      )
      .order('start_date', { ascending: true })
      .limit(50),
  ]);

  const apartments = await getApartments(client).catch(() => []);

  type ResJoined = {
    id: string;
    check_in: string;
    check_out: string;
    status: string;
    apartments: { name: string } | { name: string }[] | null;
  };
  type BlockJoined = {
    id: string;
    start_date: string;
    end_date: string;
    reason: string;
    note: string | null;
    apartments: { name: string } | { name: string }[] | null;
  };

  const reservations: ReservationRow[] = (resQ.data as ResJoined[] | null ?? []).map(
    (r) => {
      const a = r.apartments;
      const apartmentName = !a
        ? ''
        : Array.isArray(a)
        ? a[0]?.name ?? ''
        : a.name;
      return {
        id: r.id,
        apartmentName,
        checkIn: r.check_in,
        checkOut: r.check_out,
        status: r.status,
      };
    },
  );

  const blocks: BlockRow[] = (blocksQ.data as BlockJoined[] | null ?? []).map(
    (b) => {
      const a = b.apartments;
      const apartmentName = !a
        ? ''
        : Array.isArray(a)
        ? a[0]?.name ?? ''
        : a.name;
      return {
        id: b.id,
        apartmentName,
        startsOn: b.start_date,
        endsOn: b.end_date,
        reason: b.reason,
        note: b.note,
      };
    },
  );

  const REASON_PL: Record<string, string> = {
    maintenance: 'Konserwacja',
    owner_stay: 'Pobyt właściciela',
    cleaning: 'Sprzątanie',
    other: 'Inne',
  };

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">Kalendarz</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">
          Rezerwacje i blokady
        </h1>
        <p className="text-ui mt-2 max-w-2xl text-cypress/80">
          Klikaj wolne dni w wizualnym kalendarzu, by dodać blokadę. Lista
          poniżej pokazuje aktualny stan rezerwacji i istniejących blokad.
        </p>
      </header>

      {apartments.length > 0 && (
        <section className="mb-10">
          <AdminCalendar apartments={apartments.map((a) => ({ id: a.id, name: a.name }))} />
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="heading-section text-2xl text-ink">Rezerwacje aktywne</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-flag-white">
            {reservations.length === 0 ? (
              <p className="p-6 text-sm text-muted">Brak aktywnych rezerwacji.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-soft-green text-cypress">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Apartament</th>
                    <th className="px-4 py-3 text-left font-medium">Przyjazd</th>
                    <th className="px-4 py-3 text-left font-medium">Wyjazd</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-border text-cypress"
                    >
                      <td className="px-4 py-3">{r.apartmentName}</td>
                      <td className="px-4 py-3">{r.checkIn}</td>
                      <td className="px-4 py-3">{r.checkOut}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            r.status === 'active'
                              ? 'bg-soft-green text-italian-green'
                              : 'bg-muted/15 text-muted'
                          }`}
                        >
                          {r.status === 'active' ? 'Aktywna' : 'Anulowana'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section>
          <h2 className="heading-section text-2xl text-ink">Blokady kalendarza</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-flag-white">
            {blocks.length === 0 ? (
              <p className="p-6 text-sm text-muted">Brak blokad.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-soft-green text-cypress">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Apartament</th>
                    <th className="px-4 py-3 text-left font-medium">Od</th>
                    <th className="px-4 py-3 text-left font-medium">Do</th>
                    <th className="px-4 py-3 text-left font-medium">Powód</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((b) => (
                    <tr
                      key={b.id}
                      className="border-t border-border text-cypress"
                    >
                      <td className="px-4 py-3">{b.apartmentName}</td>
                      <td className="px-4 py-3">{b.startsOn}</td>
                      <td className="px-4 py-3">{b.endsOn}</td>
                      <td className="px-4 py-3">
                        {REASON_PL[b.reason] ?? b.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
