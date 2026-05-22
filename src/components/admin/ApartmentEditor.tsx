"use client";

/**
 * ApartmentEditor — admin form for editing apartment content + gallery.
 *
 * Saves through `PATCH /api/admin/apartments/[id]`. Gallery uploads
 * through `POST /api/admin/apartments/[id]/photos` (multipart).
 *
 * Wymagania pokryte: 28.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trash2, Star } from 'lucide-react';

import {
  validateApartment,
  type ValidationError,
} from '@/lib/validation/apartment';
import type { Apartment } from '@/lib/types';

interface PhotoSummary {
  id: string;
  storagePath: string;
  publicUrl: string;
  alt: string;
  sourceKind: string;
}

interface ApartmentEditorProps {
  apartment: Apartment;
  photos: PhotoSummary[];
}

const SOURCE_KINDS = [
  { value: 'placeholder_orte', label: 'Placeholder Orte' },
  { value: 'placeholder_italy', label: 'Placeholder Włochy' },
  { value: 'placeholder_rome', label: 'Placeholder Rzym' },
  { value: 'interior_real', label: 'Wnętrze (prawdziwe zdjęcie)' },
  { value: 'exterior_real', label: 'Z zewnątrz (prawdziwe zdjęcie)' },
] as const;

export function ApartmentEditor({ apartment, photos }: ApartmentEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(apartment.name);
  const [slug, setSlug] = useState(apartment.slug);
  const [description, setDescription] = useState(apartment.description);
  const [maxGuests, setMaxGuests] = useState(apartment.maxGuests);
  const [bedrooms, setBedrooms] = useState(apartment.bedrooms);
  const [bathrooms, setBathrooms] = useState(apartment.bathrooms);
  const [amenitiesText, setAmenitiesText] = useState(
    apartment.amenities.join('\n'),
  );
  const [houseRules, setHouseRules] = useState(apartment.houseRules);
  const [published, setPublished] = useState<boolean>(
    apartment.publishedAt !== null,
  );

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadKind, setUploadKind] = useState<string>('interior_real');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function fieldError(field: string): string | null {
    return errors.find((e) => e.field === field)?.message ?? null;
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setSavedAt(null);

    const amenities = amenitiesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities,
      houseRules,
      published,
    };

    const result = validateApartment({
      name: payload.name,
      slug: payload.slug,
      maxGuests: payload.maxGuests,
      bedrooms: payload.bedrooms,
      bathrooms: payload.bathrooms,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/apartments/${apartment.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 400) {
        const data = (await res.json()) as { errors?: ValidationError[]; error?: string };
        if (data.errors) setErrors(data.errors);
        else setServerError(data.error ?? 'Niepoprawne dane');
        setSaving(false);
        return;
      }
      if (!res.ok) {
        setServerError('Nie udało się zapisać apartamentu.');
        setSaving(false);
        return;
      }
      setSavedAt(new Date().toLocaleTimeString('pl-PL'));
      router.refresh();
    } catch {
      setServerError('Brak połączenia.');
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadError(null);
    setUploading(true);

    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('alt', uploadAlt);
    fd.append('sourceKind', uploadKind);

    try {
      const res = await fetch(
        `/api/admin/apartments/${apartment.id}/photos`,
        { method: 'POST', body: fd },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setUploadError(data.error ?? 'Upload nie powiódł się.');
        setUploading(false);
        return;
      }
      setUploadFile(null);
      setUploadAlt('');
      router.refresh();
    } catch {
      setUploadError('Brak połączenia.');
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(photoId: string) {
    if (!confirm('Czy na pewno usunąć zdjęcie?')) return;
    const res = await fetch(
      `/api/admin/apartments/${apartment.id}/photos/${photoId}`,
      { method: 'DELETE' },
    );
    if (res.ok) router.refresh();
    else alert('Nie udało się usunąć zdjęcia.');
  }

  async function setAsHero(photoId: string) {
    // Ustawia wybrane zdjęcie jako pierwsze (display_order=0) i przesuwa
    // pozostałe — naiwna implementacja per zdjęcie, wystarczy dla 5-10.
    const others = photos.filter((p) => p.id !== photoId);
    const updates = [
      fetch(`/api/admin/apartments/${apartment.id}/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayOrder: 0 }),
      }),
      ...others.map((p, idx) =>
        fetch(`/api/admin/apartments/${apartment.id}/photos/${p.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ displayOrder: idx + 1 }),
        }),
      ),
    ];
    const results = await Promise.all(updates);
    if (results.every((r) => r.ok)) router.refresh();
    else alert('Nie udało się ustawić zdjęcia jako pierwsze.');
  }

  return (
    <div className="space-y-10">
      <form
        onSubmit={onSave}
        className="space-y-6 rounded-2xl border border-border bg-flag-white p-6"
      >
        <h2 className="heading-section text-2xl text-ink">Treść apartamentu</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-cypress">
              Nazwa
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
            />
            {fieldError('name') && (
              <p className="mt-1 text-xs text-italian-red">{fieldError('name')}</p>
            )}
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-cypress">
              Slug
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 font-mono text-sm text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
            />
            {fieldError('slug') && (
              <p className="mt-1 text-xs text-italian-red">{fieldError('slug')}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-cypress"
          >
            Opis
          </label>
          <textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="maxGuests" className="block text-sm font-medium text-cypress">
              Maks. gości
            </label>
            <input
              id="maxGuests"
              type="number"
              min={1}
              value={maxGuests}
              onChange={(e) => setMaxGuests(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
            />
            {fieldError('maxGuests') && (
              <p className="mt-1 text-xs text-italian-red">{fieldError('maxGuests')}</p>
            )}
          </div>
          <div>
            <label htmlFor="bedrooms" className="block text-sm font-medium text-cypress">
              Sypialnie
            </label>
            <input
              id="bedrooms"
              type="number"
              min={0}
              value={bedrooms}
              onChange={(e) => setBedrooms(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
            />
            {fieldError('bedrooms') && (
              <p className="mt-1 text-xs text-italian-red">{fieldError('bedrooms')}</p>
            )}
          </div>
          <div>
            <label htmlFor="bathrooms" className="block text-sm font-medium text-cypress">
              Łazienki
            </label>
            <input
              id="bathrooms"
              type="number"
              min={0}
              value={bathrooms}
              onChange={(e) => setBathrooms(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
            />
            {fieldError('bathrooms') && (
              <p className="mt-1 text-xs text-italian-red">{fieldError('bathrooms')}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="amenities" className="block text-sm font-medium text-cypress">
            Udogodnienia (jedno na linię)
          </label>
          <textarea
            id="amenities"
            rows={5}
            value={amenitiesText}
            onChange={(e) => setAmenitiesText(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
        </div>

        <div>
          <label htmlFor="houseRules" className="block text-sm font-medium text-cypress">
            Zasady pobytu
          </label>
          <textarea
            id="houseRules"
            rows={5}
            value={houseRules}
            onChange={(e) => setHouseRules(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-cypress">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-italian-green"
          />
          Apartament opublikowany (widoczny publicznie)
        </label>

        {serverError && (
          <p
            role="alert"
            className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red"
          >
            {serverError}
          </p>
        )}
        {savedAt && (
          <p className="rounded-lg border border-italian-green/30 bg-soft-green px-3 py-2 text-sm text-italian-green">
            Zapisano o {savedAt}.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-italian-green px-6 py-3 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
        >
          {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </button>
      </form>

      <section className="rounded-2xl border border-border bg-flag-white p-6">
        <h2 className="heading-section text-2xl text-ink">Galeria zdjęć</h2>
        <p className="text-ui mt-2 text-sm text-cypress/80">
          Pierwsze zdjęcie z gwiazdką jest używane jako miniaturka apartamentu
          na stronie głównej i w liście. Kliknij gwiazdkę przy innym zdjęciu
          żeby je ustawić jako pierwsze.
        </p>

        <form
          onSubmit={onUpload}
          className="mt-6 grid gap-3 rounded-xl border border-border bg-ivory p-4 md:grid-cols-[2fr,3fr,2fr,auto]"
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            className="text-sm"
            required
          />
          <input
            type="text"
            placeholder="Opis (alt)"
            value={uploadAlt}
            onChange={(e) => setUploadAlt(e.target.value)}
            className="rounded-lg border border-border bg-flag-white px-3 py-2 text-sm"
            required
          />
          <select
            value={uploadKind}
            onChange={(e) => setUploadKind(e.target.value)}
            className="rounded-lg border border-border bg-flag-white px-3 py-2 text-sm"
          >
            {SOURCE_KINDS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={uploading || !uploadFile}
            className="rounded-full bg-italian-green px-5 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
          >
            {uploading ? 'Wysyłanie...' : 'Dodaj'}
          </button>
        </form>
        {uploadError && (
          <p className="mt-2 rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
            {uploadError}
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.length === 0 ? (
            <p className="text-sm text-muted">Brak zdjęć w galerii.</p>
          ) : (
            photos.map((photo, idx) => (
              <div
                key={photo.id}
                className={`group relative overflow-hidden rounded-xl border bg-ivory ${
                  idx === 0 ? 'border-italian-green ring-2 ring-italian-green/30' : 'border-border'
                }`}
              >
                <div className="relative aspect-square">
                  <Image
                    src={photo.publicUrl}
                    alt={photo.alt}
                    fill
                    unoptimized
                    sizes="200px"
                    className="object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-italian-green px-2 py-0.5 text-[10px] font-semibold text-flag-white">
                      <Star size={10} fill="currentColor" />
                      Hero
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-3 text-xs text-cypress">
                  <p className="line-clamp-2">{photo.alt || '(brak opisu)'}</p>
                  <p className="text-muted">{photo.sourceKind}</p>
                </div>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => setAsHero(photo.id)}
                      aria-label="Ustaw jako pierwsze (hero)"
                      title="Ustaw jako pierwsze (hero)"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-flag-white/90 text-italian-green shadow-sm hover:bg-italian-green hover:text-flag-white"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deletePhoto(photo.id)}
                    aria-label="Usuń zdjęcie"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-flag-white/90 text-italian-red shadow-sm hover:bg-italian-red hover:text-flag-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
