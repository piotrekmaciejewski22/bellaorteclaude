"use client";

/**
 * ReservationTable — admin queue for booking inquiries.
 *
 * Lets admins approve/reject pending inquiries and add notes. Each
 * action calls `PATCH /api/admin/booking-inquiries/[id]` and refreshes
 * the page on success.
 *
 * Wymagania pokryte: 30.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Row {
  id: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  adminNote: string | null;
}

const STATUS_PL: Record<string, { label: string; cls: string }> = {
  pending: {
    label: 'Oczekujące',
    cls: 'bg-terracotta/10 text-terracotta',
  },
  confirmed: {
    label: 'Potwierdzone',
    cls: 'bg-soft-green text-italian-green',
  },
  rejected: {
    label: 'Odrzucone',
    cls: 'bg-italian-red/10 text-italian-red',
  },
  cancelled: {
    label: 'Anulowane',
    cls: 'bg-muted/15 text-muted',
  },
};

export function ReservationTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  async function act(id: string, action: 'confirm' | 'reject') {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/booking-inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.status === 409) {
        setError('Termin koliduje z istniejącą rezerwacją.');
        setBusyId(null);
        return;
      }
      if (!res.ok) {
        setError('Operacja nie powiodła się.');
        setBusyId(null);
        return;
      }
      router.refresh();
    } catch {
      setError('Błąd sieci.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ['all', 'Wszystkie'],
          ['pending', 'Oczekujące'],
          ['confirmed', 'Potwierdzone'],
          ['rejected', 'Odrzucone'],
        ].map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === v
                ? 'bg-italian-green text-flag-white'
                : 'border border-border bg-flag-white text-cypress hover:border-italian-green'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red"
        >
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-flag-white">
        <table className="w-full text-sm">
          <thead className="bg-soft-green text-cypress">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Apartament</th>
              <th className="px-4 py-3 text-left font-medium">Daty</th>
              <th className="px-4 py-3 text-left font-medium">Goście</th>
              <th className="px-4 py-3 text-left font-medium">Kontakt</th>
              <th className="px-4 py-3 text-left font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const status = STATUS_PL[row.status] ?? {
                label: row.status,
                cls: 'bg-muted/15 text-muted',
              };
              return (
                <tr
                  key={row.id}
                  className="border-t border-border align-top text-cypress"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.apartmentName}</td>
                  <td className="px-4 py-3">
                    <div>{row.checkIn}</div>
                    <div className="text-xs text-muted">→ {row.checkOut}</div>
                  </td>
                  <td className="px-4 py-3">
                    {row.adults} dor.
                    {row.children > 0 && `, ${row.children} dz.`}
                  </td>
                  <td className="px-4 py-3">
                    <div>{row.guestFullName}</div>
                    <a
                      href={`mailto:${row.guestEmail}`}
                      className="text-xs text-italian-green hover:underline"
                    >
                      {row.guestEmail}
                    </a>
                    {row.guestPhone && (
                      <div className="text-xs text-muted">{row.guestPhone}</div>
                    )}
                    {row.message && (
                      <p className="mt-1 text-xs italic text-muted">
                        {row.message}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => act(row.id, 'confirm')}
                          className="rounded-full bg-italian-green px-3 py-1.5 text-xs font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
                        >
                          Zatwierdź
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => act(row.id, 'reject')}
                          className="rounded-full border border-italian-red/40 px-3 py-1.5 text-xs font-semibold text-italian-red hover:bg-italian-red hover:text-flag-white disabled:opacity-50"
                        >
                          Odrzuć
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
