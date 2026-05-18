/**
 * Blog data layer — posts + comments.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ModerationStatus } from '@/lib/types';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
  heroImagePath: string | null;
  authorSignature: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  signature: string;
  body: string;
  status: ModerationStatus;
  createdAt: string;
}

interface PostRow {
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
}

interface CommentRow {
  id: string;
  post_id: string;
  signature: string;
  body: string;
  status: ModerationStatus;
  created_at: string;
}

const POST_COLUMNS =
  'id, slug, title, excerpt, body_md, hero_image_path, author_signature, published_at, created_at, updated_at';

function mapPost(row: PostRow): BlogPost {
  return {
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
}

function mapComment(row: CommentRow): BlogComment {
  return {
    id: row.id,
    postId: row.post_id,
    signature: row.signature,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getBlogPosts(
  client: SupabaseClient,
  opts: { includeUnpublished?: boolean; limit?: number } = {},
): Promise<BlogPost[]> {
  let query = client.from('blog_posts').select(POST_COLUMNS);
  if (!opts.includeUnpublished) {
    query = query.not('published_at', 'is', null);
  }
  query = query.order('published_at', { ascending: false, nullsFirst: false });
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw new Error(`getBlogPosts: ${error.message}`);
  return (data ?? []).map((r) => mapPost(r as PostRow));
}

export async function getBlogPostBySlug(
  client: SupabaseClient,
  slug: string,
  opts: { includeUnpublished?: boolean } = {},
): Promise<BlogPost | null> {
  let query = client.from('blog_posts').select(POST_COLUMNS).eq('slug', slug);
  if (!opts.includeUnpublished) {
    query = query.not('published_at', 'is', null);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`getBlogPostBySlug: ${error.message}`);
  return data ? mapPost(data as PostRow) : null;
}

export async function getApprovedComments(
  client: SupabaseClient,
  postId: string,
): Promise<BlogComment[]> {
  const { data, error } = await client
    .from('blog_comments')
    .select('id, post_id, signature, body, status, created_at')
    .eq('post_id', postId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`getApprovedComments: ${error.message}`);
  return (data ?? []).map((r) => mapComment(r as CommentRow));
}
