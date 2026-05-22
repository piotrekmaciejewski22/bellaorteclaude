"use client";

/**
 * MobileNav — hamburger menu for the public site below 768 px.
 *
 * Client Component. Otwarte menu jest renderowane przez React Portal
 * bezpośrednio w `<body>`, żeby było ZAWSZE na wierzchu — niezależnie
 * od stacking contextów stworzonych przez `isolate` na hero (Image
 * z position absolute) lub innymi sekcjami.
 *
 * Wymaganie 47 #2 (responsive nav).
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface MobileNavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: ReadonlyArray<MobileNavLink>;
}

// Wykrywanie hydration bez useEffect+setState — useSyncExternalStore
// zwraca server snapshot na SSR (false) i client snapshot po hydration (true).
const subscribe = () => () => undefined;
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const isClient = useIsClient();

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

      {isClient && open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menu mobilne"
              // z-[9999] żeby przykrył wszystko — mapy Leaflet/Google ustawiają
              // własne wysokie z-index, więc używamy bardzo wysokiego.
              className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto overscroll-contain bg-crema"
              style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              {/* Pasek z X w prawym górnym rogu */}
              <div className="flex h-20 items-center justify-between border-b border-gold/20 px-6">
                <span className="font-display text-xl text-ink">
                  <span className="text-italian-green">BELLA</span>
                  <span className="text-terracotta">ORTE</span>
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Zamknij menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-cypress active:bg-soft-green"
                >
                  <X size={24} />
                </button>
              </div>

              <nav
                aria-label="Nawigacja mobilna"
                className="flex flex-col gap-1 px-6 py-6"
              >
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
                  className="mt-6 block border-2 border-olive bg-olive px-6 py-4 text-center font-display text-lg italic text-crema active:bg-olive-deep"
                >
                  <span className="text-gold-soft">·</span> Rezerwacja
                </Link>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
