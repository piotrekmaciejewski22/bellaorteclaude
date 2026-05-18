/**
 * `/rome` — Rome hub.
 *
 * Wymagania pokryte: 18.
 */

import Link from 'next/link';
import { ArrowRight, Compass, Info, Map, Utensils } from 'lucide-react';

const ROME_LINKS = [
  {
    href: '/rome/itinerary',
    label: 'Jeden dzień w Rzymie',
    blurb: 'Plan poranek → wieczór z kolacją w Testaccio. Linkujemy do restauracji i atrakcji.',
    icon: Compass,
  },
  {
    href: '/rome/places',
    label: 'Atrakcje w Rzymie',
    blurb: 'Koloseum, Pantheon, Piazza Navona — z poradami praktycznymi.',
    icon: Map,
  },
  {
    href: '/rome/restaurants',
    label: 'Restauracje w Rzymie',
    blurb: 'Klasyki kuchni rzymskiej i miejsca, które naprawdę warto.',
    icon: Utensils,
  },
  {
    href: '/rome/info',
    label: 'Informacje praktyczne',
    blurb: 'Transport, bilety, godziny otwarcia, bezpieczeństwo.',
    icon: Info,
  },
] as const;

export default function RomePage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-eyebrow">Sekcja Rzym</p>
          <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
            Rzym jest godzinę pociągiem od Orte.
          </h1>
          <p className="text-ui mt-6 max-w-2xl text-cypress/80">
            Z Orte do Roma Termini jedziesz pociągiem 50 — 70 minut. Z naszego
            apartamentu na peron — 5 minut spacerem. To czyni z Rzymu wycieczkę
            jednodniową bez stresu.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/rome/itinerary"
              className="rounded-full bg-italian-green px-7 py-3 text-base font-semibold text-flag-white hover:bg-cypress"
            >
              Otwórz plan dnia
            </Link>
            <Link
              href="/useful-info"
              className="rounded-full border border-cypress/30 bg-flag-white px-7 py-3 text-base font-semibold text-cypress hover:border-italian-green hover:text-italian-green"
            >
              Informacje o pociągach
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <ul className="grid gap-6 md:grid-cols-2">
          {ROME_LINKS.map(({ href, label, blurb, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-flag-white p-6 transition-colors hover:border-italian-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-italian-green"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-soft-green text-italian-green">
                  <Icon size={20} />
                </span>
                <p className="font-display text-2xl text-ink">{label}</p>
                <p className="text-sm text-cypress/80">{blurb}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-italian-green">
                  Otwórz
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
