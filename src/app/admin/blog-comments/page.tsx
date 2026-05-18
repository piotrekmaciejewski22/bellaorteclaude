/**
 * `/admin/blog-comments` — moderacja komentarzy bloga.
 */

import { createServerClient } from '@/lib/supabase/server';
import { CommentModerationQueue } from '@/components/admin/CommentModerationQueue';

export default async function AdminBlogCommentsPage() {
  const client = await createServerClient();
  const { data, error } = await client
    .from('blog_comments')
    .select(
      'id, signature, body, status, created_at, post_id, blog_posts:post_id (title, slug)',
    )
    .order('created_at', { ascending: false });

  type Joined = {
    id: string;
    signature: string;
    body: string;
    status: string;
    created_at: string;
    post_id: string;
    blog_posts: { title: string; slug: string } | { title: string; slug: string }[] | null;
  };

  function postOf(rel: Joined['blog_posts']): { title: string; slug: string } {
    if (!rel) return { title: '(brak)', slug: '' };
    if (Array.isArray(rel)) return rel[0] ?? { title: '(brak)', slug: '' };
    return rel;
  }

  const rows = error
    ? []
    : (data as Joined[]).map((row) => {
        const post = postOf(row.blog_posts);
        return {
          id: row.id,
          signature: row.signature,
          body: row.body,
          status: row.status,
          createdAt: row.created_at,
          postTitle: post.title,
          postSlug: post.slug,
        };
      });

  return (
    <div>
      <header className="mb-8">
        <p className="text-eyebrow">Moderacja</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Komentarze pod blogiem</h1>
      </header>

      {error ? (
        <p className="rounded-lg border border-italian-red/30 bg-italian-red/10 px-3 py-2 text-sm text-italian-red">
          {error.message}
        </p>
      ) : (
        <CommentModerationQueue rows={rows} />
      )}
    </div>
  );
}
