"use client";

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
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="text-eyebrow text-gold">Błąd</p>
      <h1 className="heading-display mt-3 text-4xl text-ink md:text-5xl">
        Coś poszło <span className="italic text-terracotta">nie tak</span>
      </h1>
      <p className="text-motto mt-3 text-lg">— qualcosa è andato storto —</p>
      <p className="text-ui mt-6 text-cypress/85">
        Spróbuj odświeżyć stronę. Jeżeli problem się powtarza, skontaktuj się
        z nami pod adresem podanym w stopce.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="border-2 border-olive bg-olive px-7 py-3 font-display text-base text-crema hover:bg-olive-deep"
        >
          <span className="text-gold-soft">·</span> Spróbuj ponownie
        </button>
        <Link
          href="/"
          className="link-italic font-display italic text-terracotta hover:text-wine"
        >
          Strona główna →
        </Link>
      </div>
    </div>
  );
}
