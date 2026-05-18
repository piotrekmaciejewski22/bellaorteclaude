/**
 * SiteHeader — top navigation for the public site.
 *
 * Server Component. Renders the BELLAORTE wordmark on the left and the
 * primary nav (`/apartments`, `/guide`, `/rome`, `/useful-info`,
 * `/booking`) on the right. The mobile menu is delegated to the
 * `MobileNav` client component.
 *
 * Wymaganie 2, 47.
 */

import Link from "next/link";
import { MobileNav } from "@/components/public/MobileNav";

const NAV_LINKS = [
  { href: "/apartments", label: "Apartamenty" },
  { href: "/guide", label: "Przewodnik" },
  { href: "/blog", label: "Blog" },
  { href: "/wasze-zdjecia", label: "Wasze zdjęcia" },
  { href: "/rome", label: "Rzym" },
  { href: "/useful-info", label: "Informacje" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-wide text-ink hover:text-italian-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-italian-green"
        >
          <span className="text-italian-green">BELLA</span>
          <span className="text-terracotta">ORTE</span>
        </Link>

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Nawigacja główna"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-cypress transition-colors hover:text-italian-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-italian-green"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/booking"
            className="ml-2 rounded-full bg-italian-green px-5 py-2 text-sm font-semibold text-flag-white transition-colors hover:bg-cypress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-italian-green"
          >
            Sprawdź dostępność
          </Link>
        </nav>

        <MobileNav links={NAV_LINKS} />
      </div>
    </header>
  );
}
