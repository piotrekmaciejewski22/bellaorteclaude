/**
 * PlaceCard — karta restauracji / atrakcji w stylu magazynowym.
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
    <article className="group flex h-full flex-col border border-gold/30 bg-flag-white p-6 shadow-warm transition-all hover:border-gold hover:shadow-warm-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="text-eyebrow text-gold">
          {type === 'restaurant' ? 'Restauracja' : 'Atrakcja'}
        </p>
        {averageRating !== null && averageRating !== undefined && reviewCount && reviewCount > 0 ? (
          <span className="inline-flex items-center gap-1 font-display text-xs text-cypress">
            <Star
              size={12}
              className="fill-gold text-gold"
              aria-hidden="true"
            />
            <strong className="font-medium">{averageRating.toFixed(1)}</strong>
          </span>
        ) : (
          <span className="font-display text-xs italic text-stone">brak ocen</span>
        )}
      </div>

      <h3 className="heading-section mt-3 text-2xl text-ink md:text-3xl">
        <Link
          href={href}
          className="transition-colors hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          {name}
        </Link>
      </h3>

      <p className="text-ui mt-3 line-clamp-3 text-sm text-cypress/85">
        {description}
      </p>

      {tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag) => (
            <li
              key={tag}
              className="border border-gold/30 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-stone"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-gold/20 pt-4">
        <Link
          href={href}
          className="link-italic inline-flex items-center gap-1 font-display italic text-terracotta hover:text-wine"
        >
          Szczegóły
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
