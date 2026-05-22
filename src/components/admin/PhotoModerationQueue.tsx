"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface PhotoRow {
  id: string;
  signedUrl: string | null;
  status: string;
  createdAt: string;
  targetType: 'restaurant' | 'attraction';
  targetName: string;
}

const STATUS_PL: Record<string, string> = {
  pending: 'Oczekuje',
  approved: 'Zatwierdzone',
  rejected: 'Odrzucone',
  hidden: 'Ukryte',
};

export function PhotoModerationQueue({
  rows,
  endpoint = '/api/admin/guest-photos',
}: {
  rows: PhotoRow[];
  endpoint?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError('Akcja nie powiodła się.');
        setBusyId(null);
        return;
      }
      router.refresh();
    } catch {
      setError('Brak połączenia.');
    } finally {
      setBusyId(null);
    }
  }

  async function destroy(id: string) {
    if (!confirm('Trwale usunąć zdjęcie? Tej operacji nie można cofnąć.')) return;
    setBusyId(id);
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Usunięcie nie powiodło się.');
        setBusyId(null);
        return;
      }
      router.refresh();
    } catch {
      setError('Brak połączenia.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ['pending', 'Oczekujące'],
          ['approved', 'Zatwierdzone'],
          ['rejected', 'Odrzucone'],
          ['hidden', 'Ukryte'],
          ['all', 'Wszystkie'],
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

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-border bg-flag-white p-8 text-center text-sm text-muted">
          Brak zdjęć w tym widoku.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((row) => (
            <li
              key={row.id}
              className="overflow-hidden rounded-2xl border border-border bg-flag-white"
            >
              {row.signedUrl ? (
                <div className="relative aspect-square w-full">
                  <Image
                    src={row.signedUrl}
                    alt={`Zdjęcie do moderacji (${row.targetName})`}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-muted/15 text-xs text-muted">
                  Podgląd niedostępny
                </div>
              )}
              <div className="space-y-2 p-3 text-xs text-cypress">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-soft-green px-2 py-0.5 text-[10px] font-semibold text-italian-green">
                    {STATUS_PL[row.status] ?? row.status}
                  </span>
                  <span className="text-muted">
                    {row.targetType === 'restaurant' ? 'Restauracja' : 'Atrakcja'}
                  </span>
                </div>
                <p className="line-clamp-1 text-cypress">{row.targetName}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === row.id || row.status === 'approved'}
                    onClick={() => setStatus(row.id, 'approved')}
                    className="rounded-full bg-italian-green px-2.5 py-1 text-[10px] font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
                  >
                    Zatwierdź
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id || row.status === 'rejected'}
                    onClick={() => setStatus(row.id, 'rejected')}
                    className="rounded-full border border-italian-red/40 px-2.5 py-1 text-[10px] font-semibold text-italian-red hover:bg-italian-red hover:text-flag-white disabled:opacity-50"
                  >
                    Odrzuć
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id || row.status === 'hidden'}
                    onClick={() => setStatus(row.id, 'hidden')}
                    className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-cypress hover:bg-soft-green disabled:opacity-50"
                  >
                    Ukryj
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => destroy(row.id)}
                    className="rounded-full bg-italian-red/10 px-2.5 py-1 text-[10px] font-semibold text-italian-red hover:bg-italian-red hover:text-flag-white disabled:opacity-50"
                  >
                    Usuń trwale
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
