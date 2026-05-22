/**
 * BellaorteSeal — okrągła pieczęć BELLAORTE w stylu sygnatury butelki wina.
 *
 * Wewnętrzny krąg z monogramem "BO" przeplecionym, zewnętrzny pierścień z
 * tekstem "BELLAORTE · ESTABLISHED MMXXVI · ORTE · LAZIO" wpisanym w łuk.
 *
 * Renderuje się jako single SVG, kolor dziedziczy z `currentColor`.
 */

interface BellaorteSealProps {
  size?: number;
  className?: string;
}

export function BellaorteSeal({ size = 140, className }: BellaorteSealProps) {
  const id = 'bellaorte-seal-circle';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <path
          id={id}
          d="M 70,70 m -52,0 a 52,52 0 1,1 104,0 a 52,52 0 1,1 -104,0"
        />
      </defs>

      {/* Zewnętrzne dwa cienkie pierścienie */}
      <circle
        cx="70"
        cy="70"
        r="68"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
      />
      <circle
        cx="70"
        cy="70"
        r="58"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
      />

      {/* Tekst wzdłuż łuku */}
      <text
        fill="currentColor"
        fontFamily="serif"
        fontSize="7"
        letterSpacing="2.5"
        fontWeight="500"
      >
        <textPath xlinkHref={`#${id}`} startOffset="0%">
          BELLAORTE · ORTE · LAZIO · ITALIA · ESTABLISHED MMXXVI · BELLAORTE · ORTE · LAZIO · ITALIA · ESTABLISHED MMXXVI ·
        </textPath>
      </text>

      {/* Wewnętrzny pierścień */}
      <circle
        cx="70"
        cy="70"
        r="42"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
      />

      {/* Małe ozdobne diamenty co 90° */}
      <g fill="currentColor">
        <path d="M 70,18 L 73,25 L 70,32 L 67,25 Z" />
        <path d="M 122,70 L 115,73 L 108,70 L 115,67 Z" />
        <path d="M 70,122 L 67,115 L 70,108 L 73,115 Z" />
        <path d="M 18,70 L 25,67 L 32,70 L 25,73 Z" />
      </g>

      {/* Monogram BO w środku — jak ligatura na pieczęci */}
      <g fill="currentColor">
        {/* B */}
        <text
          x="70"
          y="80"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="36"
          fontWeight="500"
          fontStyle="italic"
          letterSpacing="-2"
        >
          B
        </text>
        {/* O zaplecione */}
        <text
          x="70"
          y="80"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="36"
          fontWeight="500"
          fontStyle="italic"
          letterSpacing="-2"
          opacity="0.55"
          dx="14"
        >
          O
        </text>
      </g>

      {/* Mała gałązka oliwna pod monogramem */}
      <g stroke="currentColor" strokeWidth="0.6" fill="none" strokeLinecap="round">
        <path d="M 56 92 Q 70 88, 84 92" />
      </g>
      <g fill="currentColor" opacity="0.7">
        <ellipse cx="62" cy="91" rx="2.5" ry="1.2" transform="rotate(-15 62 91)" />
        <ellipse cx="70" cy="89.5" rx="2.5" ry="1.2" />
        <ellipse cx="78" cy="91" rx="2.5" ry="1.2" transform="rotate(15 78 91)" />
      </g>
    </svg>
  );
}
