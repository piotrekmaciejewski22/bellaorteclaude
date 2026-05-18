"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { signInAdmin } from './actions';

interface LoginFormProps {
  next: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signInAdmin(email, password);
      if (!result.ok) {
        setError(result.error ?? 'Wystąpił błąd');
        return;
      }
      router.push(next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-cypress"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-cypress"
        >
          Hasło
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-italian-green px-6 py-3 text-sm font-semibold text-flag-white transition-colors hover:bg-cypress disabled:opacity-50"
      >
        {pending ? 'Logowanie...' : 'Zaloguj się'}
      </button>
    </form>
  );
}
