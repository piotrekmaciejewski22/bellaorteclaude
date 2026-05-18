/**
 * Tests for `validateReview` (Wym. 23).
 */

import { describe, expect, it } from 'vitest';

import { validateReview } from '../review';

const VALID = {
  targetType: 'restaurant',
  targetId: '11111111-1111-4111-8111-111111111111',
  signature: 'Jan',
  rating: 5,
  body: 'Bardzo polecam, świetne miejsce z dobrą atmosferą.',
  consent: true,
};

describe('validateReview', () => {
  it('happy path', () => {
    expect(validateReview(VALID)).toEqual({ ok: true });
  });

  it('odrzuca signature < 2 znaki', () => {
    const r = validateReview({ ...VALID, signature: 'A' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'signature')).toBe(true);
  });

  it('odrzuca body < 10 znaków', () => {
    const r = validateReview({ ...VALID, body: 'krótko' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'body')).toBe(true);
  });

  it('odrzuca rating poza 1..5', () => {
    const r = validateReview({ ...VALID, rating: 6 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'rating')).toBe(true);
  });

  it('odrzuca błędny targetType', () => {
    const r = validateReview({ ...VALID, targetType: 'apartment' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'targetType')).toBe(true);
  });
});
