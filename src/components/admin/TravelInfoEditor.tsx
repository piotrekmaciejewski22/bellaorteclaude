"use client";

/**
 * TravelInfoEditor — manage `/useful-info` rows.
 *
 * Wymagania pokryte: 34.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

import type { TravelInfo, TravelInfoKind } from '@/lib/types';
import { TRAVEL_INFO_KIND_PL } from '@/lib/data/travel-info';

interface TravelInfoEditorProps {
  initial: TravelInfo[];
}

const KINDS: TravelInfoKind[] = [
  'car_rental',
  'rome_transfer',
  'trains',
  'travel_directions',
];

export function TravelInfoEditor({ initial }: TravelInfoEditorProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/useful-info/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) setError('Zapis nie powiódł się.');
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function destroy(id: string) {
    if (!confirm('Usunąć wpis?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/useful-info/${id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
      else setError('Usunięcie nie powiodło się.');
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/useful-info', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'trains',
          title: 'Nowy wpis',
          body: '',
          externalLinks: [],
          displayOrder: initial.length,
          published: false,
        }),
      });
      if (res.ok) router.refresh();
      else setError('Dodanie nie powiodło się.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-cypress/80">{initial.length} wpisów</p>
        <button
          type="button"
          onClick={add}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-italian-green px-4 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
        >
          <Plus size={14} />
          Dodaj wpis
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {error}
        </p>
      )}

      <ul className="space-y-4">
        {initial.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border bg-flag-white p-5">
            <div className="grid gap-3 md:grid-cols-[200px,1fr,auto]">
              <select
                value={item.kind}
                onChange={(e) => patch(item.id, { kind: e.target.value })}
                className="rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {TRAVEL_INFO_KIND_PL[k]}
                  </option>
                ))}
              </select>
              <input
                type="text"
                defaultValue={item.title}
                onBlur={(e) => {
                  if (e.target.value !== item.title) patch(item.id, { title: e.target.value });
                }}
                className="rounded-lg border border-border bg-ivory px-3 py-2 text-sm font-semibold"
              />
              <button
                type="button"
                onClick={() => destroy(item.id)}
                disabled={busy}
                aria-label="Usuń wpis"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-italian-red/40 text-italian-red hover:bg-italian-red hover:text-flag-white"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <textarea
              defaultValue={item.body}
              rows={4}
              onBlur={(e) => {
                if (e.target.value !== item.body) patch(item.id, { body: e.target.value });
              }}
              className="mt-3 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
            />

            <div className="mt-3">
              <label className="text-eyebrow">Linki zewnętrzne (jeden na linię, format: etykieta|url)</label>
              <textarea
                defaultValue={item.externalLinks.map((l) => `${l.label}|${l.url}`).join('\n')}
                rows={3}
                onBlur={(e) => {
                  const links = e.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter((line) => line.includes('|'))
                    .map((line) => {
                      const [label, url] = line.split('|').map((s) => s.trim());
                      return { label, url };
                    })
                    .filter((l) => l.label && l.url);
                  patch(item.id, { externalLinks: links });
                }}
                className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 font-mono text-xs"
              />
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs text-cypress">
              <input
                type="checkbox"
                defaultChecked={item.publishedAt !== null}
                onChange={(e) => patch(item.id, { published: e.target.checked })}
                className="h-4 w-4 accent-italian-green"
              />
              Opublikowany
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
