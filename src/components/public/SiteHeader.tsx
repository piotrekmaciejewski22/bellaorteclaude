/**
 * SiteHeader — w stylu okładki magazynu, ale po polsku.
 *
 * Włoska flaga w postaci delikatnego paska tricolore pod sygnaturą jako
 * jedyny włoski akcent w nawigacji. Wszystkie linki po polsku.
 */

import Link from "next/link";
import { MobileNav } from "@/components/public/MobileNav";
import { Wordmark } from "@/components/public/decorative/Wordmark";
import { TricoloreRule } from "@/components/public/decorative/TricoloreRule";

const NAV_LINKS = [
  { href: "/apartments", label: "Apartamenty" },
  { href: "/guide", label: "Przewodnik" },
  { href: "/wydarzenia", label: "Wydarzenia" },
  { href: "/mapa", label: "Mapa" },
  { href: "/blog", label: "Blog" },
  { href: "/wasze-zdjecia", label: "Wasze zdjęcia" },
  { href: "/dla-gosci", label: "Dla gości" },
  { href: "/rome", label: "Rzym" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-crema/95 backdrop-blur supports-[backdrop-filter]:bg-crema/85">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-6">
        {/* Sygnatura — magazyn */}
        <Link
          href="/"
          className="group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          aria-label="BELLAORTE — strona główna"
        >
          <Wordmark variant="vertical" size="md" />
          <span aria-hidden="true" className="hidden h-10 w-px bg-gold/40 sm:block" />
          <div className="hidden flex-col gap-1 sm:flex">
            <span className="text-[10px] uppercase tracking-[0.3em] text-stone leading-tight">
              Orte · Lazio<br />Włochy
            </span>
            <TricoloreRule variant="horizontal" size="sm" />
          </div>
        </Link>

        {/* Nawigacja desktop */}
        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Nawigacja główna"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-italic font-display text-base text-cypress transition-colors hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/booking"
            className="ml-2 inline-flex items-center gap-2 rounded-none border border-gold bg-transparent px-5 py-2 font-display text-sm text-cypress transition-colors hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <span className="text-gold">·</span>
            <span>Rezerwacja</span>
          </Link>
        </nav>

        <MobileNav links={NAV_LINKS.map((l) => ({ ...l }))} />
      </div>
    </header>
  );
}
