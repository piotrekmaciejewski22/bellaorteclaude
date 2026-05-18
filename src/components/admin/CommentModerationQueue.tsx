"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CommentRow {
  id: string;
  signature: string;
  body: string;
  status: string;
  createdAt: string;
  postTitle: string;
  postSlug: string;
}

const STATUS_PL: Record<string, string> = {
  pending: 'Oczekuje',
  approved: 'Zatwierdzony',
  rejected: 'Odrzucony',
  hidden: 'Ukryty',
};

export function CommentModerationQueue({ rows }: { rows: CommentRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/blog-comments/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError('Akcja nie powiodła się.');
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function destroy(id: string) {
    if (!confirm('Trwale usunąć komentarz?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/blog-comments/${id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
      else setError('Usunięcie nie powiodło się.');
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
        <p className="mb-4 rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-border bg-flag-white p-8 text-center text-sm text-muted">
          Brak komentarzy w tym widoku.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((row) => (
            <li key={row.id} className="rounded-2xl border border-border bg-flag-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-ink">{row.signature}</p>
                  <p className="mt-1 text-xs text-muted">Pod wpisem: {row.postTitle}</p>
                </div>
                <span className="rounded-full bg-soft-green px-2.5 py-1 text-xs font-medium text-italian-green">
                  {STATUS_PL[row.status] ?? row.status}
                </span>
              </div>
              <p className="text-ui mt-3 whitespace-pre-line text-sm text-cypress/85">
                {row.body}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={busyId === row.id || row.status === 'approved'} onClick={() => setStatus(row.id, 'approved')} className="rounded-full bg-italian-green px-3 py-1.5 text-xs font-semibold text-flag-white hover:bg-cypress disabled:opacity-50">Zatwierdź</button>
                <button type="button" disabled={busyId === row.id || row.status === 'rejected'} onClick={() => setStatus(row.id, 'rejected')} className="rounded-full border border-italian-red/40 px-3 py-1.5 text-xs font-semibold text-italian-red hover:bg-italian-red hover:text-flag-white disabled:opacity-50">Odrzuć</button>
                <button type="button" disabled={busyId === row.id || row.status === 'hidden'} onClick={() => setStatus(row.id, 'hidden')} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-cypress hover:bg-soft-green disabled:opacity-50">Ukryj</button>
                <button type="button" disabled={busyId === row.id} onClick={() => destroy(row.id)} className="rounded-full bg-italian-red/10 px-3 py-1.5 text-xs font-semibold text-italian-red hover:bg-italian-red hover:text-flag-white disabled:opacity-50">Usuń trwale</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
