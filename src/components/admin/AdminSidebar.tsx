/**
 * AdminSidebar — left-rail navigation for `/admin/*`.
 *
 * Server Component. Auth check is performed by the layout (task 6.3) so
 * this component just renders links.
 *
 * Wymagania pokryte: 27.
 */

import Link from 'next/link';
import {
  LayoutDashboard,
  Home,
  CalendarDays,
  Mailbox,
  UtensilsCrossed,
  Map,
  Compass,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  Newspaper,
  MessagesSquare,
  Camera,
  Sparkles,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/apartments', label: 'Apartamenty', icon: Home },
  { href: '/admin/calendar', label: 'Kalendarz', icon: CalendarDays },
  { href: '/admin/reservations', label: 'Zapytania i rezerwacje', icon: Mailbox },
  { href: '/admin/restaurants', label: 'Restauracje', icon: UtensilsCrossed },
  { href: '/admin/places', label: 'Atrakcje', icon: Map },
  { href: '/admin/rome', label: 'Rzym', icon: Compass },
  { href: '/admin/events', label: 'Wydarzenia / sezony', icon: Sparkles },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
  { href: '/admin/blog-comments', label: 'Komentarze bloga', icon: MessagesSquare },
  { href: '/admin/community-photos', label: 'Wasze zdjęcia', icon: Camera },
  { href: '/admin/reviews', label: 'Opinie', icon: MessageSquare },
  { href: '/admin/photos', label: 'Zdjęcia restauracji/atrakcji', icon: ImageIcon },
  { href: '/admin/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/admin/local-services', label: 'Dla gości', icon: ShoppingBag },
  { href: '/admin/settings', label: 'Ustawienia', icon: Settings },
] as const;

export function AdminSidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-flag-white">
      <div className="border-b border-border p-6">
        <Link
          href="/admin"
          className="font-display text-xl font-semibold tracking-wide"
        >
          <span className="text-italian-green">BELLA</span>
          <span className="text-terracotta">ORTE</span>
          <span className="ml-2 text-xs font-normal text-muted">admin</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4" aria-label="Nawigacja admina">
        <ul className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-cypress transition-colors hover:bg-soft-green hover:text-italian-green"
              >
                <Icon size={16} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-border p-4">
        <Link
          href="/"
          className="text-xs text-muted hover:text-cypress"
        >
          ← Wróć na stronę publiczną
        </Link>
      </div>
    </aside>
  );
}
