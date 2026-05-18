"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trash2, Upload } from 'lucide-react';

import type { BlogPost } from '@/lib/data/blog';

interface BlogPostEditorProps {
  post?: BlogPost;
  heroUrl?: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

export function BlogPostEditor({ post, heroUrl }: BlogPostEditorProps) {
  const router = useRouter();
  const isCreate = !post;

  const [slug, setSlug] = useState(post?.slug ?? '');
  const [title, setTitle] = useState(post?.title ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [bodyMd, setBodyMd] = useState(post?.bodyMd ?? '');
  const [authorSignature, setAuthorSignature] = useState(post?.authorSignature ?? '');
  const [published, setPublished] = useState<boolean>(post?.publishedAt !== null && post?.publishedAt !== undefined);
  const [heroPath, setHeroPath] = useState<string | null>(post?.heroImagePath ?? null);
  const [currentHeroUrl, setCurrentHeroUrl] = useState<string | null>(heroUrl ?? null);

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);

  function fieldError(field: string): string | null {
    return errors.find((e) => e.field === field)?.message ?? null;
  }

  async function uploadHero() {
    if (!heroFile) return;
    setUploadingHero(true);
    setServerError(null);
    try {
      const fd = new FormData();
      fd.append('file', heroFile);
      fd.append('kind', 'blog');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setServerError(data.error ?? 'Upload nie powiódł się.');
        return;
      }
      const data = (await res.json()) as { path: string; url: string };
      setHeroPath(data.path);
      setCurrentHeroUrl(data.url);
      setHeroFile(null);
    } finally {
      setUploadingHero(false);
    }
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setSavedAt(null);

    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      excerpt,
      bodyMd,
      authorSignature: authorSignature.trim(),
      heroImagePath: heroPath,
      published,
    };

    if (!payload.slug) {
      setErrors([{ field: 'slug', message: 'Slug jest wymagany' }]);
      return;
    }
    if (!payload.title) {
      setErrors([{ field: 'title', message: 'Tytuł jest wymagany' }]);
      return;
    }
    setErrors([]);
    setSaving(true);

    try {
      const url = isCreate ? '/api/admin/blog' : `/api/admin/blog/${post!.id}`;
      const res = await fetch(url, {
        method: isCreate ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 400) {
        const data = (await res.json()) as { errors?: ValidationError[]; error?: string };
        if (data.errors) setErrors(data.errors);
        else setServerError(data.error ?? 'Niepoprawne dane');
        return;
      }
      if (!res.ok) {
        setServerError('Zapis nie powiódł się.');
        return;
      }
      setSavedAt(new Date().toLocaleTimeString('pl-PL'));
      if (isCreate) {
        const data = (await res.json()) as { id: string };
        router.push(`/admin/blog/${data.id}`);
        return;
      }
      router.refresh();
    } catch {
      setServerError('Brak połączenia.');
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    if (!post) return;
    if (!confirm('Usunąć wpis? Komentarze też znikną.')) return;
    const res = await fetch(`/api/admin/blog/${post.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/blog');
    else alert('Usunięcie nie powiodło się.');
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-flag-white p-6">
        <h2 className="heading-section text-2xl text-ink">Treść</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-cypress">Tytuł</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink" />
            {fieldError('title') && <p className="mt-1 text-xs text-italian-red">{fieldError('title')}</p>}
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-cypress">Slug</label>
            <input id="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 font-mono text-sm text-ink" />
            {fieldError('slug') && <p className="mt-1 text-xs text-italian-red">{fieldError('slug')}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-cypress">Lead (krótki opis na liście)</label>
          <textarea id="excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink" />
        </div>

        <div>
          <label htmlFor="bodyMd" className="block text-sm font-medium text-cypress">Treść (Markdown)</label>
          <textarea id="bodyMd" rows={14} value={bodyMd} onChange={(e) => setBodyMd(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 font-mono text-sm text-ink" />
        </div>

        <div>
          <label htmlFor="authorSignature" className="block text-sm font-medium text-cypress">Podpis autora</label>
          <input id="authorSignature" type="text" value={authorSignature} onChange={(e) => setAuthorSignature(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-ivory px-3 py-2 text-ink" />
        </div>

        <label className="flex items-center gap-3 text-sm text-cypress">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-italian-green" />
          Opublikowany (widoczny na /blog)
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-flag-white p-6">
        <h2 className="heading-section text-2xl text-ink">Zdjęcie hero wpisu</h2>
        {currentHeroUrl ? (
          <div className="space-y-2">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border">
              <Image src={currentHeroUrl} alt="" fill unoptimized className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => {
                setHeroPath(null);
                setCurrentHeroUrl(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-italian-red hover:underline"
            >
              <Trash2 size={12} /> Usuń zdjęcie z wpisu
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">Brak zdjęcia. Możesz dodać poniżej.</p>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label htmlFor="hero" className="block text-sm font-medium text-cypress">
              Wgraj zdjęcie (JPEG/PNG/WebP, do 8 MB)
            </label>
            <input
              id="hero"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
          </div>
          <button
            type="button"
            disabled={!heroFile || uploadingHero}
            onClick={uploadHero}
            className="inline-flex items-center gap-2 rounded-full bg-italian-green px-4 py-2 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50"
          >
            <Upload size={14} />
            {uploadingHero ? 'Wgrywanie...' : 'Wgraj'}
          </button>
        </div>
      </section>

      {serverError && (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {serverError}
        </p>
      )}
      {savedAt && (
        <p className="rounded-lg border border-italian-green/30 bg-soft-green px-3 py-2 text-sm text-italian-green">
          Zapisano o {savedAt}.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-italian-green px-6 py-3 text-sm font-semibold text-flag-white hover:bg-cypress disabled:opacity-50">
          {saving ? 'Zapisywanie...' : isCreate ? 'Utwórz wpis' : 'Zapisz zmiany'}
        </button>
        {!isCreate && (
          <button type="button" onClick={deletePost} className="rounded-full border border-italian-red/40 px-6 py-3 text-sm font-semibold text-italian-red hover:bg-italian-red hover:text-flag-white">
            Usuń wpis
          </button>
        )}
      </div>
    </form>
  );
}
