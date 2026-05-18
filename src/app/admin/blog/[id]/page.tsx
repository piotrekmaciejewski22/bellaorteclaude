import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { createServerClient } from '@/lib/supabase/server';
import { BlogPostEditor } from '@/components/admin/BlogPostEditor';
import { publicSiteMediaUrl } from '@/lib/data/apartments';

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const client = await createServerClient();
  const { data, error } = await client
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, body_md, hero_image_path, author_signature, published_at, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) notFound();

  type Row = {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    body_md: string;
    hero_image_path: string | null;
    author_signature: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const row = data as Row;
  const post = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    bodyMd: row.body_md,
    heroImagePath: row.hero_image_path,
    authorSignature: row.author_signature,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  const heroUrl = post.heroImagePath ? publicSiteMediaUrl(post.heroImagePath) : null;

  return (
    <div>
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress">
        <ArrowLeft size={14} /> Powrót do listy
      </Link>
      <header className="my-6">
        <p className="text-eyebrow">Edycja wpisu</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">{post.title}</h1>
      </header>
      <BlogPostEditor post={post} heroUrl={heroUrl} />
    </div>
  );
}
