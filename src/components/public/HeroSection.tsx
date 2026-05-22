/**
 * HeroSection — okładka magazynu BELLAORTE.
 *
 * Asymetria: lewa kolumna z typografią po polsku + włoski podtytuł
 * kursywą. Prawa kolumna ze zdjęciem opieczętowanym numerem rzymskim,
 * pieczęcią BELLAORTE jako watermark, podpisem "Veduta del centro
 * storico, Orte" jak w starym albumie fotograficznym.
 */

import Link from 'next/link';
import Image from 'next/image';
import { OrnamentSimple } from '@/components/public/decorative/Ornament';
import { RomanBadge } from '@/components/public/decorative/RomanBadge';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { BellaorteSeal } from '@/components/public/decorative/BellaorteSeal';

interface HeroSectionProps {
  imageUrl?: string | null;
}

const PL_MONTHS_GENITIVE = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];

function formatTodayPl(): string {
  const d = new Date();
  return `${d.getDate()} ${PL_MONTHS_GENITIVE[d.getMonth()]} ${d.getFullYear()}`;
}

export function HeroSection({ imageUrl }: HeroSectionProps = {}) {
  const src = imageUrl && imageUrl.length > 0 ? imageUrl : '/placeholders/hero.svg';
  const today = formatTodayPl();

  return (
    <section className="relative isolate overflow-hidden border-b border-gold/30 bg-crema">
      {/* Tło z subtelną teksturą */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 70% 30%, rgba(176, 138, 62, 0.08) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(184, 92, 56, 0.06) 0%, transparent 50%)',
        }}
      />

      {/* Pieczęć w tle, mocno wyciszona — element luksusowy */}
      <BellaorteSeal
        size={420}
        className="pointer-events-none absolute -right-20 -top-20 -z-10 text-gold/8 opacity-40"
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:py-24 lg:grid-cols-[1.1fr,1fr] lg:gap-16">
        {/* Lewa kolumna — typografia magazynowa */}
        <div className="relative">
          {/* Etykieta jak nagłówek wydania magazynu */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-eyebrow text-gold">Wydanie I</span>
            <TricoloreRule size="md" />
            <span className="text-eyebrow text-stone">Sezon 2026</span>
          </div>

          <p className="mt-7 font-display text-2xl italic text-terracotta md:text-3xl">
            Witaj w Bellaorte
          </p>

          <h1 className="heading-display mt-3 text-5xl text-ink sm:text-6xl md:text-7xl lg:text-[88px]">
            Dwa apartamenty <span className="italic text-olive">w sercu</span> Tuscia.
          </h1>

          <p className="text-ui mt-7 max-w-xl text-lg text-cypress/85 md:text-xl">
            Kameralne wnętrza w średniowiecznym Orte. Spokój doliny Tybru,
            sąsiedztwo Bomarzo i Civita di Bagnoregio, godzina pociągiem
            do Rzymu.
          </p>

          <p className="text-motto mt-3 text-base">
            Bez płatności online — odpowiadamy ręcznie, mailem.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/booking"
              className="group inline-flex items-center gap-3 border-2 border-olive bg-olive px-8 py-4 font-display text-base text-crema shadow-warm transition-all hover:border-olive-deep hover:bg-olive-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <span className="text-gold-soft">·</span>
              <span>Sprawdź dostępność</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/apartments"
              className="link-italic font-display text-base italic text-cypress hover:text-terracotta"
            >
              Zobacz apartamenty
            </Link>
          </div>

          {/* Statystyki magazynowe pod CTA */}
          <ul className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-gold/30 pt-8 text-cypress">
            <li>
              <p className="font-display text-4xl text-olive md:text-5xl">II</p>
              <p className="mt-1 text-eyebrow">Apartamenty</p>
            </li>
            <li>
              <p className="font-display text-4xl text-olive md:text-5xl">60'</p>
              <p className="mt-1 text-eyebrow">Pociąg do Rzymu</p>
            </li>
            <li>
              <p className="font-display text-4xl text-olive md:text-5xl">∞</p>
              <p className="mt-1 text-eyebrow">Bez automatów</p>
            </li>
          </ul>
        </div>

        {/* Prawa kolumna — fotografia z magazynowym framem */}
        <div className="relative mx-auto w-full max-w-xl">
          {/* Subtelny gold frame przesunięty */}
          <div
            aria-hidden="true"
            className="absolute -inset-3 -z-10 border border-gold/40 md:-inset-4"
          />
          {/* Numer rzymski wystający */}
          <div className="absolute -left-4 -top-6 z-10 hidden md:block">
            <RomanBadge numeral="I" size="lg" variant="gold" />
          </div>

          <div className="relative aspect-[4/5] overflow-hidden bg-paper">
            <Image
              src={src}
              alt=""
              fill
              priority
              unoptimized
              sizes="(min-width: 1024px) 540px, 100vw"
              className="object-cover"
            />
            {/* Subtelne ciepłe nakładkowanie */}
            <div
              aria-hidden="true"
              className="absolute inset-0 mix-blend-multiply"
              style={{
                background:
                  'linear-gradient(180deg, rgba(245,237,224,0) 60%, rgba(184,92,56,0.15) 100%)',
              }}
            />
          </div>

          {/* Caption magazynowy z bieżącą datą po polsku */}
          <p className="mt-5 flex items-center gap-3 font-display text-sm italic text-stone">
            <OrnamentSimple className="h-2 w-12 text-gold" />
            <span>Widok centrum historycznego, Orte · {today}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
