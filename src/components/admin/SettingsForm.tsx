"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { SiteSettings } from '@/lib/types';

interface SettingsFormProps {
  initial: SiteSettings;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const router = useRouter();
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [contactPhone, setContactPhone] = useState(initial.contactPhone ?? '');
  const [footerAddress, setFooterAddress] = useState(initial.footerAddress);
  const [privacyPolicyMd, setPrivacyPolicyMd] = useState(initial.privacyPolicyMd);
  const [consentBooking, setConsentBooking] = useState(initial.consentTextBooking);
  const [consentReview, setConsentReview] = useState(initial.consentTextReview);
  const [consentPhoto, setConsentPhoto] = useState(initial.consentTextPhoto);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSavedAt(null);
    setSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contactEmail,
          contactPhone: contactPhone || null,
          footerAddress,
          privacyPolicyMd,
          consentTextBooking: consentBooking,
          consentTextReview: consentReview,
          consentTextPhoto: consentPhoto,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Zapis nie powiódł się.');
        setSaving(false);
        return;
      }
      setSavedAt(new Date().toLocaleTimeString('pl-PL'));
      router.refresh();
    } catch {
      setError('Brak połączenia.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-border bg-flag-white p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-cypress">
            Email kontaktowy
          </label>
          <input
            id="contactEmail"
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
        </div>
        <div>
          <label htmlFor="contactPhone" className="block text-sm font-medium text-cypress">
            Telefon kontaktowy
          </label>
          <input
            id="contactPhone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
        </div>
      </div>

      <div>
        <label htmlFor="footerAddress" className="block text-sm font-medium text-cypress">
          Adres w stopce
        </label>
        <input
          id="footerAddress"
          type="text"
          value={footerAddress}
          onChange={(e) => setFooterAddress(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
      </div>

      <div>
        <label htmlFor="privacyPolicyMd" className="block text-sm font-medium text-cypress">
          Polityka prywatności (Markdown)
        </label>
        <textarea
          id="privacyPolicyMd"
          rows={12}
          value={privacyPolicyMd}
          onChange={(e) => setPrivacyPolicyMd(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 font-mono text-sm text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
      </div>

      <div>
        <label htmlFor="consentBooking" className="block text-sm font-medium text-cypress">
          Tekst zgody (formularz rezerwacji)
        </label>
        <textarea
          id="consentBooking"
          rows={3}
          value={consentBooking}
          onChange={(e) => setConsentBooking(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
      </div>

      <div>
        <label htmlFor="consentReview" className="block text-sm font-medium text-cypress">
          Tekst zgody (opinia)
        </label>
        <textarea
          id="consentReview"
          rows={3}
          value={consentReview}
          onChange={(e) => setConsentReview(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
      </div>

      <div>
        <label htmlFor="consentPhoto" className="block text-sm font-medium text-cypress">
          Tekst zgody (zdjęcie)
        </label>
        <textarea
          id="consentPhoto"
          rows={3}
          value={consentPhoto}
          onChange={(e) => setConsentPhoto(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {error}
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
        {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
      </button>
    </form>
  );
}
