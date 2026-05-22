export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';

import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { OrnamentSimple } from '@/components/public/decorative/Ornament';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
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
    <div className="bg-crema">
      <article className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/blog"
          className="link-italic inline-flex items-center gap-1 font-display italic text-terracotta hover:text-wine"
        >
          <ArrowLeft size={14} /> Wróć do bloga
        </Link>

        <header className="mt-10 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-eyebrow text-gold">{formatDate(post.publishedAt)}</span>
            <TricoloreRule size="sm" />
          </div>
          <h1 className="heading-display mt-5 text-4xl text-ink md:text-6xl">
            {post.title}
          </h1>
          {post.authorSignature && (
            <p className="font-display mt-4 text-base italic text-stone">
              — {post.authorSignature}
            </p>
          )}
          <OrnamentSimple className="mx-auto mt-7 h-3 w-32 text-gold" />
        </header>

        {heroUrl && (
          <div className="relative mt-10">
            <div aria-hidden="true" className="absolute -inset-3 -z-10 border border-gold/40" />
            <div className="relative aspect-[16/9] overflow-hidden bg-paper">
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
            <p className="mt-3 text-center font-display text-xs italic text-stone">
              {post.title}
            </p>
          </div>
        )}

        <div className="markdown-body mt-12">
          <ReactMarkdown>{post.bodyMd || post.excerpt}</ReactMarkdown>
        </div>

        <SectionDivider motto="conversazione" />

        <section>
          <p className="text-eyebrow text-gold">Komentarze</p>
          <h2 className="heading-section mt-2 text-3xl text-ink">
            Co inni <span className="italic text-olive">napisali</span>
          </h2>

          {comments.length === 0 ? (
            <p className="font-display mt-6 text-lg italic text-stone">
              Pagina ancora bianca — bądź pierwszy.
            </p>
          ) : (
            <ul className="mt-8 space-y-5">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="border border-gold/30 bg-flag-white p-5 shadow-warm"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="font-display text-lg text-ink">{c.signature}</p>
                    <p className="text-xs text-muted">{formatDate(c.createdAt)}</p>
                  </div>
                  <p className="text-ui mt-3 whitespace-pre-line text-sm text-cypress/85">
                    {c.body}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <h3 className="font-display mt-12 text-2xl text-ink">
            Dodaj komentarz
          </h3>
          <p className="text-motto mt-2 text-base">— lascia un commento —</p>
          <p className="text-ui mt-2 text-sm text-cypress/80">
            Komentarz pojawi się po moderacji.
          </p>
          <div className="mt-5">
            <CommentForm postId={post.id} consentText={consentText} />
          </div>
        </section>
      </article>
    </div>
  );
}
