"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  validateBlogComment,
  type ValidationError,
} from '@/lib/validation/blog-comment';

interface CommentFormProps {
  postId: string;
  consentText: string;
}

export function CommentForm({ postId, consentText }: CommentFormProps) {
  const router = useRouter();
  const [signature, setSignature] = useState('');
  const [body, setBody] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  function fieldError(field: string): string | null {
    return errors.find((e) => e.field === field)?.message ?? null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);

    const payload = { postId, signature, body, consent };
    const result = validateBlogComment(payload);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setPending(true);

    try {
      const res = await fetch('/api/blog-comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 400) {
        const data = (await res.json()) as { errors?: ValidationError[] };
        if (data.errors) setErrors(data.errors);
        else setServerError('Niepoprawne dane');
        setPending(false);
        return;
      }
      if (res.status === 429) {
        setServerError('Zbyt wiele prób. Spróbuj ponownie za chwilę.');
        setPending(false);
        return;
      }
      if (!res.ok) {
        setServerError('Nie udało się zapisać komentarza.');
        setPending(false);
        return;
      }
      setSuccess(true);
      setSignature('');
      setBody('');
      setConsent(false);
      router.refresh();
    } catch {
      setServerError('Brak połączenia.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-flag-white p-5">
      <div>
        <label htmlFor="comment-signature" className="block text-sm font-medium text-cypress">
          Twój podpis
        </label>
        <input
          id="comment-signature"
          type="text"
          maxLength={60}
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
        />
        {fieldError('signature') && (
          <p className="mt-1 text-xs text-italian-red">{fieldError('signature')}</p>
        )}
      </div>

      <div>
        <label htmlFor="comment-body" className="block text-sm font-medium text-cypress">
          Komentarz
        </label>
        <textarea
          id="comment-body"
          rows={4}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink"
        />
        <p className="mt-1 text-xs text-muted">{body.length}/2000</p>
        {fieldError('body') && (
          <p className="mt-1 text-xs text-italian-red">{fieldError('body')}</p>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm text-cypress">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 accent-italian-green"
        />
        <span>{consentText}</span>
      </label>
      {fieldError('consent') && (
        <p className="text-xs text-italian-red">{fieldError('consent')}</p>
      )}

      {serverError && (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {serverError}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-italian-green/30 bg-soft-green px-3 py-2 text-sm text-italian-green">
          Dziękujemy! Komentarz czeka na moderację.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-italian-green px-5 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
      >
        {pending ? 'Wysyłanie...' : 'Dodaj komentarz'}
      </button>
    </form>
  );
}
