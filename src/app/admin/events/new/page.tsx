import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { EventEditor } from '@/components/admin/EventEditor';

export default function NewEventPage() {
  return (
    <div>
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
      >
        <ArrowLeft size={14} /> Powrót do listy
      </Link>
      <header className="my-6">
        <p className="text-eyebrow">Nowy wpis</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">
          Dodaj wydarzenie albo polecenie sezonowe
        </h1>
      </header>
      <EventEditor />
    </div>
  );
}
