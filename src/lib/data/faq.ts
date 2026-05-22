/**
 * FAQ data layer.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface FaqItem {
  id: string;
  question: string;
  answerMd: string;
  displayOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FaqRow {
  id: string;
  question: string;
  answer_md: string;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS =
  'id, question, answer_md, display_order, published_at, created_at, updated_at';

function mapRow(r: FaqRow): FaqItem {
  return {
    id: r.id,
    question: r.question,
    answerMd: r.answer_md,
    displayOrder: r.display_order,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getFaqItems(
  client: SupabaseClient,
  opts: { includeUnpublished?: boolean } = {},
): Promise<FaqItem[]> {
  let query = client.from('faq_items').select(COLUMNS);
  if (!opts.includeUnpublished) {
    query = query.not('published_at', 'is', null);
  }
  query = query.order('display_order', { ascending: true });
  const { data, error } = await query;
  if (error) throw new Error(`getFaqItems: ${error.message}`);
  return (data ?? []).map((row) => mapRow(row as FaqRow));
}
