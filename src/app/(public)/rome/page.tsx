export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowRight, Train } from 'lucide-react';

import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { RomanBadge } from '@/components/public/decorative/RomanBadge';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { AqueductIcon, RomanArchIcon, AmphoraIcon, TuscanSunIcon } from '@/components/public/decorative/ItalianIcons';

const ROME_LINKS = [
  {
    href: '/rome/itinerary',
    label: 'Jeden dzień w Rzymie',
    blurb: 'Plan dnia od poranku do wieczoru, z kolacją w Testaccio. Linkujemy do restauracji i atrakcji.',
    Icon: RomanArchIcon,
    roman: 'I' as const,
  },
  {
    href: '/rome/places',
    label: 'Atrakcje',
    blurb: 'Koloseum, Pantheon, Piazza Navona — z poradami praktycznymi.',
    Icon: AqueductIcon,
    roman: 'II' as const,
  },
  {
    href: '/rome/restaurants',
    label: 'Restauracje',
    blurb: 'Klasyki kuchni rzymskiej i miejsca, które naprawdę warto.',
    Icon: AmphoraIcon,
    roman: 'III' as const,
  },
  {
    href: '/rome/info',
    label: 'Informacje praktyczne',
    blurb: 'Transport, bilety, godziny otwarcia, bezpieczeństwo.',
    Icon: TuscanSunIcon,
    roman: 'IV' as const,
  },
] as const;

export default function RomePage() {
  return (
    <div className="bg-crema">
      <section className="relative isolate border-b border-gold/30">
        {/* Symbol Rzymu — łuk w tle */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-10 -z-10">
          <RomanArchIcon size={420} className="text-gold/15" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-center gap-3">
            <span className="text-eyebrow text-gold">Sezon · Rzym</span>
            <TricoloreRule size="md" />
          </div>
          <h1 className="heading-display mt-5 text-5xl text-ink md:text-7xl lg:text-8xl">
            Rzym jest <span className="italic text-olive">godzinę</span> stąd
          </h1>
          <p className="text-motto mt-3 text-lg md:text-xl">— Roma, una vita non basta —</p>

          <p className="text-ui mt-6 max-w-2xl text-cypress/85">
            Z Orte do Roma Termini jedziesz pociągiem 50—70 minut. Z naszego
            apartamentu na peron — 5 minut spacerem. To czyni z Rzymu wycieczkę
            jednodniową bez stresu.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/rome/itinerary"
              className="group inline-flex items-center gap-3 border-2 border-olive bg-olive px-7 py-3 font-display text-base text-crema shadow-warm hover:bg-olive-deep"
            >
              <span className="text-gold-soft">·</span>
              <span>Plan dnia w Rzymie</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/useful-info"
              className="link-italic inline-flex items-center gap-2 font-display italic text-terracotta hover:text-wine"
            >
              <Train size={16} /> Pociągi z Orte
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider motto="quattro vie a Roma" />

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <ul className="grid gap-6 md:grid-cols-2">
          {ROME_LINKS.map(({ href, label, blurb, Icon, roman }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-4 border border-gold/30 bg-flag-white p-7 transition-all hover:border-gold hover:shadow-warm-lg"
              >
                <div className="flex items-center justify-between">
                  <RomanBadge numeral={roman} size="md" variant="gold" />
                  <Icon size={32} className="text-olive" />
                </div>
                <p className="font-display text-3xl text-ink">{label}</p>
                <p className="text-sm text-cypress/80">{blurb}</p>
                <span className="mt-auto inline-flex items-center gap-1 font-display italic text-terracotta">
                  Otwórz <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
