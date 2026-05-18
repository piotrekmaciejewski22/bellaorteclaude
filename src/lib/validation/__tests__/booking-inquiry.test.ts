/**
 * Tests for `validateBookingInquiry` (Wym. 10).
 */

import { describe, expect, it } from 'vitest';

import { validateBookingInquiry } from '../booking-inquiry';

const APARTMENT = { id: '11111111-1111-4111-8111-111111111111', maxGuests: 4 };

function fixedNow(): Date {
  return new Date('2026-01-01T00:00:00Z');
}

const VALID = {
  apartmentId: APARTMENT.id,
  checkIn: '2026-06-01',
  checkOut: '2026-06-05',
  adults: 2,
  children: 0,
  fullName: 'Jan Kowalski',
  email: 'jan@example.com',
  consent: true,
};

describe('validateBookingInquiry', () => {
  it('happy path zwraca ok', () => {
    expect(validateBookingInquiry(VALID, APARTMENT, fixedNow())).toEqual({ ok: true });
  });

  it('odrzuca brakujące pola wymagane', () => {
    const r = validateBookingInquiry({}, APARTMENT, fixedNow());
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const fields = r.errors.map((e) => e.field);
      expect(fields).toContain('apartmentId');
      expect(fields).toContain('checkIn');
      expect(fields).toContain('checkOut');
      expect(fields).toContain('adults');
      expect(fields).toContain('fullName');
      expect(fields).toContain('email');
      expect(fields).toContain('consent');
    }
  });

  it('odrzuca checkOut <= checkIn', () => {
    const r = validateBookingInquiry(
      { ...VALID, checkIn: '2026-06-05', checkOut: '2026-06-05' },
      APARTMENT,
      fixedNow(),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'checkOut')).toBe(true);
  });

  it('odrzuca checkIn w przeszłości', () => {
    const r = validateBookingInquiry(
      { ...VALID, checkIn: '2025-01-01', checkOut: '2025-01-05' },
      APARTMENT,
      fixedNow(),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'checkIn')).toBe(true);
  });

  it('odrzuca niepoprawny email', () => {
    const r = validateBookingInquiry(
      { ...VALID, email: 'nopejak' },
      APARTMENT,
      fixedNow(),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'email')).toBe(true);
  });

  it('odrzuca adults < 1', () => {
    const r = validateBookingInquiry({ ...VALID, adults: 0 }, APARTMENT, fixedNow());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'adults')).toBe(true);
  });

  it('odrzuca adults+children > maxGuests', () => {
    const r = validateBookingInquiry(
      { ...VALID, adults: 4, children: 2 },
      APARTMENT,
      fixedNow(),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'adults')).toBe(true);
  });

  it('odrzuca consent !== true', () => {
    const r = validateBookingInquiry(
      { ...VALID, consent: false },
      APARTMENT,
      fixedNow(),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'consent')).toBe(true);
  });
});
