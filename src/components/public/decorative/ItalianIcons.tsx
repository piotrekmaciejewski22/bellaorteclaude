/**
 * Włoskie ikony — ręcznie rysowane SVG zamiast generycznych lucide.
 *
 * - Aqueduct: akwedukt rzymski (Rzym)
 * - Tower: średniowieczna wieża z dzwonem (Orte / apartamenty)
 * - Cypress: cyprysy w polu (przewodnik / okolica)
 * - Amphora: amfora (restauracje)
 * - OliveBranch: gałązka oliwna (galeria / wasze zdjęcia)
 * - RomanArch: łuk rzymski (sekcja Rzym)
 *
 * Wszystkie kolor dziedziczą z `currentColor`. Używamy `aria-hidden`
 * bo to są dekoracje — sens niesie label tekstowy obok.
 */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Akwedukt rzymski — 4 łuki na kolumnach. */
export function AqueductIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M 1 19 L 23 19" />
      <path d="M 3 19 L 3 12 Q 3 8, 6 8 Q 9 8, 9 12 L 9 19" />
      <path d="M 9 19 L 9 12 Q 9 8, 12 8 Q 15 8, 15 12 L 15 19" />
      <path d="M 15 19 L 15 12 Q 15 8, 18 8 Q 21 8, 21 12 L 21 19" />
      <path d="M 1 8 L 23 8" />
      <path d="M 1 8 L 1 5 L 23 5 L 23 8" />
      <circle cx="6" cy="14" r="0.5" fill="currentColor" />
      <circle cx="12" cy="14" r="0.5" fill="currentColor" />
      <circle cx="18" cy="14" r="0.5" fill="currentColor" />
    </Base>
  );
}

/** Średniowieczna wieża — kwadratowa z dzwonem. */
export function TowerIcon(props: IconProps) {
  return (
    <Base {...props}>
      {/* Trzon wieży */}
      <path d="M 6 22 L 6 8 L 18 8 L 18 22" />
      {/* Drzwi */}
      <path d="M 10 22 L 10 17 Q 10 15, 12 15 Q 14 15, 14 17 L 14 22" />
      {/* Okno */}
      <rect x="10" y="11" width="4" height="3" />
      {/* Blanki */}
      <path d="M 6 8 L 6 6 L 8 6 L 8 8" />
      <path d="M 10 8 L 10 6 L 14 6 L 14 8" />
      <path d="M 16 8 L 16 6 L 18 6 L 18 8" />
      {/* Dzwonnica */}
      <path d="M 9 6 L 9 3 L 15 3 L 15 6" />
      <path d="M 12 3 L 12 1" />
    </Base>
  );
}

/** Cyprysy — trzy charakterystyczne stożkowate drzewa. */
export function CypressIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M 1 22 L 23 22" />
      {/* Lewy cyprys */}
      <path d="M 5 22 L 5 18 Q 5 6, 6 6 Q 7 6, 7 18 L 7 22" />
      <path d="M 6 6 L 6 4" />
      {/* Środkowy — wyższy */}
      <path d="M 11 22 L 11 16 Q 11 3, 12 3 Q 13 3, 13 16 L 13 22" />
      <path d="M 12 3 L 12 1" />
      {/* Prawy */}
      <path d="M 17 22 L 17 18 Q 17 7, 18 7 Q 19 7, 19 18 L 19 22" />
      <path d="M 18 7 L 18 5" />
    </Base>
  );
}

/** Amfora — klasyczne naczynie z dwoma uchami. */
export function AmphoraIcon(props: IconProps) {
  return (
    <Base {...props}>
      {/* Brzusiec */}
      <path d="M 7 9 Q 5 13, 6 17 Q 7 22, 12 22 Q 17 22, 18 17 Q 19 13, 17 9" />
      {/* Szyjka */}
      <path d="M 9 9 L 9 6 L 15 6 L 15 9" />
      {/* Kołnierz */}
      <path d="M 8 6 L 16 6" />
      <path d="M 9 4 L 15 4" />
      {/* Ucha */}
      <path d="M 9 7 Q 6 7, 6 10" />
      <path d="M 15 7 Q 18 7, 18 10" />
      {/* Ornament środek */}
      <path d="M 9 14 L 15 14" strokeDasharray="1 1" />
    </Base>
  );
}

/** Gałązka oliwna z liśćmi i jedną oliwką. */
export function OliveBranchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M 4 12 Q 12 8, 20 12" />
      {/* Liście */}
      <path d="M 6 11 Q 6 8, 9 9" fill="currentColor" fillOpacity="0.3" />
      <path d="M 10 9 Q 10 6, 13 7" fill="currentColor" fillOpacity="0.3" />
      <path d="M 14 8 Q 14 11, 17 10" fill="currentColor" fillOpacity="0.3" />
      <path d="M 8 14 Q 8 17, 11 16" fill="currentColor" fillOpacity="0.3" />
      <path d="M 12 15 Q 12 18, 15 17" fill="currentColor" fillOpacity="0.3" />
      {/* Oliwka */}
      <ellipse cx="19" cy="13" rx="1.5" ry="2" fill="currentColor" />
    </Base>
  );
}

/** Łuk rzymski (Triumphalis) — pełny łuk z architrawem. */
export function RomanArchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M 2 22 L 22 22" />
      <path d="M 2 22 L 2 8 L 22 8 L 22 22" />
      <path d="M 5 22 L 5 12 Q 5 6, 12 6 Q 19 6, 19 12 L 19 22" />
      {/* Architraw — gzyms */}
      <path d="M 1 5 L 23 5" />
      <path d="M 1 3 L 23 3" />
      {/* Zwornik */}
      <path d="M 11 6 L 13 6 L 12 8 Z" fill="currentColor" />
      {/* Detal po bokach */}
      <circle cx="3" cy="14" r="0.4" fill="currentColor" />
      <circle cx="21" cy="14" r="0.4" fill="currentColor" />
    </Base>
  );
}

/** Słońce toskańskie — promienie + środek. Używamy w pasku kontekstu. */
export function TuscanSunIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.3" />
      <circle cx="12" cy="12" r="3.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 12 + Math.cos(rad) * 5;
        const y1 = 12 + Math.sin(rad) * 5;
        const x2 = 12 + Math.cos(rad) * 8;
        const y2 = 12 + Math.sin(rad) * 8;
        return <path key={angle} d={`M ${x1} ${y1} L ${x2} ${y2}`} />;
      })}
    </Base>
  );
}
