"use client";

/**
 * PlaceEditor — universal editor for restaurants AND attractions.
 *
 * `kind='restaurant'` adds the cuisine/hours/website/tip/phone fields.
 * `kind='attraction'` swaps in practicalInfo/travelInfo. Map_Data is shared.
 *
 * Wymagania pokryte: 31, 32, 41.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

import { validateRestaurant } from '@/lib/validation/restaurant';
import { validateAttraction } from '@/lib/validation/attraction';
import { parseMapsUrl, isShortMapsUrl } from '@/lib/geo/parse-maps-url';
import type { Attraction, Restaurant } from '@/lib/types';

type EditorMode =
  | { kind: 'restaurant'; initial?: Restaurant }
  | { kind: 'attraction'; initial?: Attraction };

interface PlaceEditorProps {
  mode: EditorMode;
}

interface ValidationError {
  field: string;
  message: string;
}

export function PlaceEditor({ mode }: PlaceEditorProps) {
  const router = useRouter();
  const isRestaurant = mode.kind === 'restaurant';
  const initial = mode.initial;
  const isCreate = !initial;
  const baseEndpoint = isRestaurant ? 'restaurants' : 'places';
  const listHref = isRestaurant ? '/admin/restaurants' : '/admin/places';

  // Common fields
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [region, setRegion] = useState(initial?.region ?? 'orte_area');
  const [tags, setTags] = useState((initial?.tags ?? []).join('\n'));
  const [address, setAddress] = useState(initial?.address ?? '');
  const [placeId, setPlaceId] = useState(initial?.placeId ?? '');
  const [latitude, setLatitude] = useState<string>(
    initial?.latitude !== undefined && initial?.latitude !== null ? String(initial.latitude) : '',
  );
  const [longitude, setLongitude] = useState<string>(
    initial?.longitude !== undefined && initial?.longitude !== null ? String(initial.longitude) : '',
  );
  const [mapsUrl, setMapsUrl] = useState(initial?.mapsUrl ?? '');
  const [published, setPublished] = useState<boolean>(initial?.publishedAt !== null && initial?.publishedAt !== undefined);

  // Stan dla pola „Wklej link z Google Maps"
  const [pasteUrl, setPasteUrl] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState<
    | { kind: 'success'; lat: number; lng: number }
    | { kind: 'short' }
    | { kind: 'invalid' }
    | null
  >(null);

  function handlePasteUrl(input: string) {
    setPasteUrl(input);
    if (!input.trim()) {
      setPasteFeedback(null);
      return;
    }
    if (isShortMapsUrl(input)) {
      setPasteFeedback({ kind: 'short' });
      return;
    }
    const parsed = parseMapsUrl(input);
    if (!parsed) {
      setPasteFeedback({ kind: 'invalid' });
      return;
    }
    // Auto-wypełnienie pól
    setLatitude(String(parsed.latitude));
    setLongitude(String(parsed.longitude));
    setMapsUrl(parsed.cleanUrl);
    setPasteFeedback({ kind: 'success', lat: parsed.latitude, lng: parsed.longitude });
  }

  // Restaurant-only
  const r = isRestaurant ? (initial as Restaurant | undefined) : undefined;
  const [cuisine, setCuisine] = useState((r?.cuisineCategories ?? []).join('\n'));
  const [openingHours, setOpeningHours] = useState(r?.openingHours ?? '');
  const [phone, setPhone] = useState(r?.phone ?? '');
  const [website, setWebsite] = useState(r?.website ?? '');
  const [tipForGuest, setTipForGuest] = useState(r?.tipForGuest ?? '');

  // Attraction-only
  const a = !isRestaurant ? (initial as Attraction | undefined) : undefined;
  const [practicalInfo, setPracticalInfo] = useState(a?.practicalInfo ?? '');
  const [travelInfo, setTravelInfo] = useState(a?.travelInfo ?? '');

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function fieldError(field: string): string | null {
    return errors.find((e) => e.field === field)?.message ?? null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setSavedAt(null);

    const splitLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
    const lat = latitude.trim() === '' ? null : Number(latitude);
    const lng = longitude.trim() === '' ? null : Number(longitude);

    const validatorPayload = {
      name: name.trim(),
      slug: slug.trim(),
      region,
      address: address || null,
      placeId: placeId || null,
      latitude: lat,
      longitude: lng,
    };

    const result = isRestaurant
      ? validateRestaurant(validatorPayload)
      : validateAttraction(validatorPayload);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setSaving(true);

    const payload: Record<string, unknown> = {
      name: name.trim(),
      slug: slug.trim(),
      description,
      region,
      tags: splitLines(tags),
      address: address || null,
      placeId: placeId || null,
      latitude: lat,
      longitude: lng,
      mapsUrl: mapsUrl || null,
      published,
    };

    if (isRestaurant) {
      payload.cuisineCategories = splitLines(cuisine);
      payload.openingHours = openingHours || null;
      payload.phone = phone || null;
      payload.website = website || null;
      payload.tipForGuest = tipForGuest || null;
    } else {
      payload.practicalInfo = practicalInfo || null;
      payload.travelInfo = travelInfo || null;
    }

    try {
      const url = isCreate
        ? `/api/admin/${baseEndpoint}`
        : `/api/admin/${baseEndpoint}/${initial!.id}`;
      const res = await fetch(url, {
        method: isCreate ? 'POST' : 'PATCH',
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
        setServerError('Nie udało się zapisać.');
        setSaving(false);
        return;
      }
      setSavedAt(new Date().toLocaleTimeString('pl-PL'));

      if (isCreate) {
        const data = (await res.json()) as { id: string };
        router.push(`${listHref}/${data.id}`);
        return;
      }
      router.refresh();
    } catch {
      setServerError('Brak połączenia.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!confirm(`Usunąć ${isRestaurant ? 'restaurację' : 'atrakcję'}? Pozycja zniknie publicznie, ale dane są zachowane (soft delete).`)) {
      return;
    }
    const url = `/api/admin/${baseEndpoint}/${initial.id}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) {
      router.push(listHref);
    } else {
      alert('Nie udało się usunąć.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-flag-white p-6">
        <h2 className="heading-section text-2xl text-ink">Podstawowe</h2>

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
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
            />
            {fieldError('name') && <p className="mt-1 text-xs text-italian-red">{fieldError('name')}</p>}
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
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 font-mono text-sm text-ink"
            />
            {fieldError('slug') && <p className="mt-1 text-xs text-italian-red">{fieldError('slug')}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="region" className="block text-sm font-medium text-cypress">
            Region
          </label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value as 'orte_area' | 'rome')}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          >
            <option value="orte_area">Okolica Orte</option>
            <option value="rome">Rzym</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-cypress">
            Opis
          </label>
          <textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-cypress">
            Tagi (jeden na linię)
          </label>
          <textarea
            id="tags"
            rows={4}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-cypress">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-italian-green"
          />
          Opublikowane (widoczne publicznie)
        </label>
      </section>

      {isRestaurant && (
        <section className="space-y-4 rounded-2xl border border-border bg-flag-white p-6">
          <h2 className="heading-section text-2xl text-ink">Restauracja</h2>

          <div>
            <label htmlFor="cuisine" className="block text-sm font-medium text-cypress">
              Kategorie kuchni (jedna na linię)
            </label>
            <textarea
              id="cuisine"
              rows={3}
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
            />
          </div>

          <div>
            <label htmlFor="openingHours" className="block text-sm font-medium text-cypress">
              Godziny otwarcia
            </label>
            <textarea
              id="openingHours"
              rows={3}
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-cypress">
                Telefon
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
              />
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-cypress">
                Strona internetowa
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tipForGuest" className="block text-sm font-medium text-cypress">
              Wskazówka dla gości
            </label>
            <textarea
              id="tipForGuest"
              rows={3}
              value={tipForGuest}
              onChange={(e) => setTipForGuest(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
            />
          </div>
        </section>
      )}

      {!isRestaurant && (
        <section className="space-y-4 rounded-2xl border border-border bg-flag-white p-6">
          <h2 className="heading-section text-2xl text-ink">Atrakcja</h2>

          <div>
            <label htmlFor="practicalInfo" className="block text-sm font-medium text-cypress">
              Informacje praktyczne
            </label>
            <textarea
              id="practicalInfo"
              rows={4}
              value={practicalInfo}
              onChange={(e) => setPracticalInfo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
            />
          </div>

          <div>
            <label htmlFor="travelInfo" className="block text-sm font-medium text-cypress">
              Jak dojechać
            </label>
            <textarea
              id="travelInfo"
              rows={4}
              value={travelInfo}
              onChange={(e) => setTravelInfo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
            />
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-border bg-flag-white p-6">
        <h2 className="heading-section text-2xl text-ink">Mapa</h2>
        <p className="text-sm text-cypress/80">
          Wymagany jest adres oraz Google Place ID lub współrzędne (szerokość + długość).
        </p>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-cypress">
            Adres
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          />
          {fieldError('address') && <p className="mt-1 text-xs text-italian-red">{fieldError('address')}</p>}
        </div>

        <div>
          <label htmlFor="placeId" className="block text-sm font-medium text-cypress">
            Google Place ID
          </label>
          <input
            id="placeId"
            type="text"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 font-mono text-sm text-ink"
          />
          {fieldError('placeId') && <p className="mt-1 text-xs text-italian-red">{fieldError('placeId')}</p>}
        </div>

        {/* Pole „Wklej link z Google Maps" — auto-uzupełnia lat/lng/mapsUrl. */}
        <div className="rounded-xl border border-italian-green/30 bg-soft-green/30 p-4">
          <label htmlFor="pasteMapsUrl" className="flex items-center gap-2 text-sm font-medium text-cypress">
            <Sparkles size={14} className="text-italian-green" />
            Wklej link z Google Maps
          </label>
          <p className="mt-1 text-xs text-cypress/80">
            Otwórz miejsce w Google Maps, skopiuj URL z przeglądarki (np. zaczynający się od{' '}
            <code className="rounded bg-flag-white px-1 font-mono">https://www.google.com/maps/place/…</code>
            ) i wklej tutaj. Współrzędne wypełnimy automatycznie.
          </p>
          <input
            id="pasteMapsUrl"
            type="url"
            value={pasteUrl}
            onChange={(e) => handlePasteUrl(e.target.value)}
            placeholder="https://www.google.com/maps/place/..."
            className="mt-2 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-sm text-ink"
          />
          {pasteFeedback?.kind === 'success' && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-italian-green">
              <CheckCircle2 size={12} />
              Współrzędne wypełnione: {pasteFeedback.lat.toFixed(5)}, {pasteFeedback.lng.toFixed(5)}
            </p>
          )}
          {pasteFeedback?.kind === 'short' && (
            <p className="mt-2 inline-flex items-start gap-1 text-xs text-terracotta">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>
                To skrócony link (goo.gl). Kliknij w niego, otworzy się Google Maps —
                potem skopiuj pełen URL z paska adresu i wklej tutaj.
              </span>
            </p>
          )}
          {pasteFeedback?.kind === 'invalid' && (
            <p className="mt-2 inline-flex items-start gap-1 text-xs text-italian-red">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>
                Nie znalazłem współrzędnych w tym linku. Upewnij się, że to URL z Google Maps
                z klikniętym pinem (zwykle zawiera <code>@lat,lng,zoom</code>).
              </span>
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-cypress">
              Szerokość
            </label>
            <input
              id="latitude"
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 font-mono text-sm text-ink"
            />
            {fieldError('latitude') && <p className="mt-1 text-xs text-italian-red">{fieldError('latitude')}</p>}
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-cypress">
              Długość
            </label>
            <input
              id="longitude"
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 font-mono text-sm text-ink"
            />
            {fieldError('longitude') && <p className="mt-1 text-xs text-italian-red">{fieldError('longitude')}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="mapsUrl" className="block text-sm font-medium text-cypress">
            Bezpośredni link do Google Maps (opcjonalnie)
          </label>
          <input
            id="mapsUrl"
            type="url"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          />
        </div>
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
          {saving ? 'Zapisywanie...' : isCreate ? 'Utwórz' : 'Zapisz zmiany'}
        </button>
        {!isCreate && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-italian-red/40 px-6 py-3 text-sm font-semibold text-italian-red hover:bg-italian-red hover:text-flag-white"
          >
            Usuń (soft)
          </button>
        )}
      </div>
    </form>
  );
}
