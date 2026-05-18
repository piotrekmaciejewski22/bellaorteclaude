"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, Trash2 } from 'lucide-react';

interface HeroUploaderProps {
  currentUrl: string | null;
}

export function HeroUploader({ currentUrl }: HeroUploaderProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);

    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/hero', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Upload nie powiódł się.');
        return;
      }
      setFile(null);
      router.refresh();
    } catch {
      setError('Brak połączenia.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Usunąć aktualne zdjęcie hero? Strona główna wróci do placeholdera.')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/hero', { method: 'DELETE' });
      if (res.ok) router.refresh();
      else setError('Usunięcie nie powiodło się.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-flag-white p-5">
      {currentUrl ? (
        <div className="space-y-3">
          <p className="text-eyebrow">Aktualne zdjęcie</p>
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border">
            <Image src={currentUrl} alt="Aktualny hero" fill unoptimized className="object-cover" />
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-italian-red/40 px-4 py-2 text-xs font-semibold text-italian-red hover:bg-italian-red hover:text-flag-white disabled:opacity-50"
          >
            <Trash2 size={14} /> Usuń zdjęcie
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Brak własnego hero. Strona używa domyślnego placeholderu.
        </p>
      )}

      <form onSubmit={upload} className="mt-5 flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label htmlFor="hero-file" className="block text-sm font-medium text-cypress">
            Wgraj nowe (JPEG/PNG/WebP, do 8 MB)
          </label>
          <input
            id="hero-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!file || busy}
          className="inline-flex items-center gap-2 rounded-full bg-italian-green px-5 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
        >
          <Upload size={14} />
          {busy ? 'Wysyłanie...' : 'Wgraj'}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {error}
        </p>
      )}
    </div>
  );
}
