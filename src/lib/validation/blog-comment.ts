/**
 * Validation for blog comments.
 *
 * Wymagania: 23 (rate limit + moderacja), 25, 44.
 */

export interface BlogCommentPayload {
  postId?: unknown;
  signature?: unknown;
  body?: unknown;
  consent?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateBlogComment(payload: BlogCommentPayload): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof payload.postId !== 'string' || !UUID_RE.test(payload.postId)) {
    errors.push({ field: 'postId', message: 'Nieprawidłowy identyfikator wpisu' });
  }

  if (typeof payload.signature !== 'string') {
    errors.push({ field: 'signature', message: 'Pole jest wymagane' });
  } else {
    const len = payload.signature.trim().length;
    if (len < 2 || len > 60) {
      errors.push({ field: 'signature', message: 'Podpis musi mieć od 2 do 60 znaków' });
    }
  }

  if (typeof payload.body !== 'string') {
    errors.push({ field: 'body', message: 'Pole jest wymagane' });
  } else {
    const len = payload.body.trim().length;
    if (len < 5 || len > 2000) {
      errors.push({ field: 'body', message: 'Komentarz musi mieć od 5 do 2000 znaków' });
    }
  }

  if (payload.consent !== true) {
    errors.push({ field: 'consent', message: 'Wymagana zgoda na publikację' });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true };
}
