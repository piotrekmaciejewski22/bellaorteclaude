"use client";

/**
 * BookingForm — Booking_Form (Wym. 9, 10).
 *
 * Client component. Validates client-side using the shared validator,
 * then POSTs JSON to `/api/booking-inquiries`. Pre-selects values from
 * query params (apartmentId, checkIn, checkOut). Maps server errors to
 * inline messages; 409 → conflict toast; 429 → rate-limit toast.
 *
 * NEVER asks for or shows price.
 *
 * Wymagania pokryte: 9, 10, 11.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  validateBookingInquiry,
  type ValidationError,
} from '@/lib/validation/booking-inquiry';

interface BookingFormApartment {
  id: string;
  name: string;
  maxGuests: number;
  slug: string;
}

interface BookingFormProps {
  apartments: BookingFormApartment[];
  preselectedApartmentId?: string;
  preselectedCheckIn?: string;
  preselectedCheckOut?: string;
  consentText: string;
}

export function BookingForm({
  apartments,
  preselectedApartmentId,
  preselectedCheckIn,
  preselectedCheckOut,
  consentText,
}: BookingFormProps) {
  const router = useRouter();
  const [apartmentId, setApartmentId] = useState(
    preselectedApartmentId ?? apartments[0]?.id ?? '',
  );
  const [checkIn, setCheckIn] = useState(preselectedCheckIn ?? '');
  const [checkOut, setCheckOut] = useState(preselectedCheckOut ?? '');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const apartment = apartments.find((a) => a.id === apartmentId);

  function fieldError(field: string): string | null {
    return errors.find((e) => e.field === field)?.message ?? null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    if (!apartment) {
      setServerError('Wybierz apartament');
      return;
    }

    const payload = {
      apartmentId,
      checkIn,
      checkOut,
      adults,
      children,
      fullName,
      email,
      phone: phone || undefined,
      message: message || undefined,
      consent,
    };

    const result = validateBookingInquiry(payload, apartment);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setPending(true);

    try {
      const res = await fetch('/api/booking-inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        const data = (await res.json()) as { id: string };
        router.push(`/booking/confirmation?ref=${data.id}`);
        return;
      }

      if (res.status === 400) {
        const data = (await res.json()) as { errors?: ValidationError[] };
        if (data.errors) setErrors(data.errors);
        else setServerError('Niepoprawne dane');
        setPending(false);
        return;
      }

      if (res.status === 409) {
        setServerError(
          'Wybrane terminy są już niedostępne. Wybierz inny przedział.',
        );
        setPending(false);
        return;
      }

      if (res.status === 429) {
        setServerError(
          'Zbyt wiele prób. Spróbuj ponownie za kilka minut.',
        );
        setPending(false);
        return;
      }

      setServerError('Wystąpił błąd. Spróbuj ponownie później.');
      setPending(false);
    } catch (err) {
      console.error(err);
      setServerError('Brak połączenia. Sprawdź internet i spróbuj ponownie.');
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="apartmentId"
          className="block text-sm font-medium text-cypress"
        >
          Apartament
        </label>
        <select
          id="apartmentId"
          value={apartmentId}
          onChange={(e) => setApartmentId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        >
          {apartments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} (do {a.maxGuests} {a.maxGuests === 1 ? 'gościa' : 'gości'})
            </option>
          ))}
        </select>
        {fieldError('apartmentId') && (
          <p className="mt-1 text-xs text-italian-red">{fieldError('apartmentId')}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="checkIn" className="block text-sm font-medium text-cypress">
            Przyjazd
          </label>
          <input
            id="checkIn"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
          {fieldError('checkIn') && (
            <p className="mt-1 text-xs text-italian-red">{fieldError('checkIn')}</p>
          )}
        </div>
        <div>
          <label htmlFor="checkOut" className="block text-sm font-medium text-cypress">
            Wyjazd
          </label>
          <input
            id="checkOut"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
          {fieldError('checkOut') && (
            <p className="mt-1 text-xs text-italian-red">{fieldError('checkOut')}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="adults" className="block text-sm font-medium text-cypress">
            Dorośli
          </label>
          <input
            id="adults"
            type="number"
            min={1}
            max={apartment?.maxGuests ?? 8}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
          {fieldError('adults') && (
            <p className="mt-1 text-xs text-italian-red">{fieldError('adults')}</p>
          )}
        </div>
        <div>
          <label htmlFor="children" className="block text-sm font-medium text-cypress">
            Dzieci
          </label>
          <input
            id="children"
            type="number"
            min={0}
            max={apartment?.maxGuests ?? 8}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
          {fieldError('children') && (
            <p className="mt-1 text-xs text-italian-red">{fieldError('children')}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-cypress">
          Imię i nazwisko
        </label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
        {fieldError('fullName') && (
          <p className="mt-1 text-xs text-italian-red">{fieldError('fullName')}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-cypress">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
          {fieldError('email') && (
            <p className="mt-1 text-xs text-italian-red">{fieldError('email')}</p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-cypress">
            Telefon (opcjonalnie)
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-cypress">
          Wiadomość (opcjonalnie)
        </label>
        <textarea
          id="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-flag-white px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
      </div>

      <div className="rounded-lg bg-soft-green p-4">
        <label className="flex items-start gap-3 text-sm text-cypress">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 accent-italian-green"
          />
          <span>{consentText}</span>
        </label>
        {fieldError('consent') && (
          <p className="mt-1 text-xs text-italian-red">{fieldError('consent')}</p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red"
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-italian-green px-6 py-3 text-base font-semibold text-flag-white shadow-sm transition-colors hover:bg-cypress disabled:opacity-50"
      >
        {pending ? 'Wysyłanie...' : 'Wyślij zapytanie'}
      </button>

      <p className="text-xs text-muted">
        Zapytanie nie jest rezerwacją. Potwierdzenie otrzymasz mailem po
        weryfikacji terminu — bez płatności online.
      </p>
    </form>
  );
}
