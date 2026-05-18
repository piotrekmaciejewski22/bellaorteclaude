/**
 * Unit tests for the in-memory rate limiter (task 4.2).
 *
 * Wymagania pokrywane:
 *   - 12 #4–#5 (10 req / 10 min na IP, 429 po przekroczeniu) — kontrakt
 *     `checkRateLimit` (allowed/retryAfter).
 *   - 23 #7 (rate limit dla review API) — ten sam kontrakt.
 *   - 26   (admin / generyczne wymagania bezpieczeństwa) — `getClientIp`.
 *   - 44   (walidacja serwerowa) — argument validation.
 */

import { afterEach, describe, expect, it } from 'vitest';

import {
  _resetRateLimitStoreForTests,
  checkRateLimit,
  getClientIp,
} from '../memory-store';

afterEach(() => {
  _resetRateLimitStoreForTests();
});

describe('checkRateLimit', () => {
  it('w oknie 1s, limit 3, czwarte żądanie jest odrzucone', () => {
    const key = 'booking-inquiries:203.0.113.7';
    const limit = 3;
    const windowMs = 1_000;

    const r1 = checkRateLimit(key, limit, windowMs);
    const r2 = checkRateLimit(key, limit, windowMs);
    const r3 = checkRateLimit(key, limit, windowMs);
    const r4 = checkRateLimit(key, limit, windowMs);

    expect(r1).toEqual({ allowed: true });
    expect(r2).toEqual({ allowed: true });
    expect(r3).toEqual({ allowed: true });

    expect(r4.allowed).toBe(false);
    if (r4.allowed === false) {
      // Retry-After is delta-seconds, must be a positive integer suitable
      // for the HTTP header (RFC 9110 §10.2.3).
      expect(Number.isInteger(r4.retryAfter)).toBe(true);
      expect(r4.retryAfter).toBeGreaterThanOrEqual(1);
      expect(r4.retryAfter).toBeLessThanOrEqual(1);
    }
  });

  it('różne klucze mają niezależne kubełki', () => {
    const limit = 2;
    const windowMs = 60_000;

    expect(checkRateLimit('a', limit, windowMs).allowed).toBe(true);
    expect(checkRateLimit('a', limit, windowMs).allowed).toBe(true);
    // `a` jest już wyczerpane, ale `b` nadal ma pełen budżet.
    expect(checkRateLimit('a', limit, windowMs).allowed).toBe(false);
    expect(checkRateLimit('b', limit, windowMs).allowed).toBe(true);
    expect(checkRateLimit('b', limit, windowMs).allowed).toBe(true);
    expect(checkRateLimit('b', limit, windowMs).allowed).toBe(false);
  });

  it('odrzuca nieprawidłowe argumenty', () => {
    expect(() => checkRateLimit('k', 0, 1_000)).toThrow(RangeError);
    expect(() => checkRateLimit('k', -1, 1_000)).toThrow(RangeError);
    expect(() => checkRateLimit('k', 3, 0)).toThrow(RangeError);
    expect(() => checkRateLimit('k', 3, -100)).toThrow(RangeError);
  });
});

describe('getClientIp', () => {
  function makeRequest(headers: Record<string, string>): { headers: Headers } {
    return { headers: new Headers(headers) };
  }

  it('preferuje pierwszy wpis z X-Forwarded-For', () => {
    const request = makeRequest({
      'x-forwarded-for': '198.51.100.10, 10.0.0.1, 10.0.0.2',
      'x-real-ip': '10.0.0.99',
    });

    expect(getClientIp(request)).toBe('198.51.100.10');
  });

  it('używa X-Real-IP gdy brak X-Forwarded-For', () => {
    const request = makeRequest({ 'x-real-ip': '198.51.100.20' });
    expect(getClientIp(request)).toBe('198.51.100.20');
  });

  it("zwraca 'unknown' gdy nie ma żadnego nagłówka identyfikującego klienta", () => {
    const request = makeRequest({});
    expect(getClientIp(request)).toBe('unknown');
  });

  it('ignoruje pusty X-Forwarded-For i wpada na X-Real-IP', () => {
    const request = makeRequest({
      'x-forwarded-for': '   ',
      'x-real-ip': '198.51.100.30',
    });
    expect(getClientIp(request)).toBe('198.51.100.30');
  });
});
