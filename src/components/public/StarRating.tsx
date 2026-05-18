/**
 * StarRating — read-only star display for reviews.
 *
 * Wymagania pokryte: 15, 17.
 */

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  outOf?: number;
  size?: number;
  showNumber?: boolean;
}

export function StarRating({
  value,
  outOf = 5,
  size = 14,
  showNumber = false,
}: StarRatingProps) {
  const rounded = Math.round(value);
  return (
    <div
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`Ocena ${value.toFixed(1)} z ${outOf}`}
    >
      {Array.from({ length: outOf }).map((_, idx) => (
        <Star
          key={idx}
          size={size}
          className={
            idx < rounded
              ? 'fill-italian-green text-italian-green'
              : 'text-muted/40'
          }
          aria-hidden="true"
        />
      ))}
      {showNumber && (
        <span className="ml-1 text-xs font-semibold text-cypress">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
