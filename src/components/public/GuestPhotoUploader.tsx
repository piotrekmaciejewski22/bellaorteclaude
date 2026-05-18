"use client";

/**
 * GuestPhotoUploader — standalone photo upload for restaurants/attractions.
 *
 * Used outside of `ReviewForm` for visitors who only want to share a photo.
 *
 * Wymagania pokryte: 24, 25.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { validateGuestPhoto } from '@/lib/validation/guest-photo';

interface GuestPhotoUploaderProps {
  targetType: 'restaurant' | 'attraction';
  targetId: string;
  consentText: string;
}

export function GuestPhotoUploader({
  targetType,
  targetId,
  consentText,
}: GuestPhotoUploaderProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!file) {
      setError('Wybierz plik.');
      return;
    }
    if (!consent) {
      setError('Wymagana zgoda na publikację.');
      return;
    }

    const result = validateGuestPhoto(file, { targetType, targetId });
    if (!result.ok) {
      setError(result.errors[0]?.message ?? 'Niepoprawne dane.');
      return;
    }

    setPending(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('targetType', targetType);
      fd.append('targetId', targetId);
      const res = await fetch('/api/guest-photos', { method: 'POST', body: fd });
      if (res.status === 429) {
        setError('Zbyt wiele prób. Spróbuj ponownie później.');
        setPending(false);
        return;
      }
      if (!res.ok) {
        setError('Upload nie powiódł się.');
        setPending(false);
        return;
      }
      setSuccess(true);
      setFile(null);
      setConsent(false);
      router.refresh();
    } catch {
      setError('Brak połączenia.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor={`photo-${targetId}`}
          className="block text-sm font-medium text-cypress"
        >
          Zdjęcie (JPEG/PNG/WebP, max 8 MB)
        </label>
        <input
          id={`photo-${targetId}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-cypress">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 accent-italian-green"
        />
        <span>{consentText}</span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red"
        >
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-italian-green/30 bg-soft-green px-3 py-2 text-sm text-italian-green">
          Zdjęcie czeka na moderację.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !file}
        className="rounded-full bg-italian-green px-5 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
      >
        {pending ? 'Wysyłanie...' : 'Dodaj zdjęcie'}
      </button>
    </form>
  );
}
