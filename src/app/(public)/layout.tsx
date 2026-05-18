/**
 * Public layout — wraps every public-facing page with the shared header
 * and footer.
 *
 * Server Component. Admin pages live under `/admin/*` and use a separate
 * `(admin)` route group so they can opt out of this chrome and add their
 * own layout (task 6.3).
 *
 * Wymaganie 2.
 */

import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
