/**
 * `/admin/reservations` — list of inquiries and reservations.
 *
 * Server Component. Loads pending/confirmed inquiries and active
 * reservations, then renders the client `ReservationTable` for actions.
 *
 * Wymagania pokryte: 30.
 */

import { createServerClient } from '@/lib/supabase/server';
import { ReservationTable } from '@/components/admin/ReservationTable';

interface InquiryRow {
  id: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  adminNote: string | null;
}

export default async function AdminReservationsPage() {
  const client = await createServerClient();

  const { data, error } = await client
    .from('booking_inquiries')
    .select(
      'id, check_in, check_out, adults, children, guest_full_name, guest_email, guest_phone, message, status, admin_note, created_at, apartments:apartment_id (name)',
    )
    .order('created_at', { ascending: false });

  type Joined = {
    id: string;
    check_in: string;
    check_out: string;
    adults: number;
    children: number;
    guest_full_name: string;
    guest_email: string;
    guest_phone: string | null;
    message: string | null;
    status: string;
    admin_note: string | null;
    created_at: string;
    apartments: { name: string } | { name: string }[] | null;
  };

  const rows: InquiryRow[] = error
    ? []
    : (data as Joined[]).map((row) => {
        const a = row.apartments;
        const apartmentName = !a
          ? ''
          : Array.isArray(a)
          ? a[0]?.name ?? ''
          : a.name;
        return {
          id: row.id,
          apartmentName,
          checkIn: row.check_in,
          checkOut: row.check_out,
          adults: row.adults,
          children: row.children,
          guestFullName: row.guest_full_name,
          guestEmail: row.guest_email,
          guestPhone: row.guest_phone,
          message: row.message,
          status: row.status,
          createdAt: row.created_at,
          adminNote: row.admin_note,
        };
      });

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">Zapytania i rezerwacje</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">
          Moderacja zapytań
        </h1>
        <p className="text-ui mt-2 text-cypress/80">
          Zatwierdź lub odrzuć każde zapytanie. Po zatwierdzeniu termin
          zostaje zarezerwowany w kalendarzu publicznym.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-4 py-3 text-sm text-italian-red">
          Nie udało się pobrać zapytań: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-border bg-flag-white p-8 text-center text-sm text-muted">
          Brak zapytań.
        </p>
      ) : (
        <ReservationTable rows={rows} />
      )}
    </div>
  );
}
