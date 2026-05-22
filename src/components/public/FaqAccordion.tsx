"use client";

/**
 * FaqAccordion — sekcja FAQ z rozwijanymi odpowiedziami (akordeon).
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { PostBody } from '@/components/public/PostBody';
import type { FaqItem } from '@/lib/data/faq';

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <ul className="divide-y divide-gold/20 border-y border-gold/20">
      {items.map((item) => {
        const isOpen = item.id === openId;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <span className="font-display text-lg text-ink md:text-xl">
                {item.question}
              </span>
              <ChevronDown
                size={20}
                className={`shrink-0 text-gold transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="pb-6">
                <PostBody content={item.answerMd} className="markdown-body text-base" />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
