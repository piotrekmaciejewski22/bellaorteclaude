import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { createServerClient } from '@/lib/supabase/server';
import { EventEditor } from '@/components/admin/EventEditor';
import { publicSiteMediaUrl } from '@/lib/data/apartments';
import type { EventEntry } from '@/lib/data/events';

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface EventRow {
  id: string;
  kind: 'local' | 'seasonal';
  title: string;
  excerpt: string;
  body_md: string;
  start_date: string | null;
  end_date: string | null;
  display_period: string | null;
  hero_image_path: string | null;
  external_url: string | null;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const client = await createServerClient();
  const { data, error } = await client
    .from('events')
    .select(
      'id, kind, title, excerpt, body_md, start_date, end_date, display_period, hero_image_path, external_url, display_order, published_at, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) notFound();

  const row = data as EventRow;
  const eventEntry: EventEntry = {
    id: row.id,
    kind: row.kind,
    title: row.title,
    excerpt: row.excerpt,
    bodyMd: row.body_md,
    startDate: row.start_date,
    endDate: row.end_date,
    displayPeriod: row.display_period,
    heroImagePath: row.hero_image_path,
    externalUrl: row.external_url,
    displayOrder: row.display_order,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  const heroUrl = eventEntry.heroImagePath
    ? publicSiteMediaUrl(eventEntry.heroImagePath)
    : null;

  return (
    <div>
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
      >
        <ArrowLeft size={14} /> Powrót do listy
      </Link>
      <header className="my-6">
        <p className="text-eyebrow">
          Edycja {eventEntry.kind === 'local' ? 'wydarzenia' : 'polecenia sezonowego'}
        </p>
        <h1 className="heading-display mt-2 text-3xl text-ink">{eventEntry.title}</h1>
      </header>
      <EventEditor event={eventEntry} heroUrl={heroUrl} />
    </div>
  );
}
