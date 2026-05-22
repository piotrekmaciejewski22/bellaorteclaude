export const dynamic = 'force-dynamic';

/**
 * `/dla-gosci` — sekcja dla gości w trakcie pobytu.
 *
 * Pokazuje lokalne usługi: sklepy, apteki, bankomaty, transport, pralnie.
 * Stronę można też zlinkować bezpośrednio w mailu potwierdzającym
 * rezerwację jako szybką pomoc po przyjeździe.
 */

import { MapPin, Clock, Footprints } from 'lucide-react';

import { SectionDivider } from '@/components/public/decorative/SectionDivider';
import { TricoloreRule } from '@/components/public/decorative/TricoloreRule';
import { OrnamentSimple } from '@/components/public/decorative/Ornament';
import { createServerClient } from '@/lib/supabase/server';
import {
  getLocalServices,
  LOCAL_SERVICE_KIND_PL,
  LOCAL_SERVICE_KIND_ICON,
  type LocalService,
  type LocalServiceKind,
} from '@/lib/data/local-services';

const ORDER: LocalServiceKind[] = [
  'grocery',
  'pharmacy',
  'atm',
  'transit',
  'laundry',
  'medical',
  'other',
];

export default async function DlaGosciPage() {
  let services: LocalService[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const client = await createServerClient();
      services = await getLocalServices(client);
    } catch (err) {
      console.warn('dla-gosci:', err);
    }
  }

  const groups = ORDER.map((kind) => ({
    kind,
    title: LOCAL_SERVICE_KIND_PL[kind],
    icon: LOCAL_SERVICE_KIND_ICON[kind],
    items: services.filter((s) => s.kind === kind),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="bg-crema">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="text-eyebrow text-gold">Dla gości</span>
          <TricoloreRule size="md" />
        </div>

        <h1 className="heading-display mt-5 text-5xl text-ink md:text-7xl">
          Pierwsza <span className="italic text-olive">pomoc</span> w okolicy
        </h1>
        <p className="text-motto mt-3 text-lg md:text-xl">— guida pratica per gli ospiti —</p>

        <p className="text-ui mt-6 max-w-2xl text-cypress/85">
          Sklepy, apteki, bankomaty, stacja kolejowa — to czego potrzebujesz
          najbardziej w pierwszych dniach pobytu. Wszystko w spacerze
          z apartamentu albo kilka minut autem.
        </p>

        {groups.length === 0 ? (
          <div className="mt-12 border border-gold/30 bg-flag-white p-10 text-center">
            <OrnamentSimple className="mx-auto h-3 w-32 text-gold" />
            <p className="font-display italic mt-5 text-2xl text-stone">
              Pagina ancora bianca.
            </p>
            <p className="mt-2 text-sm text-muted">
              Lokalne miejsca pojawią się po skonfigurowaniu w panelu.
            </p>
          </div>
        ) : (
          <div className="mt-12 space-y-12">
            {groups.map((group) => (
              <section key={group.kind}>
                <SectionDivider motto={group.title.toLowerCase()} />

                <div className="flex items-center gap-4">
                  <span aria-hidden="true" className="text-3xl">
                    {group.icon}
                  </span>
                  <h2 className="heading-section text-2xl text-ink md:text-4xl">
                    {group.title}
                  </h2>
                </div>

                <ul className="mt-6 grid gap-4 md:grid-cols-2">
                  {group.items.map((s) => (
                    <li
                      key={s.id}
                      className="border border-gold/30 bg-flag-white p-5 shadow-warm"
                    >
                      <h3 className="font-display text-xl text-ink">{s.name}</h3>
                      {s.address && (
                        <p className="mt-2 inline-flex items-start gap-1 text-xs text-cypress/80">
                          <MapPin size={12} className="mt-0.5 text-gold" />
                          {s.address}
                        </p>
                      )}
                      {s.notes && (
                        <p className="text-ui mt-3 text-sm text-cypress/85">{s.notes}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone">
                        {s.hours && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} className="text-olive" />
                            {s.hours}
                          </span>
                        )}
                        {s.walkMinutes !== null && (
                          <span className="inline-flex items-center gap-1">
                            <Footprints size={11} className="text-olive" />
                            {s.walkMinutes} min spacerem
                          </span>
                        )}
                      </div>
                      {s.latitude !== null && s.longitude !== null && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-italic mt-4 inline-flex items-center gap-1 font-display text-sm italic text-terracotta hover:text-wine"
                        >
                          Pokaż w Google Maps →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
