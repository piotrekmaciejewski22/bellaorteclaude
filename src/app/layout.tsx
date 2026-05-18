import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

// Display: elegancki kroj inspirowany Cormorant Garamond — nagłówki publiczne.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// UI: neutralny Inter — formularze, kalendarz, tabele, panel admina.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BELLAORTE | Orte, Włochy",
  description:
    "BELLAORTE — dwa apartamenty w Orte z kalendarzem dostępności, przewodnikiem i panelem admina.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${cormorantGaramond.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
