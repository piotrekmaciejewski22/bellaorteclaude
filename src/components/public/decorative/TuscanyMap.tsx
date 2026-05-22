/**
 * TuscanyMap — schematyczna mapa Lazio/Tuscia z pinami.
 *
 * Używamy jako tło-watermark albo dekoracyjny element w sekcji
 * lokalizacja. Nie pretenduje do dokładności kartograficznej — to
 * stylizowana ilustracja w duchu starych map z atlasów.
 */

interface TuscanyMapProps {
  className?: string;
  showLabels?: boolean;
}

export function TuscanyMap({ className, showLabels = true }: TuscanyMapProps) {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Kontur regionu — bardzo schematyczny */}
      <path
        d="M 50 80 Q 80 50, 130 60 Q 180 55, 220 80 Q 260 70, 290 100 Q 330 110, 350 140 Q 360 180, 330 210 Q 290 240, 240 240 Q 200 245, 160 230 Q 110 235, 80 200 Q 40 170, 45 130 Q 40 100, 50 80 Z"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 3"
        fill="currentColor"
        fillOpacity="0.04"
      />

      {/* Tyber jako rzeka — kreska wijąca się */}
      <path
        d="M 60 70 Q 100 100, 140 130 Q 180 150, 220 180 Q 260 210, 300 240"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />

      {/* Piny — diamenty, kółka, gwiazdki */}
      {/* Orte (centrum) */}
      <g transform="translate(180 140)">
        <path d="M 0 -8 L 6 0 L 0 8 L -6 0 Z" fill="currentColor" />
        <circle r="14" stroke="currentColor" strokeWidth="0.5" fill="none" />
        {showLabels && (
          <text
            x="10"
            y="3"
            fontFamily="serif"
            fontStyle="italic"
            fontSize="11"
            fill="currentColor"
          >
            Orte
          </text>
        )}
      </g>

      {/* Bomarzo */}
      <g transform="translate(140 110)">
        <circle r="3" fill="currentColor" />
        {showLabels && (
          <text
            x="6"
            y="3"
            fontFamily="serif"
            fontStyle="italic"
            fontSize="9"
            fill="currentColor"
            opacity="0.7"
          >
            Bomarzo
          </text>
        )}
      </g>

      {/* Civita di Bagnoregio */}
      <g transform="translate(110 90)">
        <circle r="3" fill="currentColor" />
        {showLabels && (
          <text
            x="-50"
            y="3"
            fontFamily="serif"
            fontStyle="italic"
            fontSize="9"
            fill="currentColor"
            opacity="0.7"
          >
            Civita
          </text>
        )}
      </g>

      {/* Viterbo */}
      <g transform="translate(120 150)">
        <circle r="3" fill="currentColor" />
        {showLabels && (
          <text
            x="-44"
            y="3"
            fontFamily="serif"
            fontStyle="italic"
            fontSize="9"
            fill="currentColor"
            opacity="0.7"
          >
            Viterbo
          </text>
        )}
      </g>

      {/* Roma — gwiazda */}
      <g transform="translate(280 220)">
        <path
          d="M 0 -10 L 2 -3 L 9 -3 L 4 1 L 6 8 L 0 4 L -6 8 L -4 1 L -9 -3 L -2 -3 Z"
          fill="currentColor"
        />
        {showLabels && (
          <text
            x="14"
            y="3"
            fontFamily="serif"
            fontSize="13"
            fontWeight="500"
            fill="currentColor"
          >
            Roma
          </text>
        )}
      </g>

      {/* Linia kolejowa Orte → Roma — kropki */}
      <path
        d="M 180 140 Q 220 175, 280 220"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="1 3"
        fill="none"
        opacity="0.5"
      />

      {/* Kompas / róża wiatrów w prawym górnym rogu */}
      <g transform="translate(370 30)" stroke="currentColor" strokeWidth="0.5" fill="none">
        <circle r="12" />
        <path d="M 0 -10 L 2 0 L 0 10 L -2 0 Z" fill="currentColor" />
        <path d="M -10 0 L 0 -2 L 10 0 L 0 2 Z" fill="currentColor" opacity="0.6" />
        <text
          x="0"
          y="-15"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="6"
          fill="currentColor"
        >
          N
        </text>
      </g>
    </svg>
  );
}
