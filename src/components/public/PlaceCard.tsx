/**
 * PlaceCard — card for restaurant or attraction in lists.
 *
 * Server Component. Reused for both restaurants (`type='restaurant'`)
 * and attractions (`type='attraction'`).
 *
 * Wymagania pokryte: 14, 16.
 */

import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

interface PlaceCardProps {
  type: 'restaurant' | 'attraction';
  slug: string;
  name: string;
  description: string;
  tags: string[];
  averageRating?: number | null;
  reviewCount?: number;
}

export function PlaceCard({
  type,
  slug,
  name,
  description,
  tags,
  averageRating,
  reviewCount,
}: PlaceCardProps) {
  const href = type === 'restaurant' ? `/restaurants/${slug}` : `/places/${slug}`;
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-border bg-flag-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <p className="text-eyebrow">
          {type === 'restaurant' ? 'Restauracja' : 'Atrakcja'}
        </p>
        <h3 className="heading-section mt-2 text-2xl text-ink">
          <Link
            href={href}
            className="hover:text-italian-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-italian-green"
          >
            {name}
          </Link>
        </h3>
      </div>

      <p className="text-ui mt-3 text-sm text-cypress/80 line-clamp-3">
        {description}
      </p>

      {tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-soft-green px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-italian-green"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        {averageRating !== null && averageRating !== undefined && reviewCount && reviewCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-cypress">
            <Star
              size={12}
              className="fill-italian-green text-italian-green"
              aria-hidden="true"
            />
            <strong>{averageRating.toFixed(1)}</strong>
            <span className="text-muted">
              ({reviewCount} {reviewCount === 1 ? 'opinia' : 'opinii'})
            </span>
          </span>
        ) : (
          <span className="text-xs text-muted">Brak ocen</span>
        )}
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
        >
          Szczegóły
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
