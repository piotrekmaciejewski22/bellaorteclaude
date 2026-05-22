/**
 * RomanBadge — kółko z liczbą rzymską w środku. Używamy do numerowania
 * sekcji (I, II, III) w stylu klasycznych książek włoskich.
 */

interface RomanBadgeProps {
  numeral: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gold' | 'olive' | 'terracotta';
}

const SIZE_CLASSES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
} as const;

const VARIANT_CLASSES = {
  gold: 'border-gold text-gold',
  olive: 'border-olive text-olive',
  terracotta: 'border-terracotta text-terracotta',
} as const;

export function RomanBadge({ numeral, size = 'md', variant = 'gold' }: RomanBadgeProps) {
  return (
    <span
      className={`badge-roman inline-flex items-center justify-center rounded-full border ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]}`}
      aria-hidden="true"
    >
      {numeral}
    </span>
  );
}

/** Helper: zamienia liczbę 1-10 na liczbę rzymską. */
export function toRoman(n: number): RomanBadgeProps['numeral'] {
  const map: Record<number, RomanBadgeProps['numeral']> = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
    6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
  };
  return map[n] ?? 'I';
}
