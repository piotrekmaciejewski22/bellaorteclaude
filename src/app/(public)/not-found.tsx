import Link from 'next/link';
import { OrnamentSimple } from '@/components/public/decorative/Ornament';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="font-display text-7xl italic text-gold md:text-9xl">404</p>
      <OrnamentSimple className="mx-auto mt-2 h-3 w-32 text-gold" />
      <h1 className="heading-display mt-8 text-4xl text-ink md:text-5xl">
        Strona nie istnieje
      </h1>
      <p className="text-motto mt-3 text-lg">— pagina non trovata —</p>
      <p className="text-ui mt-6 text-cypress/85">
        Adres mógł się zmienić albo treść została przeniesiona. Wróć na stronę
        główną lub zobacz nasze apartamenty.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="border-2 border-olive bg-olive px-7 py-3 font-display text-base text-crema hover:bg-olive-deep"
        >
          <span className="text-gold-soft">·</span> Strona główna
        </Link>
        <Link
          href="/apartments"
          className="link-italic font-display italic text-terracotta hover:text-wine"
        >
          Zobacz apartamenty →
        </Link>
      </div>
    </div>
  );
}
