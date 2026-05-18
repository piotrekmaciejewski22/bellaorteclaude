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
          className="fixed inset-0 top-16 z-30 flex flex-col gap-2 overflow-y-auto bg-ivory px-6 py-8"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-4 text-lg font-medium text-cypress hover:bg-soft-green"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/booking"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-full bg-italian-green px-6 py-4 text-center text-base font-semibold text-flag-white"
          >
            Sprawdź dostępność
          </Link>
        </div>
      )}
    </div>
  );
}
