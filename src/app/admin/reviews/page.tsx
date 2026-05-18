/**
 * `/admin/reviews` — review moderation queue.
 *
 * Wymagania pokryte: 35.
 */

import { createServerClient } from '@/lib/supabase/server';
import { ReviewModerationQueue } from '@/components/admin/ReviewModerationQueue';

export default async function AdminReviewsPage() {
  const client = await createServerClient();

  const { data, error } = await client
    .from('reviews')
    .select(
      'id, signature, rating, body, status, created_at, restaurant_id, attraction_id, restaurants:restaurant_id (name), attractions:attraction_id (name)',
    )
    .order('created_at', { ascending: false });

  type Joined = {
    id: string;
    signature: string;
    rating: number;
    body: string;
    status: string;
    created_at: string;
    restaurant_id: string | null;
    attraction_id: string | null;
    restaurants: { name: string } | { name: string }[] | null;
    attractions: { name: string } | { name: string }[] | null;
  };

  function nameOf(rel: Joined['restaurants'] | Joined['attractions']): string {
    if (!rel) return '';
    if (Array.isArray(rel)) return rel[0]?.name ?? '';
    return rel.name;
  }

  const rows = error
    ? []
    : (data as Joined[]).map((row) => ({
        id: row.id,
        signature: row.signature,
        rating: row.rating,
        body: row.body,
        status: row.status,
        createdAt: row.created_at,
        targetType: (row.restaurant_id ? 'restaurant' : 'attraction') as
          | 'restaurant'
          | 'attraction',
        targetName: row.restaurant_id ? nameOf(row.restaurants) : nameOf(row.attractions),
      }));

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">Moderacja</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Opinie</h1>
        <p className="text-ui mt-2 text-cypress/80">
          Zatwierdź, odrzuć lub ukryj opinie zgłoszone przez gości. Zatwierdzone
          opinie pojawiają się publicznie na stronach restauracji i atrakcji.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          Nie udało się pobrać opinii: {error.message}
        </p>
      ) : (
        <ReviewModerationQueue rows={rows} />
      )}
    </div>
  );
}
