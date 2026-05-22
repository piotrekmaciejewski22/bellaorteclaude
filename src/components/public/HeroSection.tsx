/**
 * HeroSection — pełnoekranowa okładka magazynu BELLAORTE.
 *
 * Pełen kadr fotografii z tekstem nałożonym warstwą półprzezroczystego
 * gradientu. Wymiar minimum 80vh na desktopie. Włoska flaga jako
 * tricolore i pieczęć jako akcenty.
 */

import Link from 'next/link';
import Image from 'next/image';
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
    <section
      className="relative isolate flex min-h-[80vh] w-full items-end overflow-hidden border-b border-gold/30 bg-crema md:min-h-[88vh] lg:min-h-[92vh]"
      aria-label="BELLAORTE — strona główna"
    >
      {/* Pełnoekranowe tło ze zdjęciem */}
      <Image
        src={src}
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />

      {/* Gradient zacieniający dolną część dla czytelności tekstu */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(20, 30, 24, 0.15) 0%, rgba(20, 30, 24, 0.0) 30%, rgba(20, 30, 24, 0.45) 70%, rgba(20, 30, 24, 0.85) 100%)',
        }}
      />

      {/* Pieczęć w prawym górnym rogu — akcent */}
      <div className="pointer-events-none absolute right-6 top-6 hidden md:right-10 md:top-10 md:block">
        <BellaorteSeal size={140} className="text-flag-white/70" />
      </div>

      {/* Etykieta wydania w lewym górnym rogu */}
      <div className="absolute left-6 top-6 hidden items-center gap-3 md:left-10 md:top-10 md:flex">
        <span className="text-eyebrow text-flag-white/85">Wydanie I</span>
        <TricoloreRule size="md" />
        <span className="text-eyebrow text-flag-white/70">Sezon 2026</span>
      </div>

      {/* Treść hero — wyrównana do dołu */}
      <div className="relative z-0 mx-auto w-full max-w-6xl px-6 pb-12 pt-32 md:px-10 md:pb-16 md:pt-40 lg:pb-20">
        <p className="font-display text-2xl italic text-gold-soft md:text-3xl">
          Witaj w Bellaorte
        </p>

        <h1 className="heading-display mt-3 text-5xl text-flag-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-[96px] xl:text-[112px]">
          Dwa apartamenty <span className="italic text-gold-soft">w sercu</span> Tuscia.
        </h1>

        <p className="text-ui mt-7 max-w-2xl text-lg text-flag-white/95 drop-shadow md:text-xl">
          Kameralne wnętrza w średniowiecznym Orte. Spokój doliny Tybru,
          sąsiedztwo Bomarzo i Civita di Bagnoregio, godzina pociągiem
          do Rzymu.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/booking"
            className="group inline-flex items-center gap-3 border-2 border-gold-soft bg-olive px-8 py-4 font-display text-base text-crema shadow-warm transition-all hover:border-gold hover:bg-olive-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <span className="text-gold-soft">·</span>
            <span>Sprawdź dostępność</span>
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/apartments"
            className="link-italic font-display text-base italic text-flag-white drop-shadow hover:text-gold-soft"
          >
            Zobacz apartamenty
          </Link>
        </div>

        {/* Statystyki magazynowe pod CTA — w kolorze do tła */}
        <ul className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-flag-white/30 pt-8 text-flag-white/95">
          <li>
            <p className="font-display text-4xl text-gold-soft md:text-5xl">II</p>
            <p className="mt-1 text-eyebrow text-flag-white/80">Apartamenty</p>
          </li>
          <li>
            <p className="font-display text-4xl text-gold-soft md:text-5xl">60&apos;</p>
            <p className="mt-1 text-eyebrow text-flag-white/80">Pociąg do Rzymu</p>
          </li>
          <li>
            <p className="font-display text-4xl text-gold-soft md:text-5xl">∞</p>
            <p className="mt-1 text-eyebrow text-flag-white/80">Bez automatów</p>
          </li>
        </ul>

        {/* Caption magazynowy z bieżącą datą po polsku */}
        <p className="mt-10 font-display text-xs italic text-flag-white/60 md:text-sm">
          Widok centrum historycznego, Orte · {today}
        </p>
      </div>
    </section>
  );
}
