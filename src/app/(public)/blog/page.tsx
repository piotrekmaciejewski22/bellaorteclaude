export const dynamic = 'force-dynamic';

/**
 * `/blog` — list of published blog posts.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

import { createServerClient } from '@/lib/supabase/server';
import { getBlogPosts } from '@/lib/data/blog';
import { publicSiteMediaUrl } from '@/lib/data/apartments';
import type { BlogPost } from '@/lib/data/blog';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function BlogIndexPage() {
  let posts: BlogPost[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const client = await createServerClient();
      posts = await getBlogPosts(client);
    } catch (err) {
      console.warn('blog list:', err);
    }
  }

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-eyebrow">Blog</p>
        <h1 className="heading-display mt-2 text-5xl text-ink md:text-6xl">
          Notatki z Orte
        </h1>
        <p className="text-ui mt-6 max-w-2xl text-cypress/80">
          Krótkie wpisy o tym, co u nas — jedzenie, sąsiedzi, pogoda, miejsca,
          które właśnie odkryliśmy. Pisze siostra, redaguje rodzina.
        </p>

        {posts.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-border bg-flag-white p-6 text-sm text-muted">
            Pierwszy wpis pojawi się tutaj wkrótce.
          </p>
        ) : (
          <ul className="mt-12 space-y-8">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group grid gap-6 rounded-2xl border border-border bg-flag-white p-5 transition-shadow hover:shadow-md md:grid-cols-[280px,1fr]"
                >
                  {post.heroImagePath && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                      <Image
                        src={publicSiteMediaUrl(post.heroImagePath)}
                        alt={post.title}
                        fill
                        unoptimized
                        sizes="(min-width: 768px) 280px, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className={post.heroImagePath ? '' : 'md:col-span-2'}>
                    <p className="text-eyebrow">{formatDate(post.publishedAt)}</p>
                    <h2 className="heading-section mt-1 text-3xl text-ink group-hover:text-italian-green">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-ui mt-3 text-cypress/85">{post.excerpt}</p>
                    )}
                    {post.authorSignature && (
                      <p className="mt-3 text-xs text-muted">— {post.authorSignature}</p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-italian-green">
                      Czytaj <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
