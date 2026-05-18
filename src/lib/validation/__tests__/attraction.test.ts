/**
 * Tests for `validateAttraction` (Wym. 32, 41).
 */

import { describe, expect, it } from 'vitest';

import { validateAttraction } from '../attraction';

const VALID = {
  name: 'Orte Sotterranea',
  slug: 'orte-sotterranea',
  region: 'orte_area',
  address: 'Via X 1',
  latitude: 42.4,
  longitude: 12.3,
};

describe('validateAttraction', () => {
  it('happy path', () => {
    expect(validateAttraction(VALID)).toEqual({ ok: true });
  });

  it('odrzuca latitude bez longitude', () => {
    const r = validateAttraction({ ...VALID, longitude: undefined });
    expect(r.ok).toBe(false);
  });

  it('odrzuca region spoza enuma', () => {
    const r = validateAttraction({ ...VALID, region: 'london' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'region')).toBe(true);
  });
});
