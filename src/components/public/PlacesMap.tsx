"use client";

/**
 * PlacesMap — interaktywna mapa wszystkich miejsc oparta na Leaflet
 * z kafelkami OpenStreetMap (darmowe, bez klucza API). Wygląda jak
 * Google Maps z drogami, nazwami miast i terenu.
 *
 * Filtry po typie i regionie (Okolica Orte / Rzym) + boczna lista
 * wyboru. Klik w pin lub element listy otwiera popup ze szczegółami.
 */

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Filter, MapPin, X, ExternalLink } from 'lucide-react';

import {
  AmphoraIcon,
  CypressIcon,
  TowerIcon,
} from '@/components/public/decorative/ItalianIcons';

interface Place {
  id: string;
  type: 'apartment' | 'restaurant' | 'attraction';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  slug: string;
  region: 'orte_area' | 'rome';
}

interface PlacesMapProps {
  places: Place[];
}

const TYPE_LABEL: Record<Place['type'], string> = {
  apartment: 'Apartamenty',
  restaurant: 'Restauracje',
  attraction: 'Atrakcje',
};

const TYPE_COLOR: Record<Place['type'], string> = {
  apartment: '#9b2c2c',
  restaurant: '#b85c38',
  attraction: '#5b6342',
};

const TYPE_HREF: Record<Place['type'], (slug: string) => string> = {
  apartment: (s) => `/apartments/${s}`,
  restaurant: (s) => `/restaurants/${s}`,
  attraction: (s) => `/places/${s}`,
};

const TYPE_ICON: Record<Place['type'], React.ComponentType<{ size?: number; className?: string }>> = {
  apartment: TowerIcon,
  restaurant: AmphoraIcon,
  attraction: CypressIcon,
};

// Mapy ładujemy lazy bo wymagają window. Wybór silnika:
//   - jeśli ustawiony NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY → Google Maps
//   - inaczej fallback Leaflet/OpenStreetMap (darmowe, bez klucza)
const GoogleMap = dynamic(() => import('./GoogleMap').then((m) => m.GoogleMap), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[4/3] items-center justify-center bg-paper text-stone">
      <p className="font-display italic">Ładowanie mapy…</p>
    </div>
  ),
});

const LeafletMap = dynamic(() => import('./LeafletMap').then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[4/3] items-center justify-center bg-paper text-stone">
      <p className="font-display italic">Ładowanie mapy…</p>
    </div>
  ),
});

export function PlacesMap({ places }: PlacesMapProps) {
  const [filterType, setFilterType] = useState<'all' | Place['type']>('all');
  const [filterRegion, setFilterRegion] = useState<'all' | Place['region']>('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterRegion !== 'all' && p.region !== filterRegion) return false;
      return true;
    });
  }, [places, filterType, filterRegion]);

  const activePlace = activeId ? filtered.find((p) => p.id === activeId) ?? null : null;

  return (
    <div>
      {/* Filtry */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-eyebrow text-stone">
          <Filter size={14} /> Filtry:
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'apartment', 'restaurant', 'attraction'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 font-display text-sm transition-colors ${
                filterType === t
                  ? 'border border-olive bg-olive text-crema'
                  : 'border border-gold/40 text-cypress hover:border-gold'
              }`}
            >
              {t === 'all' ? 'Wszystkie' : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {(['all', 'orte_area', 'rome'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRegion(r)}
              className={`px-3 py-1 font-display text-sm transition-colors ${
                filterRegion === r
                  ? 'border border-olive bg-olive text-crema'
                  : 'border border-gold/40 text-cypress hover:border-gold'
              }`}
            >
              {r === 'all' ? 'Cały region' : r === 'orte_area' ? 'Okolica Orte' : 'Rzym'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
        {/* Lista po lewej */}
        <div className="max-h-[600px] overflow-y-auto border border-gold/30 bg-flag-white">
          {filtered.length === 0 ? (
            <p className="p-6 text-center font-display italic text-stone">
              Brak miejsc dla wybranych filtrów.
            </p>
          ) : (
            <ul>
              {filtered.map((p) => {
                const Icon = TYPE_ICON[p.type];
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(p.id)}
                      className={`flex w-full items-start gap-3 border-b border-gold/20 p-4 text-left transition-colors hover:bg-paper/50 ${
                        activeId === p.id ? 'bg-paper' : ''
                      }`}
                    >
                      <span style={{ color: TYPE_COLOR[p.type] }} className="mt-1">
                        <Icon size={20} />
                      </span>
                      <div>
                        <p className="text-eyebrow text-gold">
                          {TYPE_LABEL[p.type]} · {p.region === 'rome' ? 'Rzym' : 'Okolica Orte'}
                        </p>
                        <p className="font-display text-base text-ink">{p.name}</p>
                        {p.address && (
                          <p className="mt-1 text-xs text-cypress/70">{p.address}</p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Mapa po prawej */}
        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-3 -z-10 border border-gold/40" />
          {googleApiKey ? (
            <GoogleMap
              places={filtered}
              activeId={activeId}
              onSelect={(id) => setActiveId(id)}
              typeColor={TYPE_COLOR}
              apiKey={googleApiKey}
            />
          ) : (
            <LeafletMap
              places={filtered}
              activeId={activeId}
              onSelect={(id) => setActiveId(id)}
              typeColor={TYPE_COLOR}
            />
          )}
        </div>
      </div>

      {/* Panel detali */}
      {activePlace && (
        <div className="mt-8 border border-gold/30 bg-flag-white p-6 shadow-warm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-eyebrow text-gold">
                {TYPE_LABEL[activePlace.type]} · {activePlace.region === 'rome' ? 'Rzym' : 'Okolica Orte'}
              </p>
              <h3 className="heading-section mt-1 text-2xl text-ink md:text-3xl">
                {activePlace.name}
              </h3>
              {activePlace.address && (
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-cypress/85">
                  <MapPin size={14} /> {activePlace.address}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveId(null)}
              aria-label="Zamknij szczegóły"
              className="text-stone hover:text-cypress"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={TYPE_HREF[activePlace.type](activePlace.slug)}
              className="inline-flex items-center gap-2 border-2 border-olive bg-olive px-5 py-2 font-display text-sm text-crema hover:bg-olive-deep"
            >
              <span className="text-gold-soft">·</span> Otwórz stronę
            </Link>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${activePlace.latitude},${activePlace.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-gold/40 bg-paper px-4 py-2 font-display italic text-terracotta hover:border-gold"
            >
              Otwórz w Google Maps <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
