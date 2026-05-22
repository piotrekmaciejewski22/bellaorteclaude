export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { TuscanSunIcon } from '@/components/public/decorative/ItalianIcons';
import { createServerClient } from '@/lib/supabase/server';
import { getEvents } from '@/lib/data/events';
import { publicSiteMediaUrl } from '@/lib/data/apartments';
import type { EventEntry } from '@/lib/data/events';

function formatPeriod(e: EventEntry): string {
  if (e.displayPeriod) return e.displayPeriod;
  if (e.startDate && e.endDate) {
    const s = new Date(e.startDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
    const en = new Date(e.endDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${s} — ${en}`;
  }
  if (e.startDate) {
    return new Date(e.startDate).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return '';
}

export default async function WydarzeniaPage() {
  let localEvents: EventEntry[] = [];
  let seasonalEvents: EventEntry[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const client = await createServerClient();
      [localEvents, seasonalEvents] = await Promise.all([
        getEvents(client, { kind: 'local', upcoming: true }),
        getEvents(client, { kind: 'seasonal' }),
      ]);
    } catch (err) {
      console.warn('events:', err);
    }
  }

  return (
    <div className="bg-crema">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Kalendarz lokalny</span>
          <TricoloreRule size="md" />
        </div>

        <div className="mt-5 flex items-end gap-4">
          <TuscanSunIcon size={42} className="text-olive shrink-0" />
          <h1 className="heading-display text-5xl text-ink md:text-7xl">
            Wydarzenia <span className="italic text-olive">i sezony</span>
          </h1>
        </div>
        <p className="text-motto mt-3 text-lg md:text-xl">— eventi e stagioni —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Co warto wiedzieć o nadchodzących wydarzeniach lokalnych — sagras,
          festas, koncerty — i co polecamy w danym sezonie roku.
        </p>

        {localEvents.length > 0 && (
          <>
            <SectionDivider motto="le feste di stagione" />
            <section>
              <h2 className="heading-section text-3xl text-ink md:text-5xl">
                Najbliższe <span className="italic text-olive">wydarzenia</span>
              </h2>

              <ul className="mt-8 space-y-8">
                {localEvents.map((e) => (
                  <li key={e.id}>
                    <article className="grid gap-6 border border-gold/30 bg-flag-white p-6 shadow-warm md:grid-cols-[200px,1fr] md:p-7">
                      {e.heroImagePath ? (
                        <div className="relative aspect-[4/3] overflow-hidden bg-paper">
                          <Image
                            src={publicSiteMediaUrl(e.heroImagePath)}
                            alt=""
                            fill
                            unoptimized
                            sizes="200px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center bg-paper text-stone">
                          <TuscanSunIcon size={56} />
                        </div>
                      )}
                      <div>
                        <p className="text-eyebrow text-gold">{formatPeriod(e)}</p>
                        <h3 className="heading-section mt-2 text-2xl text-ink md:text-3xl">
                          {e.title}
                        </h3>
                        {e.excerpt && (
                          <p className="text-ui mt-3 text-cypress/85">{e.excerpt}</p>
                        )}
                        {e.bodyMd && (
                          <div className="markdown-body mt-4 text-sm">
                            <ReactMarkdown>{e.bodyMd}</ReactMarkdown>
                          </div>
                        )}
                        {e.externalUrl && (
                          <a
                            href={e.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex items-center gap-2 border border-gold/40 bg-paper px-3 py-1.5 text-xs font-display italic text-terracotta hover:border-gold hover:bg-gold/5"
                          >
                            Strona wydarzenia <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {seasonalEvents.length > 0 && (
          <>
            <SectionDivider motto="ogni stagione ha i suoi colori" />
            <section>
              <h2 className="heading-section text-3xl text-ink md:text-5xl">
                Polecane <span className="italic text-olive">sezonowo</span>
              </h2>
              <p className="text-motto mt-2 text-lg">— il consiglio della stagione —</p>

              <ul className="mt-8 grid gap-6 md:grid-cols-2">
                {seasonalEvents.map((e) => (
                  <li key={e.id}>
                    <article className="flex h-full flex-col border border-gold/30 bg-flag-white p-6 shadow-warm">
                      {e.heroImagePath && (
                        <div className="relative aspect-[16/9] overflow-hidden bg-paper">
                          <Image
                            src={publicSiteMediaUrl(e.heroImagePath)}
                            alt=""
                            fill
                            unoptimized
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <p className="text-eyebrow mt-4 text-gold">{formatPeriod(e)}</p>
                      <h3 className="font-display mt-2 text-2xl text-ink">{e.title}</h3>
                      {e.excerpt && (
                        <p className="text-ui mt-3 text-sm text-cypress/85">{e.excerpt}</p>
                      )}
                      {e.bodyMd && (
                        <div className="markdown-body mt-4 flex-1 text-sm">
                          <ReactMarkdown>{e.bodyMd}</ReactMarkdown>
                        </div>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {localEvents.length === 0 && seasonalEvents.length === 0 && (
          <p className="mt-12 border border-gold/30 bg-flag-white p-8 text-center font-display italic text-stone">
            Pagina ancora bianca — wydarzenia i polecenia sezonowe pojawią się po
            uzupełnieniu w panelu.
          </p>
        )}
      </div>
    </div>
  );
}
