/**
 * SiteFooter — magazynowa stopka po polsku, z włoskim akcentem.
 *
 * - tricolore na samej górze (subtelny pasek)
 * - pieczęć BELLAORTE po prawej (zamiast statyczki "Est.")
 * - sekcje po polsku, jeden mały italic motto pod brandem
 */

import Link from "next/link";
import { Wordmark } from "@/components/public/decorative/Wordmark";
import { TricoloreRule } from "@/components/public/decorative/TricoloreRule";
import { BellaorteSeal } from "@/components/public/decorative/BellaorteSeal";

const FOOTER_NAV_LEFT = [
  { href: "/apartments", label: "Apartamenty" },
  { href: "/guide", label: "Przewodnik" },
  { href: "/wydarzenia", label: "Wydarzenia" },
  { href: "/mapa", label: "Mapa" },
  { href: "/blog", label: "Blog" },
  { href: "/wasze-zdjecia", label: "Wasze zdjęcia" },
] as const;

const FOOTER_NAV_RIGHT = [
  { href: "/rome", label: "Rzym" },
  { href: "/useful-info", label: "Informacje praktyczne" },
  { href: "/booking", label: "Rezerwacja" },
  { href: "/privacy", label: "Polityka prywatności" },
] as const;

const MOCK_CONTACT = {
  email: "kontakt@bellaorte.example",
  phone: "+39 000 000 0000",
  address: "Orte · Provincia di Viterbo · Włochy",
};

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-gold/30 bg-cypress text-soft-green">
      {/* Tricolore — subtelny pasek na samej górze */}
      <div className="flex justify-center pt-10">
        <TricoloreRule size="lg" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-10 md:grid-cols-[1.4fr,1fr,1fr,auto]">
        <div>
          <Wordmark variant="vertical" size="lg" tone="light" />
          <p className="heading-italic mt-5 max-w-sm text-base text-soft-green/80">
            Dwa apartamenty w sercu regionu Tuscia. Spokój doliny Tybru,
            sąsiedztwo Bomarzo i Civita di Bagnoregio, godzina pociągiem
            do Rzymu.
          </p>
          <p className="text-motto mt-4 text-base text-gold-soft">
            La dolce vita — quotidiana.
          </p>
          <p className="mt-6 text-eyebrow text-gold-soft/90">
            {MOCK_CONTACT.address}
          </p>
        </div>

        <div>
          <p className="text-eyebrow text-gold-soft/90">Strona</p>
          <ul className="mt-4 space-y-2.5">
            {FOOTER_NAV_LEFT.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="link-italic font-display text-soft-green/85 transition-colors hover:text-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {FOOTER_NAV_RIGHT.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="link-italic font-display text-soft-green/85 transition-colors hover:text-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-eyebrow text-gold-soft/90">Kontakt</p>
          <ul className="mt-4 space-y-2.5 font-display text-soft-green/85">
            <li>
              <a
                href={`mailto:${MOCK_CONTACT.email}`}
                className="link-italic hover:text-gold-soft"
              >
                {MOCK_CONTACT.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${MOCK_CONTACT.phone.replace(/\s+/g, "")}`}
                className="link-italic hover:text-gold-soft"
              >
                {MOCK_CONTACT.phone}
              </a>
            </li>
          </ul>

          <div className="mt-8 border-t border-gold/20 pt-5">
            <p className="text-eyebrow text-gold-soft/70">Rok założenia</p>
            <p className="font-display text-3xl text-gold-soft">MMXXVI</p>
          </div>
        </div>

        {/* Pieczęć po prawej */}
        <div className="hidden md:flex md:items-center md:justify-end">
          <BellaorteSeal size={140} className="text-gold-soft/70" />
        </div>
      </div>

      <div className="border-t border-gold/15">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-5 text-xs text-soft-green/55 md:flex-row md:items-center">
          <p>
            © {year} Bellaorte · wszelkie prawa zastrzeżone
          </p>
          <p className="italic">Mały kawałek Włoch, dzielony z troską.</p>
        </div>
      </div>
    </footer>
  );
}
