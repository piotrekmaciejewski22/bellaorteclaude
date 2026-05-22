"use client";

/**
 * BlogFilters — wyszukiwarka po tytule i filtry tagów na liście wpisów.
 *
 * Komponent klienta. Filtruje listę wpisów po stronie przeglądarki —
 * pełna lista przychodzi z SSR, więc renderowanie wstępne jest dostępne
 * dla SEO. Wyniki ukrywają się przez `display:none` zamiast usuwania
 * z DOM, żeby zachować pozycję scrolla.
 */

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import type { BlogPost } from '@/lib/data/blog';

interface BlogFiltersProps {
  posts: BlogPost[];
  // children to lista renderowana przez SSR, każdy element ma data-post-id
  children: React.ReactNode;
}

export function BlogFilters({ posts, children }: BlogFiltersProps) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Wszystkie unikalne tagi
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const p of posts) {
      for (const t of p.tags) tags.add(t);
    }
    return Array.from(tags).sort();
  }, [posts]);

  // Które posty pasują (po id)
  const matchingIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    return new Set(
      posts
        .filter((p) => {
          if (q && !p.title.toLowerCase().includes(q) && !p.excerpt.toLowerCase().includes(q)) {
            return false;
          }
          if (selectedTags.size > 0) {
            const has = p.tags.some((t) => selectedTags.has(t));
            if (!has) return false;
          }
          return true;
        })
        .map((p) => p.id),
    );
  }, [posts, query, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function clearAll() {
    setQuery('');
    setSelectedTags(new Set());
  }

  // Wstrzykujemy display:none dla niepasujących elementów przez data-post-id
  // — używamy hooka który aplikuje stylowanie w runtime po stronie klienta.
  // Renderujemy children opakowane w wrapper który filtruje data-post-id.
  return (
    <div>
      <div className="mb-8 space-y-4 rounded-2xl border border-gold/30 bg-flag-white p-5">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone"
          />
          <input
            type="search"
            placeholder="Szukaj po tytule lub treści…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-ivory py-2.5 pl-9 pr-9 text-sm text-ink focus:border-italian-green focus:outline-none focus:ring-2 focus:ring-italian-green/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Wyczyść wyszukiwanie"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-cypress"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div>
            <p className="mb-2 text-eyebrow text-stone">Tagi</p>
            <ul className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={selectedTags.has(tag)}
                    className={`rounded-full border px-3 py-1 text-xs font-display transition-colors ${
                      selectedTags.has(tag)
                        ? 'border-olive bg-olive text-crema'
                        : 'border-gold/40 text-cypress hover:border-gold'
                    }`}
                  >
                    #{tag}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(query || selectedTags.size > 0) && (
          <div className="flex items-center justify-between gap-2 text-sm text-cypress/85">
            <span>
              Pasuje: <strong>{matchingIds.size}</strong> {matchingIds.size === 1 ? 'wpis' : 'wpisów'}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="link-italic font-display italic text-terracotta hover:text-wine"
            >
              Wyczyść filtry
            </button>
          </div>
        )}
      </div>

      <FilteredList matchingIds={matchingIds}>{children}</FilteredList>
    </div>
  );
}

function FilteredList({
  children,
  matchingIds,
}: {
  children: React.ReactNode;
  matchingIds: Set<string>;
}) {
  // Dla każdego dziecka — jeśli ma data-post-id i nie ma w matchingIds,
  // ukrywamy (display:none) żeby nie tracić SEO.
  return (
    <div>
      {Array.isArray(children)
        ? children.map((child) => {
            // Bez introspekcji propsów — używamy CSS przez :has() lub
            // wrapping. Najprostsze: zwracamy element jak jest, widoczność
            // sterowana przez wrapper poniżej.
            return child;
          })
        : children}
      {/* Globalny CSS wstrzyknięty który chowa niepasujące <li> z data-post-id */}
      <style jsx global>{`
        ${Array.from(matchingIds.size === 0 ? new Set<string>() : matchingIds)
          .map(() => '')
          .join('')}
      `}</style>
      <FilterStyles matchingIds={matchingIds} />
    </div>
  );
}

function FilterStyles({ matchingIds }: { matchingIds: Set<string> }) {
  // Generujemy regułę CSS: ukrywamy każdy [data-post-id] który NIE jest w matchingIds.
  // Negacja w CSS: ukryj wszystkie, potem ujawnij pasujące.
  const showSelectors = Array.from(matchingIds)
    .map((id) => `[data-post-id="${id}"]`)
    .join(',');

  if (matchingIds.size === 0) {
    return (
      <style>{`[data-post-id] { display: none !important; }`}</style>
    );
  }

  return (
    <style>{`
      [data-post-id] { display: none !important; }
      ${showSelectors} { display: revert !important; }
    `}</style>
  );
}
