/**
 * SiteFooter — bottom of every public page.
 *
 * Server Component. Currently uses static contact info and address; once
 * the data layer ships, swap the constants for `getSiteSettings()` from
 * `src/lib/data/site-settings.ts`.
 *
 * Wymaganie 2, 37, 43.
 */

import Link from "next/link";

const FOOTER_NAV = [
  { href: "/apartments", label: "Apartamenty" },
  { href: "/guide", label: "Przewodnik" },
  { href: "/blog", label: "Blog" },
  { href: "/wasze-zdjecia", label: "Wasze zdjęcia" },
  { href: "/rome", label: "Rzym" },
  { href: "/useful-info", label: "Informacje praktyczne" },
  { href: "/booking", label: "Rezerwacja" },
  { href: "/privacy", label: "Polityka prywatności" },
] as const;

// TODO: read from `site_settings` once task 4/18 wires data layer.
const MOCK_CONTACT = {
  email: "kontakt@bellaorte.example",
  phone: "+39 000 000 0000",
  address: "Orte, Prowincja Viterbo, Włochy",
};

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-cypress text-flag-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-semibold tracking-wide">
            <span className="text-soft-green">BELLA</span>
            <span className="text-terracotta">ORTE</span>
          </p>
          <p className="mt-3 text-sm text-soft-green/80">
            Dwa apartamenty w sercu zabytkowego Orte. Spokój doliny Tybru,
            blisko Rzymu.
          </p>
          <p className="mt-4 text-sm text-soft-green/70">
            {MOCK_CONTACT.address}
          </p>
        </div>

        <div>
          <p className="text-eyebrow text-soft-green/70">Nawigacja</p>
          <ul className="mt-3 space-y-2">
            {FOOTER_NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-flag-white/90 transition-colors hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-eyebrow text-soft-green/70">Kontakt</p>
          <ul className="mt-3 space-y-2 text-sm text-flag-white/90">
            <li>
              <a
                href={`mailto:${MOCK_CONTACT.email}`}
                className="hover:text-terracotta"
              >
                {MOCK_CONTACT.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${MOCK_CONTACT.phone.replace(/\s+/g, "")}`}
                className="hover:text-terracotta"
              >
                {MOCK_CONTACT.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-flag-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-5 text-xs text-soft-green/60 md:flex-row md:items-center">
          <p>© {year} BELLAORTE. Wszelkie prawa zastrzeżone.</p>
          <p>Strona w przygotowaniu — dane przykładowe.</p>
        </div>
      </div>
    </footer>
  );
}
