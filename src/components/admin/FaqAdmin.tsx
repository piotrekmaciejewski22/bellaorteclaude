"use client";

/**
 * FaqAdmin — inline edytor FAQ z listą + formularzem dodawania.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

import type { FaqItem } from '@/lib/data/faq';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

interface FaqAdminProps {
  initialItems: FaqItem[];
}

export function FaqAdmin({ initialItems }: FaqAdminProps) {
  const router = useRouter();
  const [items] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stan inline-edycji
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [adding, setAdding] = useState(false);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/faq/${id}`, {
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
    if (!confirm('Usunąć pytanie?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
      else setError('Usunięcie nie powiodło się.');
    } finally {
      setBusy(false);
    }
  }

  async function addItem() {
    if (!newQuestion.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          answerMd: newAnswer,
          displayOrder: items.length,
          published: true,
        }),
      });
      if (res.ok) {
        setNewQuestion('');
        setNewAnswer('');
        router.refresh();
      } else {
        setError('Dodanie nie powiodło się.');
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {error}
        </p>
      )}

      {/* Dodawanie nowego */}
      <section className="space-y-3 rounded-2xl border border-italian-green/40 bg-soft-green/30 p-6">
        <h2 className="heading-section text-2xl text-ink">Dodaj nowe pytanie</h2>
        <input
          type="text"
          placeholder="Pytanie..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="w-full rounded-lg border border-border bg-flag-white px-3 py-2"
        />
        <RichTextEditor
          value={newAnswer}
          onChange={setNewAnswer}
          rows={4}
          placeholder="Odpowiedź…"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={adding || !newQuestion.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-italian-green px-5 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
        >
          <Plus size={14} />
          {adding ? 'Dodawanie...' : 'Dodaj pytanie'}
        </button>
      </section>

      {/* Lista istniejących */}
      <section>
        <h2 className="heading-section mb-4 text-2xl text-ink">
          Istniejące pytania ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-border bg-flag-white p-6 text-center text-sm text-muted">
            Brak pytań w FAQ.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item, idx) => (
              <li
                key={item.id}
                className="rounded-2xl border border-border bg-flag-white p-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <input
                    type="text"
                    defaultValue={item.question}
                    onBlur={(e) => {
                      if (e.target.value !== item.question) {
                        patch(item.id, { question: e.target.value });
                      }
                    }}
                    className="flex-1 rounded-lg border border-border bg-ivory px-3 py-2 font-display text-lg text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    disabled={busy}
                    aria-label="Usuń pytanie"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-italian-red/40 text-italian-red hover:bg-italian-red hover:text-flag-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-3">
                  <RichTextEditor
                    value={item.answerMd}
                    onChange={(html) => {
                      // Debounce po 500ms — onChange przy każdej literze byłby przesadą.
                      if (html !== item.answerMd) {
                        clearTimeout((window as unknown as { __faqTimers?: Record<string, NodeJS.Timeout> }).__faqTimers?.[item.id]);
                        const timers =
                          ((window as unknown as { __faqTimers?: Record<string, NodeJS.Timeout> }).__faqTimers ??= {});
                        timers[item.id] = setTimeout(() => {
                          patch(item.id, { answerMd: html });
                        }, 800);
                      }
                    }}
                    rows={4}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-cypress">
                    <input
                      type="checkbox"
                      defaultChecked={item.publishedAt !== null}
                      onChange={(e) => patch(item.id, { published: e.target.checked })}
                      className="h-4 w-4 accent-italian-green"
                    />
                    Opublikowane
                  </label>
                  <label className="flex items-center gap-2 text-sm text-cypress">
                    Kolejność:
                    <input
                      type="number"
                      defaultValue={idx}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v) && v !== item.displayOrder) {
                          patch(item.id, { displayOrder: v });
                        }
                      }}
                      className="w-16 rounded-lg border border-border bg-ivory px-2 py-1"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
