"use client";

/**
 * AvailabilityCalendar — public 3-month rolling calendar.
 *
 * Client Component. Fetches `GET /api/availability?apartmentId&from&to`
 * for the visible window. Lets the user click two days to choose a
 * range, then redirects to `/booking?apartmentId=...&checkIn&checkOut`.
 *
 * - `available` and `pending` cells are clickable. `pending` shows a
 *   warning banner above the calendar (Wym. 8).
 * - `reserved` and `blocked` cells are disabled with a screen-reader
 *   label communicating the status (Wym. 7, 46 #4).
 * - Each day exposes `aria-label` with the human-readable status (PL).
 *
 * Wymagania pokryte: 7, 8, 46 #4, 47 #3.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { DayStatus, DayStatusEntry } from '@/lib/types';

interface AvailabilityCalendarProps {
  apartmentId: string;
  apartmentSlug: string;
  apartmentMaxGuests: number;
  initialMonths?: number;
}

const STATUS_TO_TEXT_PL: Record<DayStatus, string> = {
  available: 'wolny',
  pending: 'oczekuje na potwierdzenie',
  reserved: 'zarezerwowany, niedostępny',
  blocked: 'zablokowany, niedostępny',
};

const STATUS_TO_CLASSES: Record<DayStatus, string> = {
  available:
    'bg-soft-green text-italian-green hover:bg-italian-green hover:text-flag-white cursor-pointer',
  pending:
    'bg-terracotta/15 text-terracotta hover:bg-terracotta hover:text-flag-white cursor-pointer',
  reserved: 'bg-italian-red/15 text-italian-red/70 cursor-not-allowed',
  blocked: 'bg-muted/20 text-muted cursor-not-allowed',
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

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

interface MonthCell {
  date: string;
  day: number;
  status: DayStatus | null;
  inMonth: boolean;
}

export function AvailabilityCalendar({
  apartmentId,
  apartmentSlug: _apartmentSlug,
  apartmentMaxGuests: _apartmentMaxGuests,
  initialMonths = 3,
}: AvailabilityCalendarProps) {
  const router = useRouter();
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [statuses, setStatuses] = useState<Map<string, DayStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const months = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < initialMonths; i++) {
      out.push(addMonths(anchor, i));
    }
    return out;
  }, [anchor, initialMonths]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFetchError(null);
      const from = isoDate(months[0]);
      const to = isoDate(endOfMonth(months[months.length - 1]));
      try {
        const url = `/api/availability?apartmentId=${apartmentId}&from=${from}&to=${to}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as { days: DayStatusEntry[] };
        if (cancelled) return;
        const m = new Map<string, DayStatus>();
        for (const entry of json.days) m.set(entry.date, entry.status);
        setStatuses(m);
      } catch (err) {
        if (!cancelled) {
          setFetchError('Nie udało się pobrać dostępności. Spróbuj ponownie.');
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [apartmentId, months]);

  function buildMonthGrid(monthDate: Date): MonthCell[] {
    const first = startOfMonth(monthDate);
    const last = endOfMonth(monthDate);
    const startWeekday = (first.getDay() + 6) % 7; // Mon=0
    const cells: MonthCell[] = [];

    // Leading days from previous month.
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(first);
      d.setDate(first.getDate() - (i + 1));
      cells.push({ date: isoDate(d), day: d.getDate(), status: null, inMonth: false });
    }

    // Days of this month.
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(first.getFullYear(), first.getMonth(), day);
      const iso = isoDate(d);
      cells.push({
        date: iso,
        day,
        status: statuses.get(iso) ?? 'available',
        inMonth: true,
      });
    }

    // Trailing days to fill the last week.
    while (cells.length % 7 !== 0) {
      const d = new Date(last);
      d.setDate(last.getDate() + (cells.length % 7) + 1);
      cells.push({ date: isoDate(d), day: d.getDate(), status: null, inMonth: false });
    }

    return cells;
  }

  function onDayClick(cell: MonthCell) {
    if (!cell.inMonth || !cell.status) return;
    if (cell.status === 'reserved' || cell.status === 'blocked') {
      setWarning('Termin niedostępny.');
      return;
    }
    setWarning(null);
    if (cell.status === 'pending') {
      setWarning(
        'Termin tymczasowo zarezerwowany przez innego gościa — możesz wysłać zapytanie, ale potwierdzenie zależy od wcześniejszych zgłoszeń.',
      );
    }

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(cell.date);
      setCheckOut(null);
      return;
    }
    if (cell.date <= checkIn) {
      setCheckIn(cell.date);
      setCheckOut(null);
      return;
    }
    setCheckOut(cell.date);
  }

  function isInRange(date: string): boolean {
    if (!checkIn) return false;
    if (!checkOut) return date === checkIn;
    return date >= checkIn && date <= checkOut;
  }

  function goPrev() {
    const todayMonth = startOfMonth(new Date());
    const prev = addMonths(anchor, -1);
    if (prev < todayMonth) return;
    setAnchor(prev);
  }
  function goNext() {
    setAnchor(addMonths(anchor, 1));
  }

  function submitRange() {
    if (!checkIn || !checkOut) return;
    const url = `/booking?apartmentId=${apartmentId}&checkIn=${checkIn}&checkOut=${checkOut}`;
    router.push(url);
  }

  return (
    <div className="rounded-2xl border border-border bg-flag-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-eyebrow">Kalendarz dostępności</p>
          <h3 className="heading-section mt-1 text-2xl text-ink">
            Wybierz termin
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Poprzedni miesiąc"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-cypress hover:bg-soft-green focus-visible:outline-2 focus-visible:outline-italian-green"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Następny miesiąc"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-cypress hover:bg-soft-green focus-visible:outline-2 focus-visible:outline-italian-green"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {warning && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-sm text-terracotta"
        >
          {warning}
        </p>
      )}
      {fetchError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red"
        >
          {fetchError}
        </p>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-3">
        {months.map((month) => {
          const grid = buildMonthGrid(month);
          return (
            <div key={month.toISOString()}>
              <p className="text-center font-display text-lg text-ink">
                {PL_MONTHS[month.getMonth()]} {month.getFullYear()}
              </p>
              <div
                className="mt-3 grid grid-cols-7 gap-1 text-center text-xs"
                role="grid"
                aria-label={`Miesiąc ${PL_MONTHS[month.getMonth()]} ${month.getFullYear()}`}
              >
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
                    return <div key={idx} aria-hidden="true" />;
                  }
                  const status = cell.status as DayStatus;
                  const inRange = isInRange(cell.date);
                  const dateLabel = new Date(cell.date).toLocaleDateString(
                    'pl-PL',
                    { day: 'numeric', month: 'long' },
                  );
                  const aria = `${dateLabel}, ${STATUS_TO_TEXT_PL[status]}`;
                  const baseClass = STATUS_TO_CLASSES[status];
                  const ringClass = inRange
                    ? 'ring-2 ring-italian-green ring-offset-1'
                    : '';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onDayClick(cell)}
                      disabled={status === 'reserved' || status === 'blocked'}
                      aria-label={aria}
                      className={`flex h-10 w-10 items-center justify-center rounded-md text-xs font-medium transition-colors ${baseClass} ${ringClass}`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <p className="mt-4 text-xs text-muted">Wczytywanie dostępności...</p>
      )}

      {checkIn && checkOut && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-soft-green px-4 py-3">
          <p className="text-sm text-cypress">
            Wybrany zakres: <strong>{checkIn}</strong> → <strong>{checkOut}</strong>
          </p>
          <button
            type="button"
            onClick={submitRange}
            className="rounded-full bg-italian-green px-5 py-2 text-sm font-semibold text-flag-white hover:bg-cypress"
          >
            Sprawdź dostępność
          </button>
        </div>
      )}
    </div>
  );
}
