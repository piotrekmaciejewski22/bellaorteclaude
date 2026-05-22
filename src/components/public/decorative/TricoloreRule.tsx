/**
 * TricoloreRule — flaga włoska jako delikatny separator graficzny.
 *
 * Trzy pionowe paski (zieleń włoska, kremowe ivory, terakota) w bardzo
 * cienkiej formie. Używamy zamiast korporacyjnego paska kolorów —
 * elegancko sygnalizuje "Italia" bez krzyczącego emoji.
 */

interface TricoloreRuleProps {
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TricoloreRule({
  variant = 'horizontal',
  size = 'md',
  className,
}: TricoloreRuleProps) {
  const sizeClass =
    variant === 'horizontal'
      ? size === 'sm'
        ? 'h-0.5 w-12'
        : size === 'md'
          ? 'h-1 w-16'
          : 'h-1.5 w-24'
      : size === 'sm'
        ? 'w-0.5 h-12'
        : size === 'md'
          ? 'w-1 h-16'
          : 'w-1.5 h-24';

  if (variant === 'horizontal') {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex overflow-hidden ${sizeClass} ${className ?? ''}`}
      >
        <span className="block flex-1 bg-olive" />
        <span className="block flex-1 bg-crema" />
        <span className="block flex-1 bg-terracotta" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex flex-col overflow-hidden ${sizeClass} ${className ?? ''}`}
    >
      <span className="block flex-1 bg-olive" />
      <span className="block flex-1 bg-crema" />
      <span className="block flex-1 bg-terracotta" />
    </span>
  );
}
