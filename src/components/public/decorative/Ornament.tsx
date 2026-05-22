/**
 * Ornament — drobny ornament SVG w stylu starych książek.
 *
 * Używamy jako ozdobne separatory między sekcjami. SVG inline żeby kolor
 * dziedziczył z `currentColor` — łatwo dopasować do kontekstu.
 */

interface OrnamentProps {
  className?: string;
}

export function Ornament({ className }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 200 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Lewa kreska */}
      <line x1="0" y1="12" x2="70" y2="12" stroke="currentColor" strokeWidth="0.5" />
      {/* Diament centralny */}
      <path
        d="M100 4 L108 12 L100 20 L92 12 Z"
        stroke="currentColor"
        strokeWidth="0.7"
        fill="none"
      />
      {/* Małe punkty po bokach diamentu */}
      <circle cx="80" cy="12" r="1" fill="currentColor" />
      <circle cx="120" cy="12" r="1" fill="currentColor" />
      {/* Prawa kreska */}
      <line x1="130" y1="12" x2="200" y2="12" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

/**
 * OrnamentSimple — sama linia ze złotym diamentem w środku, bardziej
 * minimalistyczna od głównej.
 */
export function OrnamentSimple({ className }: OrnamentProps) {
  return (
    <svg viewBox="0 0 120 8" fill="none" aria-hidden="true" className={className}>
      <line x1="0" y1="4" x2="56" y2="4" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="60" cy="4" r="2" fill="currentColor" />
      <line x1="64" y1="4" x2="120" y2="4" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

/**
 * OrnamentLeaf — gałązka oliwna SVG, niewielka, dla detali sezonowych.
 */
export function OrnamentLeaf({ className }: OrnamentProps) {
  return (
    <svg viewBox="0 0 40 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2 8 Q8 2, 16 8 T30 8"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="8" cy="6" rx="3" ry="1.5" fill="currentColor" opacity="0.7" />
      <ellipse cx="16" cy="10" rx="3" ry="1.5" fill="currentColor" opacity="0.7" />
      <ellipse cx="24" cy="6" rx="3" ry="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="32" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}
