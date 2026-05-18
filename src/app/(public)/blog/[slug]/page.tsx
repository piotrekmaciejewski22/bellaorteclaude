/**
 * `/blog/[slug]` — single blog post with comments.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';

import { createServerClient } from '@/lib/supabase/server';
import { getBlogPostBySlug, getApprovedComments } from '@/lib/data/blog';
import { getSiteSettings } from '@/lib/data/settings';
import { publicSiteMediaUrl } from '@/lib/data/apartments';
import { CommentForm } from '@/components/public/CommentForm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const FALLBACK_CONSENT =
  'Oświadczam, że treść komentarza jest moja i wyrażam zgodę na publikację po moderacji.';

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    notFound();
  }

  const client = await createServerClient();
  const post = await getBlogPostBySlug(client, slug);
  if (!post) notFound();

  const [comments, settings] = await Promise.all([
    getApprovedComments(client, post.id),
    getSiteSettings(client),
  ]);

  const consentText = settings?.consentTextReview || FALLBACK_CONSENT;
  const heroUrl = post.heroImagePath ? publicSiteMediaUrl(post.heroImagePath) : null;

  return (
    <div className="bg-ivory">
      <article className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
        >
          <ArrowLeft size={14} /> Wróć do bloga
        </Link>

        <header className="mt-6">
          <p className="text-eyebrow">{formatDate(post.publishedAt)}</p>
          <h1 className="heading-display mt-2 text-4xl text-ink md:text-5xl">
            {post.title}
          </h1>
          {post.authorSignature && (
            <p className="mt-3 text-sm text-muted">— {post.authorSignature}</p>
          )}
        </header>

        {heroUrl && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border">
            <Image
              src={heroUrl}
              alt={post.title}
              fill
              priority
              unoptimized
              sizes="(min-width: 1024px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="markdown-body mt-10">
          <ReactMarkdown>{post.bodyMd || post.excerpt}</ReactMarkdown>
        </div>

        <hr className="mt-12 border-border" />

        <section className="mt-12">
          <h2 className="heading-section text-2xl text-ink">Komentarze</h2>

          {comments.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Brak komentarzy. Bądź pierwszy.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-border bg-flag-white p-4"
                >
                  <p className="font-display text-base text-ink">{c.signature}</p>
                  <p className="text-ui mt-1 whitespace-pre-line text-sm text-cypress/85">
                    {c.body}
                  </p>
                  <p className="mt-2 text-xs text-muted">{formatDate(c.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}

          <h3 className="heading-section mt-10 text-xl text-ink">Dodaj komentarz</h3>
          <p className="text-ui mt-2 text-sm text-cypress/80">
            Komentarz pojawi się po moderacji.
          </p>
          <div className="mt-4">
            <CommentForm postId={post.id} consentText={consentText} />
          </div>
        </section>
      </article>
    </div>
  );
}
