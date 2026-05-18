"use client";

/**
 * ReviewForm — public form to submit a review (with optional photo).
 *
 * Wymagania pokryte: 23, 24, 25.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';

import {
  validateReview,
  type ValidationError,
} from '@/lib/validation/review';

interface ReviewFormProps {
  targetType: 'restaurant' | 'attraction';
  targetId: string;
  consentTextReview: string;
  consentTextPhoto: string;
}

export function ReviewForm({
  targetType,
  targetId,
  consentTextReview,
  consentTextPhoto,
}: ReviewFormProps) {
  const router = useRouter();
  const [signature, setSignature] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [consentReview, setConsentReview] = useState(false);
  const [consentPhoto, setConsentPhoto] = useState(false);

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  function fieldError(field: string): string | null {
    return errors.find((e) => e.field === field)?.message ?? null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);

    const payload = {
      targetType,
      targetId,
      signature,
      rating,
      body,
      consent: consentReview,
    };

    const result = validateReview(payload);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (photo && !consentPhoto) {
      setErrors([{ field: 'consentPhoto', message: 'Wymagana zgoda na publikację zdjęcia' }]);
      return;
    }
    setErrors([]);
    setPending(true);

    try {
      const reviewRes = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (reviewRes.status === 400) {
        const data = (await reviewRes.json()) as { errors?: ValidationError[]; error?: string };
        if (data.errors) setErrors(data.errors);
        else setServerError(data.error ?? 'Niepoprawne dane');
        setPending(false);
        return;
      }
      if (reviewRes.status === 429) {
        setServerError('Zbyt wiele prób. Spróbuj ponownie później.');
        setPending(false);
        return;
      }
      if (!reviewRes.ok) {
        setServerError('Nie udało się zapisać opinii.');
        setPending(false);
        return;
      }

      const reviewData = (await reviewRes.json()) as { id: string };

      if (photo) {
        const fd = new FormData();
        fd.append('file', photo);
        fd.append('targetType', targetType);
        fd.append('targetId', targetId);
        fd.append('reviewId', reviewData.id);
        const photoRes = await fetch('/api/guest-photos', { method: 'POST', body: fd });
        if (!photoRes.ok) {
          // Review went through but photo did not.
          setServerError('Opinia została zapisana, ale upload zdjęcia się nie powiódł.');
        }
      }

      setSuccess(true);
      setSignature('');
      setRating(0);
      setBody('');
      setPhoto(null);
      setConsentReview(false);
      setConsentPhoto(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError('Brak połączenia.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="signature" className="block text-sm font-medium text-cypress">
          Podpis (imię)
        </label>
        <input
          id="signature"
          type="text"
          value={signature}
          maxLength={60}
          onChange={(e) => setSignature(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
        {fieldError('signature') && (
          <p className="mt-1 text-xs text-italian-red">{fieldError('signature')}</p>
        )}
      </div>

      <div>
        <span className="block text-sm font-medium text-cypress">Ocena</span>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Ocena 1 do 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? 'gwiazdka' : 'gwiazdek'}`}
              onClick={() => setRating(n)}
              className="rounded-md p-1 hover:bg-soft-green focus-visible:outline-2 focus-visible:outline-italian-green"
            >
              <Star
                size={28}
                className={
                  rating >= n
                    ? 'fill-italian-green text-italian-green'
                    : 'text-muted/40'
                }
              />
            </button>
          ))}
        </div>
        {fieldError('rating') && (
          <p className="mt-1 text-xs text-italian-red">{fieldError('rating')}</p>
        )}
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-cypress">
          Twoja opinia
        </label>
        <textarea
          id="body"
          rows={5}
          value={body}
          maxLength={1000}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
        <p className="mt-1 text-xs text-muted">{body.length}/1000</p>
        {fieldError('body') && (
          <p className="mt-1 text-xs text-italian-red">{fieldError('body')}</p>
        )}
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-cypress">
          Zdjęcie (opcjonalnie, JPEG/PNG/WebP, max 8 MB)
        </label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm"
        />
      </div>

      <div className="rounded-lg bg-soft-green p-4">
        <label className="flex items-start gap-3 text-sm text-cypress">
          <input
            type="checkbox"
            checked={consentReview}
            onChange={(e) => setConsentReview(e.target.checked)}
            className="mt-1 h-4 w-4 accent-italian-green"
          />
          <span>{consentTextReview}</span>
        </label>
        {fieldError('consent') && (
          <p className="mt-1 text-xs text-italian-red">{fieldError('consent')}</p>
        )}
      </div>

      {photo && (
        <div className="rounded-lg bg-soft-green p-4">
          <label className="flex items-start gap-3 text-sm text-cypress">
            <input
              type="checkbox"
              checked={consentPhoto}
              onChange={(e) => setConsentPhoto(e.target.checked)}
              className="mt-1 h-4 w-4 accent-italian-green"
            />
            <span>{consentTextPhoto}</span>
          </label>
          {fieldError('consentPhoto') && (
            <p className="mt-1 text-xs text-italian-red">{fieldError('consentPhoto')}</p>
          )}
        </div>
      )}

      {serverError && (
        <p
          role="alert"
          className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red"
        >
          {serverError}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-italian-green/30 bg-soft-green px-3 py-2 text-sm text-italian-green">
          Dziękujemy! Twoja opinia czeka na moderację.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-italian-green px-6 py-3 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
      >
        {pending ? 'Wysyłanie...' : 'Wyślij opinię'}
      </button>
    </form>
  );
}
