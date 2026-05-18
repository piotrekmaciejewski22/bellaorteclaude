/**
 * `/booking/confirmation` — booking inquiry confirmation.
 *
 * Server Component. Reads `?ref=<inquiryId>` and shows a non-personal
 * summary. NEVER displays guest PII (Wym. 11, 42).
 *
 * Wymagania pokryte: 11.
 */

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { createServiceClient } from '@/lib/supabase/admin';

interface PageProps {
  searchParams: Promise<{ ref?: string }>;
}

interface InquirySummary {
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function loadSummary(ref: string | undefined): Promise<InquirySummary | null> {
  if (!ref || !UUID_RE.test(ref)) return null;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }
  try {
    const client = createServiceClient();
    const { data, error } = await client
      .from('booking_inquiries')
      .select(
        'check_in, check_out, adults, children, apartments:apartment_id (name)',
      )
      .eq('id', ref)
      .maybeSingle();
    if (error || !data) return null;
    type Joined = {
      check_in: string;
      check_out: string;
      adults: number;
      children: number;
      apartments: { name: string } | { name: string }[] | null;
    };
    const row = data as Joined;
    const a = row.apartments;
    const apartmentName = !a
      ? 'Apartament BELLAORTE'
      : Array.isArray(a)
      ? a[0]?.name ?? 'Apartament BELLAORTE'
      : a.name;
    return {
      apartmentName,
      checkIn: row.check_in,
      checkOut: row.check_out,
      adults: row.adults,
      children: row.children,
    };
  } catch {
    return null;
  }
}

export default async function BookingConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const summary = await loadSummary(params.ref);

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-soft-green text-italian-green">
          <CheckCircle2 size={32} />
        </div>

        <p className="text-eyebrow mt-6">Zapytanie wysłane</p>
        <h1 className="heading-display mt-2 text-4xl text-ink md:text-5xl">
          Dziękujemy.
        </h1>
        <p className="text-ui mt-4 text-cypress/80">
          Twoje zapytanie zostało zapisane. Termin wymaga ręcznego
          potwierdzenia — odpowiedź otrzymasz mailem zwykle w ciągu 24 godzin.
        </p>

        {summary && (
          <div className="mt-8 rounded-2xl border border-border bg-flag-white p-6 text-left">
            <p className="text-eyebrow">Podsumowanie zapytania</p>
            <dl className="mt-4 space-y-2 text-sm text-cypress">
              <div className="flex justify-between">
                <dt className="text-muted">Apartament</dt>
                <dd>{summary.apartmentName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Przyjazd</dt>
                <dd>{summary.checkIn}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Wyjazd</dt>
                <dd>{summary.checkOut}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Goście</dt>
                <dd>
                  {summary.adults} {summary.adults === 1 ? 'dorosły' : 'dorosłych'}
                  {summary.children > 0 ? `, ${summary.children} dz.` : ''}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-italian-green px-6 py-3 text-sm font-semibold text-flag-white hover:bg-cypress"
          >
            Wróć na stronę główną
          </Link>
          <Link
            href="/apartments"
            className="rounded-full border border-cypress/30 bg-flag-white px-6 py-3 text-sm font-semibold text-cypress hover:border-italian-green hover:text-italian-green"
          >
            Zobacz apartamenty
          </Link>
        </div>
      </div>
    </div>
  );
}
