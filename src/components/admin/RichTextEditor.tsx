"use client";

/**
 * RichTextEditor — WYSIWYG edytor oparty na Tiptap.
 *
 * Toolbar po polsku: bold, italic, underline, nagłówki H2/H3, listy
 * punktowane i numerowane, link, wyrównanie, kolor tekstu, cofnij/ponów.
 * Wynik to HTML — zapisujemy do tej samej kolumny `body_md` co poprzednio
 * (treść markdownowa też się tam wyświetli prawidłowo, bo
 * `react-markdown` po stronie publicznej ignoruje HTML, ale my
 * renderujemy ten HTML bezpośrednio przez `dangerouslySetInnerHTML`
 * w widokach które używają nowego edytora).
 */

import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Image as TiptapImage } from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Quote,
  Palette,
  ImagePlus,
} from 'lucide-react';
import { useRef, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

const COLORS = [
  { name: 'Domyślny', value: '#2a2a28' },
  { name: 'Oliwka', value: '#5b6342' },
  { name: 'Terakota', value: '#b85c38' },
  { name: 'Złoty', value: '#b08a3e' },
  { name: 'Wino', value: '#7a2c2c' },
  { name: 'Stone', value: '#7d7560' },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 12,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-terracotta underline hover:text-wine',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg my-6 max-w-full h-auto',
        },
      }),
    ],
    content: value || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none rounded-b-lg border border-t-0 border-border bg-flag-white px-4 py-3 focus:outline-none focus:border-italian-green focus:ring-2 focus:ring-italian-green/20',
        style: `min-height: ${rows * 1.6}rem;`,
        'data-placeholder': placeholder ?? 'Pisz tutaj…',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="rounded-lg border border-border bg-flag-white p-4 text-sm text-muted">
        Ładowanie edytora…
      </div>
    );
  }

  function setLink() {
    const previousUrl = editor!.getAttributes('link').href as string | undefined;
    const url = window.prompt('Wpisz adres URL', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor!
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  }

  async function uploadAndInsertImage(file: File) {
    if (!editor) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', 'blog');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? 'Upload nie powiódł się.');
        return;
      }
      const data = (await res.json()) as { url: string };
      editor.chain().focus().setImage({ src: data.url, alt: '' }).run();
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="rounded-lg border border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 rounded-t-lg border-b border-border bg-soft-green/40 p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="Pogrubienie (Ctrl+B)"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="Kursywa (Ctrl+I)"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          label="Podkreślenie (Ctrl+U)"
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          label="Nagłówek H2"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          label="Nagłówek H3"
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="Lista punktowana"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="Lista numerowana"
        >
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          label="Cytat"
        >
          <Quote size={14} />
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          label="Wyrównaj do lewej"
        >
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          label="Wyśrodkuj"
        >
          <AlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          label="Wyrównaj do prawej"
        >
          <AlignRight size={14} />
        </ToolbarButton>

        <Separator />

        <ToolbarButton onClick={setLink} active={editor.isActive('link')} label="Dodaj link">
          <LinkIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          label="Usuń link"
        >
          <Unlink size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          label={uploadingImage ? 'Wgrywanie zdjęcia…' : 'Wstaw zdjęcie do treści'}
        >
          <ImagePlus size={14} />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAndInsertImage(file);
            e.target.value = '';
          }}
        />

        <Separator />

        <div className="relative inline-flex">
          <details className="group">
            <summary
              className="inline-flex h-8 cursor-pointer list-none items-center gap-1 rounded px-2 text-cypress hover:bg-flag-white"
              title="Kolor tekstu"
            >
              <Palette size={14} />
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full border border-border"
                style={{
                  backgroundColor:
                    (editor.getAttributes('textStyle').color as string | undefined) ?? '#2a2a28',
                }}
              />
            </summary>
            <div className="absolute left-0 top-9 z-20 grid grid-cols-3 gap-1 rounded-lg border border-border bg-flag-white p-2 shadow-warm">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => editor.chain().focus().setColor(c.value).run()}
                  className="h-7 w-7 rounded-full border border-border transition-transform hover:scale-110"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
              <button
                type="button"
                onClick={() => editor.chain().focus().unsetColor().run()}
                className="col-span-3 mt-1 rounded border border-border px-2 py-1 text-xs text-cypress hover:bg-soft-green"
              >
                Wyczyść
              </button>
            </div>
          </details>
        </div>

        <Separator />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          label="Cofnij (Ctrl+Z)"
        >
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          label="Ponów (Ctrl+Y)"
        >
          <Redo size={14} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, label, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-8 w-8 items-center justify-center rounded transition-colors ${
        active
          ? 'bg-italian-green text-flag-white'
          : 'text-cypress hover:bg-flag-white'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span aria-hidden="true" className="mx-1 inline-block h-6 w-px bg-border" />;
}
