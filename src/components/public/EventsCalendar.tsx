"use client";

/**
 * EventsCalendar — widok kalendarzowy wydarzeń lokalnych.
 *
 * Pokazuje miesiąc po miesiącu siatkę dni z kropkami w dniach gdzie
 * coś się dzieje. Klik w dzień otwiera panel ze szczegółami dnia.
 * Wydarzenia bez `start_date` (np. polecenia sezonowe) są pokazywane
 * jako pasek na górze (są ważne ale nie przypisane do konkretnego dnia).
 *
 * Na małych ekranach komponent przełącza się automatycznie na widok
 * listy zgrupowanej po miesiącach (kalendarz miesięczny jest za mały).
 */

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import type { EventEntry } from '@/lib/data/events';

interface EventsCalendarProps {
  localEvents: EventEntry[];
  seasonalEvents: EventEntry[];
}

const PL_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];
const PL_WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/**
 * Czy event obejmuje dany dzień. Działa też dla wielodniowych
 * (start_date..end_date).
 */
function eventCoversDate(e: EventEntry, isoDay: string): boolean {
  if (!e.startDate) return false;
  const day = isoDay;
  const start = e.startDate;
  const end = e.endDate ?? e.startDate;
  return day >= start && day <= end;
}

function formatDayLong(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface DayCell {
  iso: string;
  day: number;
  inMonth: boolean;
  events: EventEntry[];
}

export function EventsCalendar({ localEvents, seasonalEvents }: EventsCalendarProps) {
  const today = useMemo(() => isoDate(new Date()), []);
  const [anchor, setAnchor] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const grid: DayCell[] = useMemo(() => {
    const first = startOfMonth(anchor);
    const last = endOfMonth(anchor);
    const startWeekday = (first.getDay() + 6) % 7; // Pn=0
    const cells: DayCell[] = [];

    // Dni z poprzedniego miesiąca dla wyrównania
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(first);
      d.setDate(first.getDate() - (i + 1));
      cells.push({
        iso: isoDate(d),
        day: d.getDate(),
        inMonth: false,
        events: [],
      });
    }

    // Dni tego miesiąca
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(first.getFullYear(), first.getMonth(), day);
      const iso = isoDate(d);
      cells.push({
        iso,
        day,
        inMonth: true,
        events: localEvents.filter((e) => eventCoversDate(e, iso)),
      });
    }

    // Dni z kolejnego miesiąca dla domknięcia siatki
    while (cells.length % 7 !== 0) {
      const d = new Date(last);
      d.setDate(last.getDate() + (cells.length % 7) + 1);
      cells.push({
        iso: isoDate(d),
        day: d.getDate(),
        inMonth: false,
        events: [],
      });
    }

    return cells;
  }, [anchor, localEvents]);

  const selectedEvents = selectedIso
    ? localEvents.filter((e) => eventCoversDate(e, selectedIso))
    : [];

  return (
    <div className="rounded-2xl border border-gold/30 bg-flag-white p-6 shadow-warm">
      {/* Polecenia sezonowe — pasek nad kalendarzem (nie mają konkretnych dat). */}
      {seasonalEvents.length > 0 && (
        <div className="mb-6 border-b border-gold/20 pb-5">
          <p className="text-eyebrow text-gold">Aktualnie polecamy</p>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {seasonalEvents.map((e) => (
              <li
                key={e.id}
                className="flex items-baseline gap-2 text-sm text-cypress"
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-olive" />
                <span className="font-display text-base text-ink">{e.title}</span>
                {e.displayPeriod && (
                  <span className="font-display italic text-stone">
                    — {e.displayPeriod}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-eyebrow text-gold">{PL_MONTHS[anchor.getMonth()]} {anchor.getFullYear()}</p>
          <h3 className="font-display mt-1 text-2xl text-ink">
            Kalendarz <span className="italic text-olive">wydarzeń</span>
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAnchor((a) => addMonths(a, -1))}
            aria-label="Poprzedni miesiąc"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-cypress hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setAnchor((a) => addMonths(a, 1))}
            aria-label="Następny miesiąc"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-cypress hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Kalendarz — desktop (≥ md). */}
      <div className="mt-6 hidden md:block">
        <div className="grid grid-cols-7 gap-1 text-center">
          {PL_WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="py-1 text-[10px] font-medium uppercase tracking-wide text-muted"
            >
              {wd}
            </div>
          ))}
          {grid.map((cell, idx) => {
            if (!cell.inMonth) {
              return <div key={idx} aria-hidden="true" className="h-16" />;
            }
            const hasEvents = cell.events.length > 0;
            const isToday = cell.iso === today;
            const isSelected = cell.iso === selectedIso;
            const baseClass = hasEvents
              ? 'cursor-pointer border-gold/40 bg-gold/5 hover:bg-gold/15'
              : 'border-transparent text-stone hover:border-gold/20';
            const ringClass = isSelected
              ? 'ring-2 ring-olive ring-offset-2 ring-offset-flag-white'
              : '';
            const todayClass = isToday ? 'font-bold text-terracotta' : '';
            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => hasEvents && setSelectedIso(cell.iso)}
                disabled={!hasEvents}
                aria-label={
                  hasEvents
                    ? `${formatDayLong(cell.iso)}, ${cell.events.length} wydarzenie`
                    : formatDayLong(cell.iso)
                }
                className={`flex h-16 flex-col items-center justify-center gap-1 border text-sm transition-colors ${baseClass} ${ringClass} ${todayClass}`}
              >
                <span>{cell.day}</span>
                {hasEvents && (
                  <span aria-hidden="true" className="flex gap-1">
                    {cell.events.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className="h-1.5 w-1.5 rounded-full bg-terracotta"
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista miesięczna — mobile (< md). */}
      <div className="mt-6 md:hidden">
        {grid.filter((c) => c.inMonth && c.events.length > 0).length === 0 ? (
          <p className="font-display italic text-stone">
            W tym miesiącu nic nie planujemy.
          </p>
        ) : (
          <ul className="space-y-3">
            {grid
              .filter((c) => c.inMonth && c.events.length > 0)
              .map((cell) => (
                <li key={cell.iso} className="border-l-2 border-terracotta pl-4">
                  <p className="text-eyebrow text-gold">{formatDayLong(cell.iso)}</p>
                  <ul className="mt-1 space-y-1">
                    {cell.events.map((e) => (
                      <li key={e.id} className="font-display text-base text-ink">
                        {e.title}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        )}
      </div>

      {/* Panel szczegółów wybranego dnia. */}
      {selectedIso && selectedEvents.length > 0 && (
        <div className="mt-8 border-t border-gold/30 pt-6">
          <div className="flex items-baseline justify-between">
            <p className="text-eyebrow text-gold">{formatDayLong(selectedIso)}</p>
            <button
              type="button"
              onClick={() => setSelectedIso(null)}
              className="text-xs font-display italic text-stone hover:text-terracotta"
            >
              Zamknij
            </button>
          </div>
          <ul className="mt-4 space-y-6">
            {selectedEvents.map((e) => (
              <li key={e.id}>
                <h4 className="font-display text-2xl text-ink">{e.title}</h4>
                {e.displayPeriod && (
                  <p className="font-display mt-1 text-sm italic text-stone">
                    {e.displayPeriod}
                  </p>
                )}
                {e.excerpt && (
                  <p className="text-ui mt-2 text-sm text-cypress/85">{e.excerpt}</p>
                )}
                {e.bodyMd && (
                  <div className="markdown-body mt-3 text-sm">
                    <ReactMarkdown>{e.bodyMd}</ReactMarkdown>
                  </div>
                )}
                {e.externalUrl && (
                  <a
                    href={e.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 border border-gold/40 bg-paper px-3 py-1.5 text-xs font-display italic text-terracotta hover:border-gold hover:bg-gold/5"
                  >
                    Strona wydarzenia <ExternalLink size={11} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
