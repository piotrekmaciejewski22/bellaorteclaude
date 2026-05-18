import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { BlogPostEditor } from '@/components/admin/BlogPostEditor';

export default function NewBlogPostPage() {
  return (
    <div>
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress">
        <ArrowLeft size={14} /> Powrót do listy
      </Link>
      <header className="my-6">
        <p className="text-eyebrow">Nowy wpis</p>
        <h1 className="heading-display mt-2 text-3xl text-ink">Stwórz wpis blogowy</h1>
      </header>
      <BlogPostEditor />
    </div>
  );
}
