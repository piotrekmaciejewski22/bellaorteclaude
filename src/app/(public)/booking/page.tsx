/**
 * `/booking` — public Booking_Form page.
 *
 * Server Component. Loads apartments (Supabase or mock), reads pre-select
 * params from the query string, renders the client `BookingForm`.
 *
 * Wymagania pokryte: 9.
 */

import { BookingForm } from '@/components/public/BookingForm';
import { MOCK_APARTMENTS } from '@/lib/mock-data';
import { getApartments } from '@/lib/data/apartments';
import { createServerClient } from '@/lib/supabase/server';

interface PageProps {
  searchParams: Promise<{
    apartmentId?: string;
    checkIn?: string;
    checkOut?: string;
  }>;
}

const FALLBACK_CONSENT =
  'Wyrażam zgodę na przetwarzanie moich danych osobowych w celu obsługi zapytania rezerwacyjnego zgodnie z Polityką prywatności.';

export default async function BookingPage({ searchParams }: PageProps) {
  const params = await searchParams;

  let apartments: { id: string; name: string; maxGuests: number; slug: string }[] = [];
  let consentText = FALLBACK_CONSENT;

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const client = await createServerClient();
      const list = await getApartments(client);
      apartments = list.map((a) => ({
        id: a.id,
        name: a.name,
        maxGuests: a.maxGuests,
        slug: a.slug,
      }));

      const settings = await client
        .from('site_settings')
        .select('consent_text_booking')
        .eq('id', 1)
        .maybeSingle();
      if (settings.data?.consent_text_booking) {
        consentText = settings.data.consent_text_booking;
      }
    } catch (err) {
      console.warn('Supabase fetch failed, using mock:', err);
    }
  }

  if (apartments.length === 0) {
    apartments = MOCK_APARTMENTS.map((a) => ({
      id: a.id,
      name: a.name,
      maxGuests: a.maxGuests,
      slug: a.slug,
    }));
  }

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-eyebrow">Rezerwacja</p>
        <h1 className="heading-display mt-2 text-4xl text-ink md:text-5xl">
          Wyślij zapytanie o termin
        </h1>
        <p className="text-ui mt-4 max-w-2xl text-cypress/80">
          Bez płatności online. Po wysłaniu zapytania odpowiemy ręcznie mailem
          z potwierdzeniem dostępności i instrukcją zameldowania.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-flag-white p-6 md:p-8">
          <BookingForm
            apartments={apartments}
            preselectedApartmentId={params.apartmentId}
            preselectedCheckIn={params.checkIn}
            preselectedCheckOut={params.checkOut}
            consentText={consentText}
          />
        </div>
      </div>
    </div>
  );
}
