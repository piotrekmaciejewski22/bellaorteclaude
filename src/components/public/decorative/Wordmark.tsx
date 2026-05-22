/**
 * Wordmark — sygnatura BELLAORTE w stylu magazynowym.
 *
 * Trzy warianty:
 *   - vertical: BELLA (pierwszy wiersz) ORTE (drugi) — do kart, stopek
 *   - inline: BELLA·ORTE w jednej linii — do nagłówków
 *   - signature: pisana kursywą "Bellaorte" — do akcentów
 */

interface WordmarkProps {
  variant?: 'inline' | 'vertical' | 'signature';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'dark' | 'light';
  className?: string;
}

const SIZE_CLASSES_INLINE = {
  sm: 'text-base tracking-[0.2em]',
  md: 'text-xl tracking-[0.22em]',
  lg: 'text-2xl tracking-[0.24em]',
  xl: 'text-4xl tracking-[0.26em]',
} as const;

const SIZE_CLASSES_SIGNATURE = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-5xl',
  xl: 'text-7xl',
} as const;

export function Wordmark({
  variant = 'inline',
  size = 'md',
  tone = 'dark',
  className,
}: WordmarkProps) {
  const toneOlive = tone === 'dark' ? 'text-olive' : 'text-soft-green';
  const toneTerracotta = tone === 'dark' ? 'text-terracotta' : 'text-terracotta-soft';
  const dotColor = tone === 'dark' ? 'text-gold' : 'text-gold-soft';

  if (variant === 'signature') {
    return (
      <span
        className={`heading-italic font-display italic ${SIZE_CLASSES_SIGNATURE[size]} ${toneOlive} ${className ?? ''}`}
      >
        Bellaorte
      </span>
    );
  }

  if (variant === 'vertical') {
    return (
      <span className={`flex flex-col leading-none ${className ?? ''}`}>
        <span
          className={`font-display font-medium ${SIZE_CLASSES_INLINE[size]} ${toneOlive}`}
        >
          BELLA
        </span>
        <span
          className={`font-display font-medium ${SIZE_CLASSES_INLINE[size]} ${toneTerracotta} -mt-0.5`}
        >
          ORTE
        </span>
      </span>
    );
  }

  // inline
  return (
    <span
      className={`inline-flex items-baseline font-display font-medium ${SIZE_CLASSES_INLINE[size]} ${className ?? ''}`}
    >
      <span className={toneOlive}>BELLA</span>
      <span className={`mx-1 ${dotColor}`}>·</span>
      <span className={toneTerracotta}>ORTE</span>
    </span>
  );
}
