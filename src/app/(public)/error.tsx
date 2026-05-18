"use client";

/**
 * Error boundary for the public site.
 *
 * Logs the error server-side via Next.js streaming + console.error and
 * shows a friendly fallback. Wymaganie 3.
 */

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Public site error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-eyebrow">Błąd</p>
      <h1 className="heading-display mt-2 text-4xl text-ink md:text-5xl">
        Coś poszło nie tak
      </h1>
      <p className="text-ui mt-4 text-cypress/80">
        Spróbuj odświeżyć stronę. Jeżeli problem się powtarza, skontaktuj się
        z nami pod adresem podanym w stopce.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-italian-green px-6 py-3 text-sm font-semibold text-flag-white hover:bg-cypress"
        >
          Spróbuj ponownie
        </button>
        <Link
          href="/"
          className="rounded-full border border-cypress/30 bg-flag-white px-6 py-3 text-sm font-semibold text-cypress hover:border-italian-green hover:text-italian-green"
        >
          Strona główna
        </Link>
      </div>
    </div>
  );
}
