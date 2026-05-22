"use client";

/**
 * MobileNav — hamburger menu for the public site below 768 px.
 *
 * Client Component. Renders a button that opens a full-screen overlay
 * with the same nav links as `SiteHeader`. Closes on link click and on
 * Escape. Visible only on `md` breakpoint and below.
 *
 * Wymaganie 47 #2 (responsive nav).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface MobileNavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: ReadonlyArray<MobileNavLink>;
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-cypress hover:bg-soft-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-italian-green"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu mobilne"
          className="fixed bottom-0 left-0 right-0 top-20 z-50 flex flex-col gap-2 overflow-y-auto overscroll-contain bg-crema px-6 py-8 shadow-2xl"
        >
          <nav aria-label="Nawigacja mobilna" className="flex flex-col gap-1 pb-12">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block border-b border-gold/20 px-2 py-4 font-display text-2xl italic text-cypress active:bg-gold/10"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/booking"
              onClick={() => setOpen(false)}
              className="mt-6 block border-2 border-olive bg-olive px-6 py-4 text-center font-display italic text-crema active:bg-olive-deep"
            >
              <span className="text-gold-soft">·</span> Rezerwacja
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
