/**
 * Tests for `validateApartment` (Wym. 28).
 */

import { describe, expect, it } from 'vitest';

import { validateApartment } from '../apartment';

const VALID = {
  name: 'Casa Orte Uno',
  slug: 'casa-orte-uno',
  maxGuests: 4,
  bedrooms: 2,
  bathrooms: 1,
};

describe('validateApartment', () => {
  it('happy path', () => {
    expect(validateApartment(VALID)).toEqual({ ok: true });
  });

  it('odrzuca slug nie kebab-case', () => {
    const r = validateApartment({ ...VALID, slug: 'Casa Orte' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'slug')).toBe(true);
  });

  it('odrzuca maxGuests < 1', () => {
    const r = validateApartment({ ...VALID, maxGuests: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'maxGuests')).toBe(true);
  });
});
