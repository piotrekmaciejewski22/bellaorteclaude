/**
 * `/admin/faq` — zarządzanie sekcją FAQ.
 *
 * Inline edytor: dodaj nowe pytanie, edytuj odpowiedź, ustaw kolejność,
 * publikuj/odznacz, usuń.
 */

import { createServerClient } from '@/lib/supabase/server';
import { getFaqItems } from '@/lib/data/faq';
import { FaqAdmin } from '@/components/admin/FaqAdmin';

export default async function AdminFaqPage() {
  const client = await createServerClient();
  const items = await getFaqItems(client, { includeUnpublished: true }).catch(() => []);

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">FAQ</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">
          Najczęściej zadawane pytania
        </h1>
      </header>
      <FaqAdmin initialItems={items} />
    </div>
  );
}
