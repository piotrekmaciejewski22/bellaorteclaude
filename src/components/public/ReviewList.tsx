/**
 * ReviewList — server-rendered list of approved reviews.
 *
 * Wymagania pokryte: 15, 17.
 */

import { StarRating } from './StarRating';
import type { Review } from '@/lib/types';

interface ReviewListProps {
  reviews: Review[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-flag-white p-6 text-sm text-muted">
        Nikt jeszcze nie zostawił opinii. Bądź pierwszy.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-2xl border border-border bg-flag-white p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-lg text-ink">{review.signature}</p>
            <StarRating value={review.rating} />
          </div>
          <p className="text-ui mt-2 whitespace-pre-line text-sm text-cypress/85">
            {review.body}
          </p>
          <p className="mt-3 text-xs text-muted">
            {formatDate(review.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
