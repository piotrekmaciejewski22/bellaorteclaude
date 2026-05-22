export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { OrnamentSimple } from '@/components/public/decorative/Ornament';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
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
    <div className="bg-crema">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-gold bg-flag-white text-olive">
          <CheckCircle2 size={36} strokeWidth={1.5} />
        </div>

        <OrnamentSimple className="mx-auto mt-6 h-3 w-32 text-gold" />

        <p className="text-eyebrow mt-6 text-gold">Zapytanie wysłane</p>
        <h1 className="heading-display mt-3 text-4xl text-ink md:text-5xl">
          Dziękujemy <span className="italic text-terracotta">serdecznie</span>
        </h1>
        <p className="text-motto mt-3 text-lg">— grazie di cuore —</p>

        <p className="text-ui mt-6 text-cypress/85">
          Twoje zapytanie zostało zapisane. Termin wymaga ręcznego
          potwierdzenia — odpowiedź otrzymasz mailem zwykle w ciągu 24 godzin.
        </p>

        {summary && (
          <div className="mt-10 border border-gold/40 bg-flag-white p-7 text-left shadow-warm">
            <div className="flex items-center justify-between">
              <p className="text-eyebrow text-gold">Podsumowanie</p>
              <TricoloreRule size="sm" />
            </div>
            <dl className="mt-4 space-y-3 text-sm text-cypress">
              <div className="flex justify-between border-b border-gold/20 pb-2">
                <dt className="text-stone">Apartament</dt>
                <dd className="font-display italic">{summary.apartmentName}</dd>
              </div>
              <div className="flex justify-between border-b border-gold/20 pb-2">
                <dt className="text-stone">Przyjazd</dt>
                <dd className="font-display">{summary.checkIn}</dd>
              </div>
              <div className="flex justify-between border-b border-gold/20 pb-2">
                <dt className="text-stone">Wyjazd</dt>
                <dd className="font-display">{summary.checkOut}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone">Goście</dt>
                <dd className="font-display">
                  {summary.adults} {summary.adults === 1 ? 'dorosły' : 'dorosłych'}
                  {summary.children > 0 ? `, ${summary.children} dz.` : ''}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="border-2 border-olive bg-olive px-7 py-3 font-display text-base text-crema hover:bg-olive-deep"
          >
            <span className="text-gold-soft">·</span> Strona główna
          </Link>
          <Link
            href="/blog"
            className="link-italic font-display italic text-terracotta hover:text-wine"
          >
            Zajrzyj na blog →
          </Link>
        </div>
      </div>
    </div>
  );
}
