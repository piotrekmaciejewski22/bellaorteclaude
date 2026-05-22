/**
 * SectionDivider — separator pionowy w stylu magazynu. Wykorzystuje
 * Ornament + opcjonalne motto włoskie pod spodem.
 *
 * Przykładowe motta:
 *   "dolce far niente"
 *   "la dolce vita"
 *   "piano, piano"
 *   "casa è dove sei tu"
 */

import { Ornament } from './Ornament';

interface SectionDividerProps {
  motto?: string;
  className?: string;
}

export function SectionDivider({ motto, className }: SectionDividerProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 py-8 text-gold ${className ?? ''}`}
      aria-hidden="true"
    >
      <Ornament className="h-6 w-48 text-gold" />
      {motto && (
        <p className="text-motto text-base md:text-lg">— {motto} —</p>
      )}
    </div>
  );
}
