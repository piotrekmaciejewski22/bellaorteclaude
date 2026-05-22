"use client";

/**
 * PlacesMap — interaktywna mapa wszystkich miejsc.
 *
 * Bez Google Maps API używamy stylizowanej mapy SVG z pinami pozycjonowanymi
 * proporcjonalnie do współrzędnych. Pełnowartościowy iframe Google Maps
 * (zbiorczy) ładujemy przez `<MapEmbed>` jeśli klucz jest dostępny.
 *
 * Kliknięcie pina otwiera boczny panel z szczegółami i linkiem do strony
 * danego miejsca.
 */

import { useMemo, useState } from 'react';
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

const TYPE_COLORS: Record<Place['type'], string> = {
  apartment: 'fill-italian-red text-italian-red',
  restaurant: 'fill-terracotta text-terracotta',
  attraction: 'fill-olive text-olive',
};

const TYPE_LABEL: Record<Place['type'], string> = {
  apartment: 'Apartamenty',
  restaurant: 'Restauracje',
  attraction: 'Atrakcje',
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

export function PlacesMap({ places }: PlacesMapProps) {
  const [filterType, setFilterType] = useState<'all' | Place['type']>('all');
  const [filterRegion, setFilterRegion] = useState<'all' | Place['region']>('all');
  const [activePlace, setActivePlace] = useState<Place | null>(null);

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterRegion !== 'all' && p.region !== filterRegion) return false;
      return true;
    });
  }, [places, filterType, filterRegion]);

  // Bounding box dla mapy. Włochy/Lazio + Rzym mieści się w tych granicach.
  const BOUNDS = useMemo(() => {
    if (filtered.length === 0) {
      return { minLat: 41.85, maxLat: 42.7, minLng: 12.0, maxLng: 12.55 };
    }
    const lats = filtered.map((p) => p.latitude);
    const lngs = filtered.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    // Margines 10%
    const padLat = (maxLat - minLat) * 0.1 || 0.05;
    const padLng = (maxLng - minLng) * 0.1 || 0.05;
    return {
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
    };
  }, [filtered]);

  function project(p: Place): { x: number; y: number } {
    const x = ((p.longitude - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
    // Y odwrotnie — wyższa lat = bardziej północ = mniejsze y w SVG
    const y = ((BOUNDS.maxLat - p.latitude) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
    return { x, y };
  }

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
                      onClick={() => setActivePlace(p)}
                      className={`flex w-full items-start gap-3 border-b border-gold/20 p-4 text-left transition-colors hover:bg-paper/50 ${
                        activePlace?.id === p.id ? 'bg-paper' : ''
                      }`}
                    >
                      <span className={`mt-1 ${TYPE_COLORS[p.type].split(' ')[1]}`}>
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
          <div className="relative aspect-[4/3] overflow-hidden bg-paper">
            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
              {/* Pseudo-rzeka Tyber */}
              <path
                d="M 8 18 Q 20 30, 32 38 Q 44 48, 52 58 Q 62 70, 80 78"
                stroke="rgba(143, 179, 200, 0.6)"
                strokeWidth="0.7"
                fill="none"
              />

              {/* Linia kolejowa Orte → Roma */}
              <path
                d="M 38 32 L 76 70"
                stroke="rgba(176, 138, 62, 0.5)"
                strokeWidth="0.4"
                strokeDasharray="1 1.5"
                fill="none"
              />

              {/* Piny */}
              {filtered.map((p) => {
                const { x, y } = project(p);
                const isActive = activePlace?.id === p.id;
                const colorClass = TYPE_COLORS[p.type].split(' ')[0];
                return (
                  <g
                    key={p.id}
                    transform={`translate(${x} ${y})`}
                    onClick={() => setActivePlace(p)}
                    style={{ cursor: 'pointer' }}
                  >
                    {isActive && (
                      <circle
                        r="4"
                        className={colorClass}
                        opacity="0.25"
                      />
                    )}
                    <circle
                      r={isActive ? 1.8 : 1.3}
                      className={colorClass}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="mt-3 text-center font-display text-xs italic text-stone">
            Schematyczna mapa — kliknij pin lub element listy żeby zobaczyć detale
          </p>
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
              onClick={() => setActivePlace(null)}
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
