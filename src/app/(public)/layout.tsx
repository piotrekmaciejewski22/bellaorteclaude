/**
 * Public layout — wraps every public-facing page with the shared header
 * and footer.
 *
 * Wymaganie 2.
 */

import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { BackgroundMusic } from "@/components/public/BackgroundMusic";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-crema">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <BackgroundMusic />
    </div>
  );
}
