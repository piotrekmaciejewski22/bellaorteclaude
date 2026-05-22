import type { Metadata } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

/*
 * Display: Playfair Display — klasyczny włoski serif w stylu Bodoni, z
 * silnym kontrastem między cienkimi i grubymi kreskami. Ładuje też italic
 * (kursywę) bo używamy jej w subtytułach magazynowych.
 */
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

/*
 * Cormorant Garamond — wcześniejszy display, zostawiam jako fallback dla
 * stron które jeszcze go używają. Po pełnym refactorze można usunąć.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  variable: "--font-script",
  display: "swap",
});

/* UI: Inter — neutralny, dobrze czyta się w formularzach i panelu admina. */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BELLAORTE — Apartamenty w sercu Tuscia, godzinę od Rzymu",
  description:
    "Dwa kameralne apartamenty w zabytkowym Orte. Spokój doliny Tybru, sąsiedztwo Bomarzo i Civita di Bagnoregio, bezpośredni pociąg do Rzymu. Bez płatności online — kontakt mailowy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${playfair.variable} ${cormorant.variable} ${inter.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
