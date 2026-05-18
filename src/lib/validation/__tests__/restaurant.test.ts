/**
 * Tests for `validateRestaurant` (Wym. 31, 41).
 */

import { describe, expect, it } from 'vitest';

import { validateRestaurant } from '../restaurant';

const VALID = {
  name: 'Eureka',
  slug: 'eureka',
  region: 'orte_area',
  address: 'Via X 1',
  placeId: 'ChIJabc',
};

describe('validateRestaurant', () => {
  it('happy path z placeId', () => {
    expect(validateRestaurant(VALID)).toEqual({ ok: true });
  });

  it('happy path z latlng', () => {
    expect(
      validateRestaurant({ ...VALID, placeId: undefined, latitude: 42.4, longitude: 12.3 }),
    ).toEqual({ ok: true });
  });

  it('odrzuca brak Map_Data', () => {
    const r = validateRestaurant({ ...VALID, placeId: undefined });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'placeId')).toBe(true);
  });
});
