"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';

interface ValidationError {
  field: string;
  message: string;
}

interface CommunityPhotoUploaderProps {
  consentText: string;
}

export function CommunityPhotoUploader({ consentText }: CommunityPhotoUploaderProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  function fieldError(field: string): string | null {
    return errors.find((e) => e.field === field)?.message ?? null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);
    if (!file) {
      setErrors([{ field: 'file', message: 'Wybierz plik' }]);
      return;
    }
    if (!consent) {
      setErrors([{ field: 'consent', message: 'Wymagana zgoda na publikację' }]);
      return;
    }
    setErrors([]);
    setPending(true);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('caption', caption);
    fd.append('contributorName', contributorName);
    fd.append('locationLabel', locationLabel);
    fd.append('consent', 'true');

    try {
      const res = await fetch('/api/community-photos', { method: 'POST', body: fd });
      if (res.status === 400) {
        const data = (await res.json()) as { errors?: ValidationError[] };
        if (data.errors) setErrors(data.errors);
        else setServerError('Niepoprawne dane');
        return;
      }
      if (res.status === 429) {
        setServerError('Zbyt wiele prób. Spróbuj ponownie później.');
        return;
      }
      if (!res.ok) {
        setServerError('Upload nie powiódł się.');
        return;
      }
      setSuccess(true);
      setFile(null);
      setCaption('');
      setContributorName('');
      setLocationLabel('');
      setConsent(false);
      router.refresh();
    } catch {
      setServerError('Brak połączenia.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-flag-white p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-soft-green text-italian-green">
          <Camera size={20} />
        </span>
        <div>
          <h3 className="heading-section text-xl text-ink">Podziel się zdjęciem</h3>
          <p className="text-sm text-cypress/80">Po moderacji pojawi się w galerii poniżej.</p>
        </div>
      </div>

      <div>
        <label htmlFor="cphoto" className="block text-sm font-medium text-cypress">
          Zdjęcie (JPEG/PNG/WebP, do 8 MB)
        </label>
        <input
          id="cphoto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm"
        />
        {fieldError('file') && <p className="mt-1 text-xs text-italian-red">{fieldError('file')}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="cname" className="block text-sm font-medium text-cypress">
            Twoje imię (opcjonalnie)
          </label>
          <input
            id="cname"
            type="text"
            maxLength={60}
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          />
          {fieldError('contributorName') && (
            <p className="mt-1 text-xs text-italian-red">{fieldError('contributorName')}</p>
          )}
        </div>
        <div>
          <label htmlFor="cloc" className="block text-sm font-medium text-cypress">
            Miejsce / kontekst (opcjonalnie)
          </label>
          <input
            id="cloc"
            type="text"
            placeholder="np. Civita di Bagnoregio, czerwiec"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ccap" className="block text-sm font-medium text-cypress">
          Krótki opis (opcjonalnie)
        </label>
        <textarea
          id="ccap"
          rows={3}
          maxLength={500}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
        />
        {fieldError('caption') && (
          <p className="mt-1 text-xs text-italian-red">{fieldError('caption')}</p>
        )}
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
      {fieldError('consent') && <p className="text-xs text-italian-red">{fieldError('consent')}</p>}

      {serverError && (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {serverError}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-italian-green/30 bg-soft-green px-3 py-2 text-sm text-italian-green">
          Dziękujemy! Zdjęcie czeka na moderację.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-italian-green px-6 py-3 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
      >
        {pending ? 'Wysyłanie...' : 'Wyślij zdjęcie'}
      </button>
    </form>
  );
}
