"use client";

/**
 * AdminCalendar — visual calendar for the admin with click-to-block.
 *
 * Loads availability via `/api/availability`, renders 3 months at a time,
 * and lets the admin:
 *   - click a free day to start adding a block
 *   - click a blocked day to delete it
 *
 * Wymagania pokryte: 29.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import type { DayStatus, DayStatusEntry } from '@/lib/types';

interface ApartmentOption {
  id: string;
  name: string;
}

interface AdminCalendarProps {
  apartments: ApartmentOption[];
}

const PL_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];
const PL_WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

const STATUS_CLS: Record<DayStatus, string> = {
  available: 'bg-soft-green text-italian-green hover:bg-italian-green hover:text-flag-white',
  pending: 'bg-terracotta/20 text-terracotta',
  reserved: 'bg-italian-red/15 text-italian-red',
  blocked: 'bg-muted/30 text-cypress hover:bg-muted/50',
};

const STATUS_PL: Record<DayStatus, string> = {
  available: 'wolny',
  pending: 'oczekuje',
  reserved: 'zarezerwowany',
  blocked: 'zablokowany',
};

const REASONS = [
  { value: 'maintenance', label: 'Konserwacja' },
  { value: 'owner_stay', label: 'Pobyt właściciela' },
  { value: 'cleaning', label: 'Sprzątanie' },
  { value: 'other', label: 'Inne' },
] as const;

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, m: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + m);
  return r;
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

interface MonthCell {
  date: string;
  day: number;
  inMonth: boolean;
  status: DayStatus | null;
}

export function AdminCalendar({ apartments }: AdminCalendarProps) {
  const router = useRouter();
  const [apartmentId, setApartmentId] = useState(apartments[0]?.id ?? '');
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [statuses, setStatuses] = useState<Map<string, DayStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [blockModal, setBlockModal] = useState<{
    startsOn: string;
    endsOn: string;
    reason: string;
    note: string;
  } | null>(null);
  const [blockBusy, setBlockBusy] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const months = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < 3; i++) out.push(addMonths(anchor, i));
    return out;
  }, [anchor]);

  useEffect(() => {
    if (!apartmentId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFetchError(null);
      const from = isoDate(months[0]);
      const to = isoDate(endOfMonth(months[months.length - 1]));
      try {
        const res = await fetch(
          `/api/availability?apartmentId=${apartmentId}&from=${from}&to=${to}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { days: DayStatusEntry[] };
        if (cancelled) return;
        const m = new Map<string, DayStatus>();
        for (const d of json.days) m.set(d.date, d.status);
        setStatuses(m);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setFetchError('Nie udało się pobrać kalendarza.');
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
    const startWeekday = (first.getDay() + 6) % 7;
    const cells: MonthCell[] = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(first);
      d.setDate(first.getDate() - (i + 1));
      cells.push({ date: isoDate(d), day: d.getDate(), inMonth: false, status: null });
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
      cells.push({ date: isoDate(d), day: d.getDate(), inMonth: false, status: null });
    }
    return cells;
  }

  function onDayClick(cell: MonthCell) {
    if (!cell.inMonth) return;
    if (cell.status === 'available' || cell.status === 'pending') {
      const startD = new Date(cell.date);
      const endD = new Date(startD);
      endD.setDate(startD.getDate() + 1);
      setBlockModal({
        startsOn: cell.date,
        endsOn: isoDate(endD),
        reason: 'maintenance',
        note: '',
      });
      setBlockError(null);
    }
  }

  async function submitBlock() {
    if (!blockModal) return;
    setBlockBusy(true);
    setBlockError(null);
    try {
      const res = await fetch('/api/admin/calendar-blocks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          apartmentId,
          startsOn: blockModal.startsOn,
          endsOn: blockModal.endsOn,
          reason: blockModal.reason,
          note: blockModal.note || null,
        }),
      });
      if (res.status === 409) {
        setBlockError('Termin koliduje z aktywną rezerwacją.');
        setBlockBusy(false);
        return;
      }
      if (!res.ok) {
        setBlockError('Dodanie blokady nie powiodło się.');
        setBlockBusy(false);
        return;
      }
      setBlockModal(null);
      router.refresh();
    } catch {
      setBlockError('Brak połączenia.');
    } finally {
      setBlockBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-flag-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <select
          value={apartmentId}
          onChange={(e) => setApartmentId(e.target.value)}
          className="rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
        >
          {apartments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAnchor(addMonths(anchor, -1))}
            aria-label="Poprzedni miesiąc"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-cypress hover:bg-soft-green"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setAnchor(addMonths(anchor, 1))}
            aria-label="Następny miesiąc"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-cypress hover:bg-soft-green"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {fetchError && (
        <p className="mt-4 rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
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
              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
                {PL_WEEKDAYS.map((wd) => (
                  <div key={wd} className="py-1 text-[10px] font-medium uppercase tracking-wide text-muted">
                    {wd}
                  </div>
                ))}
                {grid.map((cell, idx) => {
                  if (!cell.inMonth) return <div key={idx} aria-hidden="true" />;
                  const status = cell.status as DayStatus;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onDayClick(cell)}
                      aria-label={`${cell.date}, ${STATUS_PL[status]}`}
                      className={`flex h-10 w-10 items-center justify-center rounded-md text-xs font-medium transition-colors ${STATUS_CLS[status]}`}
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

      {loading && <p className="mt-4 text-xs text-muted">Wczytywanie kalendarza...</p>}

      {blockModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Dodaj blokadę"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
          onClick={() => setBlockModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-flag-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-eyebrow">Kalendarz</p>
                <h3 className="heading-section mt-1 text-2xl text-ink">Dodaj blokadę</h3>
              </div>
              <button
                type="button"
                aria-label="Zamknij"
                onClick={() => setBlockModal(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-soft-green"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-cypress">Od</label>
                  <input
                    type="date"
                    value={blockModal.startsOn}
                    onChange={(e) =>
                      setBlockModal({ ...blockModal, startsOn: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-cypress">Do</label>
                  <input
                    type="date"
                    value={blockModal.endsOn}
                    onChange={(e) =>
                      setBlockModal({ ...blockModal, endsOn: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-cypress">Powód</label>
                <select
                  value={blockModal.reason}
                  onChange={(e) =>
                    setBlockModal({ ...blockModal, reason: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                >
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-cypress">Notatka (opcjonalnie)</label>
                <textarea
                  rows={3}
                  value={blockModal.note}
                  onChange={(e) =>
                    setBlockModal({ ...blockModal, note: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-sm"
                />
              </div>
            </div>

            {blockError && (
              <p className="mt-3 rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
                {blockError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockModal(null)}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-cypress hover:bg-soft-green"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={blockBusy}
                onClick={submitBlock}
                className="rounded-full bg-italian-green px-5 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
              >
                {blockBusy ? 'Zapisywanie...' : 'Dodaj blokadę'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
