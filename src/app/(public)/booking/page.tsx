export const dynamic = 'force-dynamic';

import { BookingForm } from '@/components/public/BookingForm';
import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
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
    <div className="bg-crema">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Rezerwacja</span>
          <TricoloreRule size="md" />
        </div>

        <h1 className="heading-display mt-5 text-4xl text-ink md:text-6xl">
          Wyślij <span className="italic text-olive">zapytanie</span>
        </h1>
        <p className="text-motto mt-3 text-lg md:text-xl">— prenotare il soggiorno —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Bez płatności online. Po wysłaniu zapytania odpowiemy ręcznie mailem
          z potwierdzeniem dostępności i instrukcją zameldowania.
        </p>

        <SectionDivider motto="vi aspettiamo" />

        <div className="border border-gold/30 bg-flag-white p-6 shadow-warm md:p-10">
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
