/**
 * StatusLegend — visual legend for the four day statuses on the public
 * availability calendar.
 *
 * Server Component. Mirrors the colour tokens used by `AvailabilityCalendar`.
 *
 * Wymagania pokryte: 7.
 */

const ITEMS = [
  { color: 'bg-soft-green border-italian-green text-italian-green', label: 'Wolne' },
  { color: 'bg-terracotta/15 border-terracotta text-terracotta', label: 'Oczekuje na potwierdzenie' },
  { color: 'bg-italian-red/15 border-italian-red text-italian-red', label: 'Zarezerwowane' },
  { color: 'bg-muted/15 border-muted text-muted', label: 'Zablokowane' },
] as const;

export function StatusLegend() {
  return (
    <ul
      className="flex flex-wrap gap-3"
      aria-label="Legenda statusów kalendarza"
    >
      {ITEMS.map(({ color, label }) => (
        <li
          key={label}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${color}`}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-2.5 w-2.5 rounded-full ${color
              .split(' ')
              .find((c) => c.startsWith('bg-')) ?? ''}`}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
