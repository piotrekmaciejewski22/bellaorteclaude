/**
 * `/admin` — admin dashboard.
 *
 * Server Component. Fetches counters for pending inquiries, pending
 * reviews, pending guest photos and the next 5 reservations.
 *
 * Wymagania pokryte: 27.
 */

import Link from 'next/link';
import { Mailbox, MessageSquare, ImageIcon, ArrowRight } from 'lucide-react';

import { createServerClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth/session';

export default async function AdminDashboard() {
  const session = await getAdminSession();
  const client = await createServerClient();

  const [pendingInquiries, pendingReviews, pendingPhotos, upcomingRes] = await Promise.all([
    client
      .from('booking_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    client
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    client
      .from('guest_photos')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    client
      .from('reservations')
      .select(
        'id, apartment_id, check_in, check_out, apartments:apartment_id (name)',
      )
      .eq('status', 'active')
      .gte('check_in', new Date().toISOString().slice(0, 10))
      .order('check_in', { ascending: true })
      .limit(5),
  ]);

  const cards = [
    {
      label: 'Zapytania do moderacji',
      count: pendingInquiries.count ?? 0,
      href: '/admin/reservations?status=pending',
      icon: Mailbox,
      tone: 'bg-soft-green text-italian-green',
    },
    {
      label: 'Opinie do moderacji',
      count: pendingReviews.count ?? 0,
      href: '/admin/reviews?status=pending',
      icon: MessageSquare,
      tone: 'bg-terracotta/10 text-terracotta',
    },
    {
      label: 'Zdjęcia do moderacji',
      count: pendingPhotos.count ?? 0,
      href: '/admin/photos?status=pending',
      icon: ImageIcon,
      tone: 'bg-italian-red/10 text-italian-red',
    },
  ];

  type ReservationRow = {
    id: string;
    check_in: string;
    check_out: string;
    apartments: { name: string } | { name: string }[] | null;
  };

  function apartmentName(row: ReservationRow): string {
    const a = row.apartments;
    if (!a) return '';
    if (Array.isArray(a)) return a[0]?.name ?? '';
    return a.name;
  }

  return (
    <div>
      <header className="mb-10">
        <p className="text-eyebrow">Dashboard</p>
        <h1 className="heading-display mt-2 text-4xl text-ink">
          Cześć{session?.email ? `, ${session.email}` : ''}.
        </h1>
        <p className="text-ui mt-3 text-cypress/80">
          Tutaj zarządzasz BELLAORTE — moderujesz zapytania, kalendarz i treści.
        </p>
      </header>

      <section
        aria-label="Liczniki do moderacji"
        className="grid gap-4 md:grid-cols-3"
      >
        {cards.map(({ label, count, href, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-flag-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <span
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${tone}`}
            >
              <Icon size={22} />
            </span>
            <div>
              <p className="text-eyebrow">{label}</p>
              <p className="font-display text-3xl text-ink">{count}</p>
            </div>
            <ArrowRight
              size={18}
              className="ml-auto text-muted transition-transform group-hover:translate-x-1"
            />
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-eyebrow">Najbliższe rezerwacje</p>
            <h2 className="heading-section mt-1 text-2xl text-ink">
              Co potwierdzone i nadchodzące
            </h2>
          </div>
          <Link
            href="/admin/calendar"
            className="text-sm font-semibold text-italian-green hover:text-cypress"
          >
            Otwórz kalendarz →
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-flag-white">
          {upcomingRes.data && upcomingRes.data.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-soft-green text-cypress">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Apartament</th>
                  <th className="px-4 py-3 text-left font-medium">Przyjazd</th>
                  <th className="px-4 py-3 text-left font-medium">Wyjazd</th>
                </tr>
              </thead>
              <tbody>
                {(upcomingRes.data as ReservationRow[]).map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border text-cypress"
                  >
                    <td className="px-4 py-3">{apartmentName(row)}</td>
                    <td className="px-4 py-3">{row.check_in}</td>
                    <td className="px-4 py-3">{row.check_out}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-sm text-muted">
              Brak nadchodzących rezerwacji.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
