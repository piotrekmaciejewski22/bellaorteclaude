/**
 * Tests for `validateGuestPhoto` (Wym. 24).
 */

import { describe, expect, it } from 'vitest';

import { validateGuestPhoto } from '../guest-photo';

const FILE_OK = { name: 'photo.jpg', type: 'image/jpeg', size: 1024 * 1024 };

const PAYLOAD_OK = {
  targetType: 'restaurant',
  targetId: '11111111-1111-4111-8111-111111111111',
};

describe('validateGuestPhoto', () => {
  it('happy path', () => {
    expect(validateGuestPhoto(FILE_OK, PAYLOAD_OK)).toEqual({ ok: true });
  });

  it('odrzuca plik > 8MB', () => {
    const r = validateGuestPhoto(
      { ...FILE_OK, size: 9 * 1024 * 1024 },
      PAYLOAD_OK,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'file')).toBe(true);
  });

  it('odrzuca niedozwolony MIME', () => {
    const r = validateGuestPhoto(
      { ...FILE_OK, type: 'application/pdf' },
      PAYLOAD_OK,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.field === 'file')).toBe(true);
  });
});
