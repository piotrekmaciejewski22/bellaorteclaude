/**
 * `/admin/restaurants/new` — create a new restaurant.
 */

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { PlaceEditor } from '@/components/admin/PlaceEditor';

export default function NewRestaurantPage() {
  return (
    <div>
      <Link
        href="/admin/restaurants"
        className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
      >
        <ArrowLeft size={14} /> Powrót do listy
      </Link>
      <header className="my-6">
        <p className="text-eyebrow">Nowa restauracja</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Dodaj restaurację</h1>
      </header>
      <PlaceEditor mode={{ kind: 'restaurant' }} />
    </div>
  );
}
