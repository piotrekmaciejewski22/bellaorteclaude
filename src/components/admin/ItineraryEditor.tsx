"use client";

/**
 * ItineraryEditor — manage Rome itinerary points and info sections.
 *
 * Wymagania pokryte: 33.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

import type { DayPart, RomeInfoSection, RomeItineraryItem } from '@/lib/types';

interface ItineraryEditorProps {
  initialItems: RomeItineraryItem[];
  initialInfo: RomeInfoSection[];
  restaurantOptions: { id: string; name: string }[];
  attractionOptions: { id: string; name: string }[];
}

const DAY_PARTS: { value: DayPart; label: string }[] = [
  { value: 'morning', label: 'Poranek' },
  { value: 'noon', label: 'Południe' },
  { value: 'afternoon', label: 'Popołudnie' },
  { value: 'evening', label: 'Wieczór' },
];

const INFO_KIND_PL: Record<string, string> = {
  transfer_from_orte: 'Dojazd z Orte',
  public_transport: 'Komunikacja miejska',
  tickets: 'Bilety',
  safety: 'Bezpieczeństwo',
  opening_hours: 'Godziny otwarcia',
};

export function ItineraryEditor({
  initialItems,
  initialInfo,
  restaurantOptions,
  attractionOptions,
}: ItineraryEditorProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [infoSections, setInfoSections] = useState(initialInfo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patchItem(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rome/itinerary/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError('Zapis nie powiódł się.');
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Usunąć punkt?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/rome/itinerary/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        router.refresh();
      } else {
        setError('Usunięcie nie powiodło się.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function addItem() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/rome/itinerary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          dayPart: 'morning',
          title: 'Nowy punkt',
          body: '',
          displayOrder: items.length,
          published: false,
        }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setError('Dodanie nie powiodło się.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function patchInfo(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rome/info/${id}`, {
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

  return (
    <div className="space-y-12">
      {error && (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {error}
        </p>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-section text-2xl text-ink">Plan dnia w Rzymie</h2>
          <button
            type="button"
            onClick={addItem}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-italian-green px-4 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
          >
            <Plus size={14} />
            Dodaj punkt
          </button>
        </div>

        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border bg-flag-white p-5"
            >
              <div className="grid gap-3 md:grid-cols-[180px,1fr,auto]">
                <select
                  value={item.dayPart}
                  onChange={(e) => patchItem(item.id, { dayPart: e.target.value })}
                  className="rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                >
                  {DAY_PARTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  defaultValue={item.title}
                  onBlur={(e) => {
                    if (e.target.value !== item.title) patchItem(item.id, { title: e.target.value });
                  }}
                  className="rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  disabled={busy}
                  aria-label="Usuń punkt"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-italian-red/40 text-italian-red hover:bg-italian-red hover:text-flag-white"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <textarea
                defaultValue={item.body}
                rows={3}
                onBlur={(e) => {
                  if (e.target.value !== item.body) patchItem(item.id, { body: e.target.value });
                }}
                className="mt-3 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
              />

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-eyebrow">Powiązana restauracja</label>
                  <select
                    defaultValue={item.linkedRestaurantId ?? ''}
                    onChange={(e) =>
                      patchItem(item.id, { linkedRestaurantId: e.target.value || null })
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                  >
                    <option value="">— brak —</option>
                    {restaurantOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-eyebrow">Powiązana atrakcja</label>
                  <select
                    defaultValue={item.linkedAttractionId ?? ''}
                    onChange={(e) =>
                      patchItem(item.id, { linkedAttractionId: e.target.value || null })
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                  >
                    <option value="">— brak —</option>
                    {attractionOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="mt-4 flex items-center gap-2 text-xs text-cypress">
                <input
                  type="checkbox"
                  defaultChecked={item.publishedAt !== null}
                  onChange={(e) => patchItem(item.id, { published: e.target.checked })}
                  className="h-4 w-4 accent-italian-green"
                />
                Opublikowany
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="heading-section text-2xl text-ink">Sekcje informacyjne</h2>
        <p className="text-ui mt-2 text-sm text-cypress/80">
          5 stałych sekcji renderowanych na <code>/rome/info</code>. Edytuj
          tytuł i treść — kind nie zmienia się.
        </p>

        <ul className="mt-6 space-y-4">
          {infoSections.map((section) => (
            <li
              key={section.id}
              className="rounded-2xl border border-border bg-flag-white p-5"
            >
              <p className="text-eyebrow">
                {INFO_KIND_PL[section.kind] ?? section.kind}
              </p>
              <input
                type="text"
                defaultValue={section.title}
                onBlur={(e) => {
                  if (e.target.value !== section.title) patchInfo(section.id, { title: e.target.value });
                }}
                className="mt-2 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm font-semibold"
              />
              <textarea
                defaultValue={section.body}
                rows={5}
                onBlur={(e) => {
                  if (e.target.value !== section.body) patchInfo(section.id, { body: e.target.value });
                }}
                className="mt-2 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
              />
              <label className="mt-3 flex items-center gap-2 text-xs text-cypress">
                <input
                  type="checkbox"
                  defaultChecked={section.publishedAt !== null}
                  onChange={(e) => patchInfo(section.id, { published: e.target.checked })}
                  className="h-4 w-4 accent-italian-green"
                />
                Opublikowana
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
