/**
 * MapEmbed — Google Maps integration for restaurants/attractions.
 *
 * Strategia (od najlepszego do najgorszego):
 *   1. Klucz + lat/lng        → embed `/view` z koordynatami (najpewniejsze)
 *   2. Klucz + adres           → embed `/place?q=<adres>` (działa dla Orte itp.)
 *   3. Klucz + placeId         → embed `/place?q=place_id:...` (tylko jeśli adres puste)
 *   4. Brak klucza             → tylko link „Otwórz w Google Maps"
 *
 * Powód kolejności: w bazie często jest fałszywy `place_id` z seedu który
 * Google odrzuca jako "Invalid 'q' parameter". `lat/lng` zawsze działa,
 * adres tekstowy też — `place_id` jako ostatnia opcja.
 *
 * Wymagania pokryte: 41.
 */

import { ExternalLink, MapPin } from 'lucide-react';

interface MapEmbedProps {
  address?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapsUrl?: string | null;
  name?: string;
}

function buildEmbedUrl(props: MapEmbedProps, key: string): string | null {
  // 1. lat/lng — najpewniejsze, zawsze działa
  if (
    props.latitude !== null &&
    props.latitude !== undefined &&
    props.longitude !== null &&
    props.longitude !== undefined
  ) {
    return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${props.latitude},${props.longitude}&zoom=16`;
  }
  // 2. Adres tekstowy — działa dla większości realnych adresów
  if (props.address && props.address.trim().length > 0) {
    const q = encodeURIComponent(props.address);
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}`;
  }
  // 3. placeId — ostatni resort, często fałszywy w seedzie
  if (props.placeId && props.placeId.startsWith('ChIJ')) {
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=place_id:${props.placeId}`;
  }
  return null;
}

function buildSearchUrl(props: MapEmbedProps): string | null {
  if (props.mapsUrl) return props.mapsUrl;
  if (
    props.latitude !== null &&
    props.latitude !== undefined &&
    props.longitude !== null &&
    props.longitude !== undefined
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${props.latitude},${props.longitude}`;
  }
  if (props.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.address)}`;
  }
  if (props.placeId && props.placeId.startsWith('ChIJ')) {
    const q = props.address ?? props.name ?? '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}&query_place_id=${props.placeId}`;
  }
  return null;
}

export function MapEmbed(props: MapEmbedProps) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const embedUrl = key ? buildEmbedUrl(props, key) : null;
  const searchUrl = buildSearchUrl(props);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-flag-white">
      {embedUrl ? (
        <div className="relative aspect-video">
          <iframe
            src={embedUrl}
            title={`Mapa: ${props.name ?? props.address ?? 'lokalizacja'}`}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      ) : (
        // Brak danych dla embed (np. tylko fałszywy placeId) — pokazujemy
        // tylko adres + link, bez czarnego prostokąta z błędem.
        <div className="flex aspect-video items-center justify-center bg-paper px-6 text-center">
          <div className="space-y-3">
            <MapPin size={28} className="mx-auto text-gold" />
            <p className="font-display italic text-stone">
              {props.address ?? 'Lokalizacja dostępna w Google Maps'}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 p-4 text-sm text-cypress sm:flex-row sm:items-center sm:justify-between">
        {props.address ? (
          <p className="inline-flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 text-italian-green" />
            <span>{props.address}</span>
          </p>
        ) : (
          <p className="text-muted">Brak adresu</p>
        )}

        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-italian-green hover:text-cypress"
          >
            Otwórz w Google Maps
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
