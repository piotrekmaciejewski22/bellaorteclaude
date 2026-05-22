/**
 * PostBody — renderuje treść wpisu bloga lub wydarzenia.
 *
 * Stare wpisy są w Markdown (z tabeli body_md), nowe wpisy z edytora
 * Tiptap zapisują się jako HTML. Wykrywamy format po pierwszym znaku:
 * jeśli zaczyna się od `<` to HTML, inaczej markdown.
 *
 * HTML jest renderowany przez `dangerouslySetInnerHTML` (Tiptap dba o
 * sanityzację) — zaufanie tylko do treści wpisanych przez admina.
 */

import ReactMarkdown from 'react-markdown';

interface PostBodyProps {
  content: string;
  className?: string;
}

function isHtml(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('<');
}

export function PostBody({ content, className }: PostBodyProps) {
  if (!content) return null;

  if (isHtml(content)) {
    return (
      <div
        className={className ?? 'markdown-body'}
        // Treść pochodzi tylko z panelu admina (auth + RLS), więc dangerously
        // jest świadome — Tiptap zapisuje czysty HTML bez script tagów.
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={className ?? 'markdown-body'}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
