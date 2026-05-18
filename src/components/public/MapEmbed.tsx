/**
 * MapEmbed — Google Maps integration for restaurants/attractions.
 *
 * - With NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY + (placeId or latlng): renders
 *   a Maps Embed iframe.
 * - Without the key but with coords: shows a "Otwórz w Google Maps" link
 *   built from `https://www.google.com/maps/search/?api=1&query=lat,lng`.
 * - Without any Map_Data: shows just the address text.
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
  if (props.placeId) {
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=place_id:${props.placeId}`;
  }
  if (props.latitude !== null && props.latitude !== undefined && props.longitude !== null && props.longitude !== undefined) {
    return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${props.latitude},${props.longitude}&zoom=16`;
  }
  return null;
}

function buildSearchUrl(props: MapEmbedProps): string | null {
  if (props.mapsUrl) return props.mapsUrl;
  if (props.placeId) {
    const q = props.address ?? props.name ?? '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}&query_place_id=${props.placeId}`;
  }
  if (props.latitude !== null && props.latitude !== undefined && props.longitude !== null && props.longitude !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${props.latitude},${props.longitude}`;
  }
  if (props.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.address)}`;
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
      ) : null}

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
