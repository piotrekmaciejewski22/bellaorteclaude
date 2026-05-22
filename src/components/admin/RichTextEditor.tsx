"use client";

/**
 * RichTextEditor — Notion-like edytor oparty na BlockNote.
 *
 * BlockNote to edytor zbudowany na Tiptap z UX dokładnie jak w Notion:
 *   - każda linia to „blok" (paragraph, nagłówek, lista, code, quote…)
 *   - po lewej drag-handle do zmiany typu i przeciągania
 *   - „/" w pustej linii otwiera menu poleceń (slash commands)
 *   - selekcja pokazuje formatting toolbar (bold, italic, kolory…)
 *   - obrazki, tabele, code blocks, video — wszystko wbudowane
 *
 * Wynik to HTML — kompatybilny z poprzednim Tiptap, więc istniejące
 * wpisy renderują się bez zmian (`PostBody.tsx` wykrywa HTML/Markdown).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import * as locales from '@blocknote/core/locales';

// Style BlockNote
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

/**
 * Upload obrazka przez nasz endpoint `/api/admin/upload?kind=blog`.
 * BlockNote oczekuje funkcji która zwraca URL.
 */
async function uploadFileViaApi(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('kind', 'blog');
  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Upload nie powiódł się.');
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 12,
}: RichTextEditorProps) {
  const editor = useCreateBlockNote({
    dictionary: locales.pl,
    uploadFile: uploadFileViaApi,
  });

  const initializedRef = useRef(false);
  const [ready, setReady] = useState(false);

  // Ładowanie wartości początkowej (HTML lub markdown).
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function load() {
      try {
        const trimmed = value.trim();
        if (trimmed) {
          if (trimmed.startsWith('<')) {
            const blocks = await editor.tryParseHTMLToBlocks(value);
            editor.replaceBlocks(editor.document, blocks);
          } else {
            const blocks = await editor.tryParseMarkdownToBlocks(value);
            editor.replaceBlocks(editor.document, blocks);
          }
        }
      } catch (err) {
        console.warn('BlockNote initial load:', err);
      } finally {
        setReady(true);
      }
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = useCallback(async () => {
    if (!ready) return;
    try {
      const html = await editor.blocksToFullHTML(editor.document);
      onChange(html);
    } catch (err) {
      console.warn('BlockNote export HTML:', err);
    }
  }, [editor, onChange, ready]);

  return (
    <div
      className="rounded-lg border border-border bg-flag-white"
      style={{ minHeight: `${rows * 1.6}rem` }}
      data-placeholder={placeholder ?? 'Pisz tutaj…'}
    >
      <BlockNoteView editor={editor} onChange={handleChange} theme="light" />
    </div>
  );
}
