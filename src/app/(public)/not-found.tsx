/**
 * 404 page for the public site.
 *
 * Wymaganie 3 (404 z linkami nawigacyjnymi).
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-eyebrow">404</p>
      <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
        Strona nie istnieje
      </h1>
      <p className="text-ui mt-4 text-cypress/80">
        Możliwe, że adres jest nieaktualny albo treść została przeniesiona.
        Wróć na stronę główną lub zobacz apartamenty.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-italian-green px-6 py-3 text-sm font-semibold text-flag-white hover:bg-cypress"
        >
          Strona główna
        </Link>
        <Link
          href="/apartments"
          className="rounded-full border border-cypress/30 bg-flag-white px-6 py-3 text-sm font-semibold text-cypress hover:border-italian-green hover:text-italian-green"
        >
          Apartamenty
        </Link>
      </div>
    </div>
  );
}
