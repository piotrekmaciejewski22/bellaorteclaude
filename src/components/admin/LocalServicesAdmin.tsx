"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

import {
  type LocalService,
  type LocalServiceKind,
  LOCAL_SERVICE_KIND_PL,
} from '@/lib/data/local-services';

const KINDS: LocalServiceKind[] = [
  'grocery',
  'pharmacy',
  'atm',
  'transit',
  'laundry',
  'medical',
  'other',
];

interface Props {
  initialItems: LocalService[];
}

export function LocalServicesAdmin({ initialItems }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newKind, setNewKind] = useState<LocalServiceKind>('grocery');
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/local-services/${id}`, {
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

  async function deleteItem(id: string) {
    if (!confirm('Usunąć?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/local-services/${id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
      else setError('Usunięcie nie powiodło się.');
    } finally {
      setBusy(false);
    }
  }

  async function addItem() {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/local-services', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: newKind,
          name: newName,
          address: newAddress,
          notes: newNotes,
          published: true,
        }),
      });
      if (res.ok) {
        setNewName('');
        setNewAddress('');
        setNewNotes('');
        router.refresh();
      } else {
        setError('Dodanie nie powiodło się.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-italian-green/40 bg-soft-green/30 p-6">
        <h2 className="heading-section text-2xl text-ink">Dodaj nową usługę</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as LocalServiceKind)}
            className="rounded-lg border border-border bg-flag-white px-3 py-2"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>{LOCAL_SERVICE_KIND_PL[k]}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nazwa (np. Conad)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-lg border border-border bg-flag-white px-3 py-2"
          />
          <input
            type="text"
            placeholder="Adres"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="rounded-lg border border-border bg-flag-white px-3 py-2 md:col-span-2"
          />
          <textarea
            placeholder="Notatka — godziny, ceny, wskazówki…"
            rows={2}
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            className="rounded-lg border border-border bg-flag-white px-3 py-2 md:col-span-2"
          />
        </div>
        <button
          type="button"
          onClick={addItem}
          disabled={busy || !newName.trim()}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-italian-green px-5 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
        >
          <Plus size={14} />
          Dodaj
        </button>
      </section>

      <section>
        <h2 className="heading-section mb-4 text-2xl text-ink">
          Istniejące pozycje ({initialItems.length})
        </h2>
        {initialItems.length === 0 ? (
          <p className="rounded-2xl border border-border bg-flag-white p-6 text-center text-sm text-muted">
            Brak pozycji.
          </p>
        ) : (
          <ul className="space-y-4">
            {initialItems.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-border bg-flag-white p-5"
              >
                <div className="grid gap-3 md:grid-cols-[160px,1fr,auto]">
                  <select
                    defaultValue={item.kind}
                    onChange={(e) => patch(item.id, { kind: e.target.value })}
                    className="rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>{LOCAL_SERVICE_KIND_PL[k]}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    defaultValue={item.name}
                    onBlur={(e) => {
                      if (e.target.value !== item.name) patch(item.id, { name: e.target.value });
                    }}
                    className="rounded-lg border border-border bg-ivory px-3 py-2 text-sm font-display"
                  />
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    disabled={busy}
                    aria-label="Usuń"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-italian-red/40 text-italian-red hover:bg-italian-red hover:text-flag-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <input
                  type="text"
                  defaultValue={item.address}
                  placeholder="Adres"
                  onBlur={(e) => {
                    if (e.target.value !== item.address) patch(item.id, { address: e.target.value });
                  }}
                  className="mt-3 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                />

                <textarea
                  defaultValue={item.notes}
                  rows={2}
                  placeholder="Notatka"
                  onBlur={(e) => {
                    if (e.target.value !== item.notes) patch(item.id, { notes: e.target.value });
                  }}
                  className="mt-3 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                />

                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  <input
                    type="text"
                    defaultValue={item.hours ?? ''}
                    placeholder="Godziny otwarcia"
                    onBlur={(e) => {
                      const v = e.target.value || null;
                      if (v !== item.hours) patch(item.id, { hours: v });
                    }}
                    className="rounded-lg border border-border bg-ivory px-3 py-2 text-xs"
                  />
                  <input
                    type="number"
                    defaultValue={item.walkMinutes ?? ''}
                    placeholder="Minut spaceru"
                    onBlur={(e) => {
                      const v = e.target.value === '' ? null : Number(e.target.value);
                      if (v !== item.walkMinutes) patch(item.id, { walkMinutes: v });
                    }}
                    className="rounded-lg border border-border bg-ivory px-3 py-2 text-xs"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    defaultValue={item.latitude ?? ''}
                    placeholder="Latitude"
                    onBlur={(e) => {
                      const v = e.target.value === '' ? null : Number(e.target.value);
                      if (v !== item.latitude) patch(item.id, { latitude: v });
                    }}
                    className="rounded-lg border border-border bg-ivory px-3 py-2 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    defaultValue={item.longitude ?? ''}
                    placeholder="Longitude"
                    onBlur={(e) => {
                      const v = e.target.value === '' ? null : Number(e.target.value);
                      if (v !== item.longitude) patch(item.id, { longitude: v });
                    }}
                    className="rounded-lg border border-border bg-ivory px-3 py-2 text-xs font-mono"
                  />
                </div>

                <label className="mt-3 flex items-center gap-2 text-sm text-cypress">
                  <input
                    type="checkbox"
                    defaultChecked={item.publishedAt !== null}
                    onChange={(e) => patch(item.id, { published: e.target.checked })}
                    className="h-4 w-4 accent-italian-green"
                  />
                  Opublikowane
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
