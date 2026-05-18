/**
 * RTL tests for AvailabilityCalendar (Wym. 7, 8, 46).
 *
 * Cases:
 *   1. Reserved days are NOT clickable and aria-disabled.
 *   2. Pending days are clickable but show a warning banner.
 *   3. Each day exposes an aria-label that contains its status in PL.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AvailabilityCalendar } from '../AvailabilityCalendar';
import type { DayStatusEntry } from '@/lib/types';

const APARTMENT_ID = '11111111-1111-4111-8111-111111111111';

// Build a deterministic dataset for the upcoming 90 days.
function buildDays(overrides: Record<string, DayStatusEntry['status']>): DayStatusEntry[] {
  const out: DayStatusEntry[] = [];
  const start = new Date();
  start.setDate(1);
  for (let i = 0; i < 90; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    out.push({ date: iso, status: overrides[iso] ?? 'available' });
  }
  return out;
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

beforeEach(() => {
  // Default: every day available.
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ days: buildDays({}) }),
  }) as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe('AvailabilityCalendar', () => {
  it('aria-label dni zawiera status w języku polskim', async () => {
    render(
      <AvailabilityCalendar
        apartmentId={APARTMENT_ID}
        apartmentSlug="casa-orte-uno"
        apartmentMaxGuests={4}
      />,
    );

    await waitFor(() => {
      // any day button rendered with PL day word
      const buttons = screen.getAllByRole('button');
      expect(buttons.some((b) => /wolny|zarezerwowany|zablokowany|oczekuje/i.test(b.getAttribute('aria-label') ?? ''))).toBe(true);
    });
  });

  it('zarezerwowanych dni nie da się kliknąć (disabled)', async () => {
    const today = new Date();
    today.setDate(today.getDate() + 5);
    const targetDate = today.toISOString().slice(0, 10);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ days: buildDays({ [targetDate]: 'reserved' }) }),
    }) as unknown as typeof fetch;

    render(
      <AvailabilityCalendar
        apartmentId={APARTMENT_ID}
        apartmentSlug="casa-orte-uno"
        apartmentMaxGuests={4}
      />,
    );

    await waitFor(() => {
      const reservedBtn = screen
        .getAllByRole('button')
        .find((b) => /zarezerwowany/i.test(b.getAttribute('aria-label') ?? ''));
      expect(reservedBtn).toBeDefined();
      expect(reservedBtn).toBeDisabled();
    });
  });

  it('kliknięcie dnia "oczekuje" pokazuje ostrzeżenie', async () => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const targetDate = today.toISOString().slice(0, 10);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ days: buildDays({ [targetDate]: 'pending' }) }),
    }) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(
      <AvailabilityCalendar
        apartmentId={APARTMENT_ID}
        apartmentSlug="casa-orte-uno"
        apartmentMaxGuests={4}
      />,
    );

    let pendingBtn: HTMLElement | undefined;
    await waitFor(() => {
      pendingBtn = screen
        .getAllByRole('button')
        .find((b) => /oczekuje/i.test(b.getAttribute('aria-label') ?? ''));
      expect(pendingBtn).toBeDefined();
    });

    await user.click(pendingBtn!);

    await waitFor(() => {
      // The warning banner uses role="status".
      const status = screen.getByRole('status');
      expect(status.textContent).toMatch(/tymczasowo|oczekuj/i);
    });
  });
});
