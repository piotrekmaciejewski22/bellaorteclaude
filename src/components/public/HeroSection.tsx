/**
 * HeroSection — top of the home page.
 *
 * Server Component. Tło ładuje się z `site_settings.hero_image_path`
 * (przez `publicSiteMediaUrl`). Jeśli admin nie wgrał własnego, używa
 * placeholderowego SVG.
 *
 * Wymaganie 1, 45.
 */

import Link from 'next/link';
import Image from 'next/image';

interface HeroSectionProps {
  imageUrl?: string | null;
}

export function HeroSection({ imageUrl }: HeroSectionProps = {}) {
  const src = imageUrl && imageUrl.length > 0 ? imageUrl : '/placeholders/hero.svg';

  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10">
        <Image
          src={src}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ivory/95 via-ivory/70 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <p className="text-eyebrow">Orte · Lacjum · Włochy</p>
        <h1 className="heading-display mt-3 max-w-3xl text-5xl text-ink md:text-6xl lg:text-7xl">
          Dwa apartamenty w sercu Orte, godzinę od Rzymu.
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-lg text-cypress md:text-xl">
          BELLAORTE to spokojna baza wypadowa po Lacjum: średniowieczne
          centrum, dolina Tybru, wieczorne kolacje przy świeczkach. Wybierz
          termin i prześlij zapytanie — odpowiadamy ręcznie, bez płatności
          online.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/booking"
            className="rounded-full bg-italian-green px-7 py-3 text-base font-semibold text-flag-white shadow-sm transition-colors hover:bg-cypress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-italian-green"
          >
            Sprawdź dostępność
          </Link>
          <Link
            href="/apartments"
            className="rounded-full border border-cypress/30 bg-flag-white px-7 py-3 text-base font-semibold text-cypress transition-colors hover:border-italian-green hover:text-italian-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-italian-green"
          >
            Zobacz apartamenty
          </Link>
        </div>

        <ul className="mt-14 grid max-w-3xl grid-cols-1 gap-6 text-sm text-cypress sm:grid-cols-3">
          <li>
            <p className="font-display text-3xl text-italian-green">2</p>
            <p className="mt-1">apartamenty z prywatnym wejściem</p>
          </li>
          <li>
            <p className="font-display text-3xl text-italian-green">60 min</p>
            <p className="mt-1">pociągiem z Orte do Rzymu</p>
          </li>
          <li>
            <p className="font-display text-3xl text-italian-green">0</p>
            <p className="mt-1">płatności online — kontakt mailowy</p>
          </li>
        </ul>
      </div>
    </section>
  );
}
