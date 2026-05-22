export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Newspaper } from 'lucide-react';

import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { OrnamentSimple } from '@/components/public/decorative/Ornament';
import { BlogFilters } from '@/components/public/BlogFilters';
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
    <div className="bg-crema">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Wydanie · Blog</span>
          <TricoloreRule size="md" />
        </div>

        <h1 className="heading-display mt-5 text-5xl text-ink md:text-7xl">
          Notatki <span className="italic text-olive">z Orte</span>
        </h1>
        <p className="text-motto mt-3 text-lg md:text-xl">— il diario di Bellaorte —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Krótkie wpisy o tym, co u nas — jedzenie, sąsiedzi, pogoda, miejsca,
          które właśnie odkryliśmy. Pisze siostra, redaguje rodzina.
        </p>

        <SectionDivider motto="ogni giorno una storia" />

        {posts.length === 0 ? (
          <div className="border border-gold/30 bg-flag-white p-10 text-center">
            <OrnamentSimple className="mx-auto h-3 w-32 text-gold" />
            <p className="font-display italic mt-5 text-2xl text-stone">
              Pagina ancora bianca.
            </p>
            <p className="mt-2 text-sm text-muted">
              Pierwszy wpis pojawi się tutaj wkrótce.
            </p>
          </div>
        ) : (
          <BlogFilters posts={posts}>
            <ul className="space-y-12">
              {posts.map((post, idx) => (
                <li key={post.id} data-post-id={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group grid items-center gap-8 md:grid-cols-[280px,1fr]"
                  >
                    {post.heroImagePath ? (
                      <div className="relative">
                        <div aria-hidden="true" className="absolute -inset-2 -z-10 border border-gold/30" />
                        <div className="relative aspect-[4/3] overflow-hidden bg-paper">
                          <Image
                            src={publicSiteMediaUrl(post.heroImagePath)}
                            alt=""
                            fill
                            unoptimized
                            sizes="(min-width: 768px) 280px, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center border border-gold/30 bg-paper text-stone">
                        <Newspaper size={48} aria-hidden="true" />
                      </div>
                    )}
                    <div>
                      <p className="text-eyebrow text-gold">
                        Nr {idx + 1} · {formatDate(post.publishedAt)}
                      </p>
                      <h2 className="heading-section mt-2 text-3xl text-ink md:text-4xl group-hover:text-terracotta">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-ui mt-3 text-cypress/85">{post.excerpt}</p>
                      )}
                      {post.tags.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <li
                              key={tag}
                              className="rounded-full border border-gold/40 px-2.5 py-0.5 text-[11px] font-display text-stone"
                            >
                              #{tag}
                            </li>
                          ))}
                        </ul>
                      )}
                      {post.authorSignature && (
                        <p className="font-display mt-3 text-sm italic text-stone">
                          — {post.authorSignature}
                        </p>
                      )}
                      <span className="link-italic mt-4 inline-flex items-center gap-1 font-display italic text-terracotta">
                        Czytaj <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </BlogFilters>
        )}
      </div>
    </div>
  );
}
