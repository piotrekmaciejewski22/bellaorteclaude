/**
 * TestimonialsSection — sekcja „Co mówią goście" na stronie głównej.
 *
 * Pokazuje 3 najnowsze zatwierdzone opinie ze wszystkich miejsc
 * (restauracje + atrakcje). Klik kafelka prowadzi na stronę miejsca.
 */

import Link from 'next/link';

import { StarRating } from '@/components/public/StarRating';
import { OrnamentSimple } from '@/components/public/decorative/Ornament';
import type { Review } from '@/lib/types';

interface TestimonialsSectionProps {
  reviews: Review[];
  // Mapy ID -> info do linku z miejscem (gdzie była opinia).
  restaurants: Map<string, { slug: string; name: string }>;
  attractions: Map<string, { slug: string; name: string }>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    month: 'long',
    year: 'numeric',
  });
}

export function TestimonialsSection({
  reviews,
  restaurants,
  attractions,
}: TestimonialsSectionProps) {
  if (reviews.length === 0) return null;

  return (
    <section
      className="border-y border-gold/30 bg-paper/40"
      aria-labelledby="opinie-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <p className="text-eyebrow text-gold">Opinie</p>
          <h2 id="opinie-heading" className="heading-section mt-3 text-4xl text-ink md:text-5xl">
            Co <span className="italic text-olive">mówią</span> goście
          </h2>
          <p className="text-motto mt-3 text-lg">— le voci dei nostri ospiti —</p>
          <OrnamentSimple className="mx-auto mt-6 h-3 w-32 text-gold" />
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.slice(0, 3).map((r) => {
            const target = r.restaurantId
              ? restaurants.get(r.restaurantId)
              : r.attractionId
                ? attractions.get(r.attractionId)
                : null;
            const href = r.restaurantId
              ? `/restaurants/${target?.slug ?? ''}`
              : r.attractionId
                ? `/places/${target?.slug ?? ''}`
                : null;

            const Card = (
              <article className="flex h-full flex-col gap-4 border border-gold/30 bg-flag-white p-6 shadow-warm transition-all hover:border-gold hover:shadow-warm-lg">
                <StarRating value={r.rating} size={16} showNumber />
                <blockquote className="font-display text-lg italic text-ink">
                  „{r.body.length > 180 ? `${r.body.slice(0, 180).trim()}…` : r.body}”
                </blockquote>
                <div className="mt-auto flex items-baseline justify-between border-t border-gold/20 pt-4 text-xs">
                  <p className="font-display text-cypress">
                    — {r.signature}
                  </p>
                  <p className="text-stone">{formatDate(r.createdAt)}</p>
                </div>
                {target && (
                  <p className="text-eyebrow text-gold">
                    {r.restaurantId ? 'Restauracja' : 'Atrakcja'} · {target.name}
                  </p>
                )}
              </article>
            );

            return (
              <li key={r.id} className="h-full">
                {href ? (
                  <Link href={href} className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                    {Card}
                  </Link>
                ) : (
                  Card
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
