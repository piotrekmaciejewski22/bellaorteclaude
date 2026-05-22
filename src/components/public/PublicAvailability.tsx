"use client";

/**
 * PublicAvailability — kompaktowy publiczny kalendarz dostępności,
 * obok siebie pokazuje oba apartamenty (Casa Orte Uno + Due).
 *
 * Każda kafelka to mini-kalendarz miesięczny z kolorowymi dniami:
 *   - zielony = wolny
 *   - terakota = oczekuje (zapytanie w trakcie potwierdzania)
 *   - czerwony = zarezerwowany
 *   - szary = zablokowany przez admina
 *
 * Dane pobiera z `GET /api/availability?apartmentId=...&from&to`.
 *
 * Klik dnia przekierowuje na /booking?apartmentId=...&checkIn=...
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { DayStatus, DayStatusEntry } from '@/lib/types';

interface ApartmentSlim {
  id: string;
  slug: string;
  name: string;
}

interface PublicAvailabilityProps {
  apartments: ApartmentSlim[];
}

const STATUS_TO_LABEL: Record<DayStatus, string> = {
  available: 'wolny',
  pending: 'oczekuje',
  reserved: 'zarezerwowany',
  blocked: 'zablokowany',
};

const STATUS_TO_CLASS: Record<DayStatus, string> = {
  available: 'bg-soft-green text-italian-green hover:bg-italian-green hover:text-flag-white',
  pending: 'bg-terracotta/15 text-terracotta',
  reserved: 'bg-italian-red/20 text-italian-red/80',
  blocked: 'bg-stone/20 text-stone',
};

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

interface MonthCell {
  date: string;
  day: number;
  inMonth: boolean;
  status: DayStatus;
}

interface ApartmentMiniCalendarProps {
  apartment: ApartmentSlim;
  anchor: Date;
}

function ApartmentMiniCalendar({ apartment, anchor }: ApartmentMiniCalendarProps) {
  const [statuses, setStatuses] = useState<Map<string, DayStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const from = isoDate(startOfMonth(anchor));
      const to = isoDate(endOfMonth(anchor));
      try {
        const res = await fetch(
          `/api/availability?apartmentId=${apartment.id}&from=${from}&to=${to}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { days: DayStatusEntry[] };
        if (cancelled) return;
        const map = new Map<string, DayStatus>();
        for (const e of json.days) map.set(e.date, e.status);
        setStatuses(map);
      } catch (err) {
        if (!cancelled) {
          console.warn('public availability:', err);
          setError('Nie udało się pobrać dostępności.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [apartment.id, anchor]);

  const grid = useMemo<MonthCell[]>(() => {
    const first = startOfMonth(anchor);
    const last = endOfMonth(anchor);
    const startWeekday = (first.getDay() + 6) % 7;
    const cells: MonthCell[] = [];

    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(first);
      d.setDate(first.getDate() - (i + 1));
      cells.push({ date: isoDate(d), day: d.getDate(), inMonth: false, status: 'available' });
    }
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(first.getFullYear(), first.getMonth(), day);
      const iso = isoDate(d);
      cells.push({
        date: iso,
        day,
        inMonth: true,
        status: statuses.get(iso) ?? 'available',
      });
    }
    while (cells.length % 7 !== 0) {
      const d = new Date(last);
      d.setDate(last.getDate() + (cells.length % 7) + 1);
      cells.push({ date: isoDate(d), day: d.getDate(), inMonth: false, status: 'available' });
    }
    return cells;
  }, [anchor, statuses]);

  return (
    <div className="rounded-2xl border border-gold/30 bg-flag-white p-5 shadow-warm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="font-display text-lg text-ink">{apartment.name}</p>
        <Link
          href={`/apartments/${apartment.slug}`}
          className="link-italic text-xs font-display italic text-terracotta hover:text-wine"
        >
          Szczegóły →
        </Link>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-2 py-1 text-xs text-italian-red">
          {error}
        </p>
      ) : (
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
              return <div key={idx} aria-hidden="true" className="h-9" />;
            }
            const status = cell.status;
            const isClickable = status === 'available' || status === 'pending';
            const dateLabel = new Date(cell.date).toLocaleDateString('pl-PL', {
              day: 'numeric',
              month: 'long',
            });
            const aria = `${dateLabel}, ${STATUS_TO_LABEL[status]}`;
            return isClickable ? (
              <Link
                key={cell.date}
                href={`/booking?apartmentId=${apartment.id}&checkIn=${cell.date}`}
                aria-label={aria}
                className={`flex h-9 items-center justify-center rounded-md text-sm transition-colors ${STATUS_TO_CLASS[status]}`}
              >
                {cell.day}
              </Link>
            ) : (
              <span
                key={cell.date}
                aria-label={aria}
                className={`flex h-9 items-center justify-center rounded-md text-sm ${STATUS_TO_CLASS[status]}`}
              >
                {cell.day}
              </span>
            );
          })}
        </div>
      )}

      {loading && (
        <p className="mt-2 text-center text-[11px] italic text-muted">Wczytywanie…</p>
      )}
    </div>
  );
}

export function PublicAvailability({ apartments }: PublicAvailabilityProps) {
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));

  const monthLabel = `${PL_MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  const todayMonth = startOfMonth(new Date());
  const canGoBack = anchor > todayMonth;

  return (
    <div>
      {/* Pasek nawigacji + legenda */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => canGoBack && setAnchor((a) => addMonths(a, -1))}
            disabled={!canGoBack}
            aria-label="Poprzedni miesiąc"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-cypress hover:bg-gold/10 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="font-display text-2xl text-ink md:text-3xl">{monthLabel}</p>
          <button
            type="button"
            onClick={() => setAnchor((a) => addMonths(a, 1))}
            aria-label="Następny miesiąc"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-cypress hover:bg-gold/10"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <ul className="flex flex-wrap gap-3 text-xs text-cypress/85">
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded bg-soft-green" />
            Wolny
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded bg-terracotta/30" />
            Oczekuje
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded bg-italian-red/30" />
            Zarezerwowany
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded bg-stone/30" />
            Zablokowany
          </li>
        </ul>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {apartments.map((a) => (
          <ApartmentMiniCalendar key={a.id} apartment={a} anchor={anchor} />
        ))}
      </div>

      <p className="mt-6 text-center font-display text-sm italic text-stone">
        Kliknij wolny dzień żeby przejść do rezerwacji
      </p>
    </div>
  );
}
