"use client";

/**
 * EventEditor — formularz edycji/tworzenia wydarzenia (lokalnego lub sezonowego).
 *
 * Wspólny komponent dla `/admin/events/new` i `/admin/events/[id]`.
 * Wzorowany na BlogPostEditor — ten sam pattern uploadu hero przez
 * `/api/admin/upload?kind=blog` (zapisuje do `site-media`).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trash2, Upload } from 'lucide-react';

import type { EventEntry } from '@/lib/data/events';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

interface EventEditorProps {
  event?: EventEntry;
  heroUrl?: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

export function EventEditor({ event, heroUrl }: EventEditorProps) {
  const router = useRouter();
  const isCreate = !event;

  const [kind, setKind] = useState<'local' | 'seasonal'>(event?.kind ?? 'local');
  const [title, setTitle] = useState(event?.title ?? '');
  const [excerpt, setExcerpt] = useState(event?.excerpt ?? '');
  const [bodyMd, setBodyMd] = useState(event?.bodyMd ?? '');
  const [startDate, setStartDate] = useState(event?.startDate ?? '');
  const [endDate, setEndDate] = useState(event?.endDate ?? '');
  const [displayPeriod, setDisplayPeriod] = useState(event?.displayPeriod ?? '');
  const [externalUrl, setExternalUrl] = useState(event?.externalUrl ?? '');
  const [displayOrder, setDisplayOrder] = useState<number>(event?.displayOrder ?? 0);
  const [published, setPublished] = useState<boolean>(event?.publishedAt != null);
  const [heroPath, setHeroPath] = useState<string | null>(event?.heroImagePath ?? null);
  const [currentHeroUrl, setCurrentHeroUrl] = useState<string | null>(heroUrl ?? null);

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);

  function fieldError(field: string): string | null {
    return errors.find((e) => e.field === field)?.message ?? null;
  }

  async function uploadHero() {
    if (!heroFile) return;
    setUploadingHero(true);
    setServerError(null);
    try {
      const fd = new FormData();
      fd.append('file', heroFile);
      fd.append('kind', 'blog');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setServerError(data.error ?? 'Upload nie powiódł się.');
        return;
      }
      const data = (await res.json()) as { path: string; url: string };
      setHeroPath(data.path);
      setCurrentHeroUrl(data.url);
      setHeroFile(null);

      // Auto-zapis przy edycji istniejącego wpisu.
      if (event) {
        await fetch(`/api/admin/events/${event.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ heroImagePath: data.path }),
        });
      }
    } finally {
      setUploadingHero(false);
    }
  }

  async function removeHero() {
    setHeroPath(null);
    setCurrentHeroUrl(null);
    if (event) {
      await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ heroImagePath: null }),
      });
    }
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setSavedAt(null);

    const payload = {
      kind,
      title: title.trim(),
      excerpt,
      bodyMd,
      startDate: startDate || null,
      endDate: endDate || null,
      displayPeriod: displayPeriod.trim() || null,
      externalUrl: externalUrl.trim() || null,
      heroImagePath: heroPath,
      displayOrder,
      published,
    };

    if (!payload.title) {
      setErrors([{ field: 'title', message: 'Tytuł jest wymagany' }]);
      return;
    }
    setErrors([]);
    setSaving(true);

    try {
      const url = isCreate ? '/api/admin/events' : `/api/admin/events/${event!.id}`;
      const res = await fetch(url, {
        method: isCreate ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 400) {
        const data = (await res.json()) as { errors?: ValidationError[]; error?: string };
        if (data.errors) setErrors(data.errors);
        else setServerError(data.error ?? 'Niepoprawne dane');
        return;
      }
      if (!res.ok) {
        setServerError('Zapis nie powiódł się.');
        return;
      }
      setSavedAt(new Date().toLocaleTimeString('pl-PL'));
      if (isCreate) {
        const data = (await res.json()) as { id: string };
        router.push(`/admin/events/${data.id}`);
        return;
      }
      router.refresh();
    } catch {
      setServerError('Brak połączenia.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent() {
    if (!event) return;
    if (!confirm('Usunąć wpis?')) return;
    const res = await fetch(`/api/admin/events/${event.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/events');
    else alert('Usunięcie nie powiodło się.');
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-flag-white p-6">
        <h2 className="heading-section text-2xl text-ink">Treść</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="kind" className="block text-sm font-medium text-cypress">
              Typ wpisu
            </label>
            <select
              id="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as 'local' | 'seasonal')}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
            >
              <option value="local">Wydarzenie lokalne (festa, sagra, koncert)</option>
              <option value="seasonal">Polecenie sezonowe (lato / jesień itp.)</option>
            </select>
          </div>
          <div>
            <label htmlFor="displayOrder" className="block text-sm font-medium text-cypress">
              Kolejność wyświetlania
            </label>
            <input
              id="displayOrder"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
            />
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-cypress">
            Tytuł
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          />
          {fieldError('title') && (
            <p className="mt-1 text-xs text-italian-red">{fieldError('title')}</p>
          )}
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-cypress">
            Lead (krótki opis na liście)
          </label>
          <textarea
            id="excerpt"
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          />
        </div>

        <div>
          <label htmlFor="bodyMd" className="block text-sm font-medium text-cypress">
            Treść wpisu
          </label>
          <div className="mt-1">
            <RichTextEditor value={bodyMd} onChange={setBodyMd} rows={12} placeholder="Pisz tutaj…" />
          </div>
          <p className="mt-1 text-xs text-muted">
            Użyj toolbara — pogrubienie, kursywa, nagłówki, listy, linki, kolory.
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-flag-white p-6">
        <h2 className="heading-section text-2xl text-ink">Daty i okres</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-cypress">
              Data początku (opcjonalnie)
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate ?? ''}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-cypress">
              Data końca (opcjonalnie)
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate ?? ''}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
            />
          </div>
        </div>

        <div>
          <label htmlFor="displayPeriod" className="block text-sm font-medium text-cypress">
            Etykieta czasowa (np. „Lipiec — Sierpień”, „14—15 maja 2026”)
          </label>
          <input
            id="displayPeriod"
            type="text"
            value={displayPeriod ?? ''}
            onChange={(e) => setDisplayPeriod(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          />
          <p className="mt-1 text-xs text-muted">
            Jeśli wypełnione — pojawia się zamiast automatycznej daty.
          </p>
        </div>

        <div>
          <label htmlFor="externalUrl" className="block text-sm font-medium text-cypress">
            Link zewnętrzny (opcjonalnie)
          </label>
          <input
            id="externalUrl"
            type="url"
            value={externalUrl ?? ''}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-flag-white p-6">
        <h2 className="heading-section text-2xl text-ink">Zdjęcie hero</h2>
        {currentHeroUrl ? (
          <div className="space-y-2">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border">
              <Image src={currentHeroUrl} alt="" fill unoptimized className="object-cover" />
            </div>
            <button
              type="button"
              onClick={removeHero}
              className="inline-flex items-center gap-1 text-xs text-italian-red hover:underline"
            >
              <Trash2 size={12} /> Usuń zdjęcie z wpisu
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">Brak zdjęcia. Możesz dodać poniżej.</p>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label htmlFor="hero" className="block text-sm font-medium text-cypress">
              Wgraj zdjęcie (JPEG/PNG/WebP, do 8 MB)
            </label>
            <input
              id="hero"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
          </div>
          <button
            type="button"
            disabled={!heroFile || uploadingHero}
            onClick={uploadHero}
            className="inline-flex items-center gap-2 rounded-full bg-italian-green px-4 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
          >
            <Upload size={14} />
            {uploadingHero ? 'Wgrywanie...' : 'Wgraj'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-flag-white p-6">
        <label className="flex items-center gap-3 text-sm text-cypress">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-italian-green"
          />
          Opublikowany (widoczny na /wydarzenia)
        </label>
      </section>

      {serverError && (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {serverError}
        </p>
      )}
      {savedAt && (
        <p className="rounded-lg border border-italian-green/30 bg-soft-green px-3 py-2 text-sm text-italian-green">
          Zapisano o {savedAt}.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-italian-green px-6 py-3 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
        >
          {saving ? 'Zapisywanie...' : isCreate ? 'Utwórz wpis' : 'Zapisz zmiany'}
        </button>
        {!isCreate && (
          <button
            type="button"
            onClick={deleteEvent}
            className="rounded-full border border-italian-red/40 px-6 py-3 text-sm font-semibold text-italian-red hover:bg-italian-red hover:text-flag-white"
          >
            Usuń wpis
          </button>
        )}
      </div>
    </form>
  );
}
