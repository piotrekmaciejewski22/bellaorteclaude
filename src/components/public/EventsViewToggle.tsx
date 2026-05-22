"use client";

/**
 * EventsViewToggle — dwa przyciski przełączające widoki na /wydarzenia.
 *
 * Renderuje się po stronie klienta i zmienia widoczność dwóch sekcji
 * (data-events-view="list" i data-events-view="calendar") przez
 * bezpośrednią manipulację stylami. Wybór zapisywany w localStorage
 * żeby przy następnej wizycie pamiętał preferencję.
 *
 * Stan początkowy odczytujemy lazy z localStorage (synchronicznie przy
 * pierwszym renderze klienta), a effect tylko aplikuje DOM po hydration.
 */

import { useEffect, useState } from 'react';
import { CalendarDays, List } from 'lucide-react';

const STORAGE_KEY = 'bellaorte:events-view';

type View = 'list' | 'calendar';

function readSavedView(): View {
  if (typeof window === 'undefined') return 'list';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'calendar' ? 'calendar' : 'list';
}

function applyView(view: View) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('[data-events-view]').forEach((el) => {
    el.style.display = el.dataset.eventsView === view ? '' : 'none';
  });
}

export function EventsViewToggle() {
  // Lazy initializer odczytuje localStorage tylko raz, przy pierwszym
  // renderze klienta. SSR widzi 'list' (i renderuje obie sekcje
  // widoczne — effect zaraz schowa nieaktywną).
  const [view, setView] = useState<View>(readSavedView);

  useEffect(() => {
    applyView(view);
  }, [view]);

  function pick(next: View) {
    setView(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Widok wydarzeń"
      className="inline-flex items-center gap-0 rounded-full border border-gold/40 bg-flag-white p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === 'list'}
        onClick={() => pick('list')}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm transition-colors ${
          view === 'list'
            ? 'bg-olive text-crema'
            : 'text-cypress hover:bg-gold/10'
        }`}
      >
        <List size={14} />
        Lista
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === 'calendar'}
        onClick={() => pick('calendar')}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm transition-colors ${
          view === 'calendar'
            ? 'bg-olive text-crema'
            : 'text-cypress hover:bg-gold/10'
        }`}
      >
        <CalendarDays size={14} />
        Kalendarz
      </button>
    </div>
  );
}
