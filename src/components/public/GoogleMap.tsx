"use client";

/**
 * GoogleMap — pełnowymiarowa mapa Google Maps z pinami miejsc.
 *
 * Wymaga `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` w env. Jeśli klucz jest
 * pusty, komponent renderuje informację — `PlacesMap` przełącza się
 * wtedy na fallback Leaflet/OpenStreetMap.
 */

import { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';

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

interface GoogleMapProps {
  places: Place[];
  activeId: string | null;
  onSelect: (id: string) => void;
  typeColor: Record<Place['type'], string>;
  apiKey: string;
}

function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || places.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    places.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
    map.fitBounds(bounds, 60);
  }, [map, places]);
  return null;
}

function PanTo({ active }: { active: Place | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !active) return;
    map.panTo({ lat: active.latitude, lng: active.longitude });
    if ((map.getZoom() ?? 0) < 14) map.setZoom(14);
  }, [map, active]);
  return null;
}

export function GoogleMap({ places, activeId, onSelect, typeColor, apiKey }: GoogleMapProps) {
  // openId jest zsynchronizowane z activeId, ale można je niezależnie
  // zamknąć (klik w X w InfoWindow). Trzymamy lokalny override który
  // resetuje się gdy activeId się zmienia.
  const [closedFor, setClosedFor] = useState<string | null>(null);
  const openId = activeId && activeId !== closedFor ? activeId : null;

  const center = useMemo<{ lat: number; lng: number }>(() => {
    if (places.length === 0) return { lat: 42.4583, lng: 12.3833 };
    return { lat: places[0].latitude, lng: places[0].longitude };
  }, [places]);

  const activePlace = activeId ? places.find((p) => p.id === activeId) ?? null : null;

  return (
    <div className="relative aspect-[4/3] overflow-hidden border border-gold/40">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={11}
          mapId="bellaorte-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds places={places} />
          <PanTo active={activePlace} />
          {places.map((p) => (
            <AdvancedMarker
              key={p.id}
              position={{ lat: p.latitude, lng: p.longitude }}
              onClick={() => {
                setClosedFor(null);
                onSelect(p.id);
              }}
            >
              <Pin color={typeColor[p.type]} active={p.id === activeId} />
            </AdvancedMarker>
          ))}
          {openId && (() => {
            const p = places.find((x) => x.id === openId);
            if (!p) return null;
            return (
              <InfoWindow
                position={{ lat: p.latitude, lng: p.longitude }}
                onCloseClick={() => setClosedFor(openId)}
                pixelOffset={[0, -38]}
              >
                <div style={{ fontFamily: 'Playfair Display, serif', maxWidth: 220 }}>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7d7560', margin: 0 }}>
                    {p.type === 'apartment' ? 'Apartament' : p.type === 'restaurant' ? 'Restauracja' : 'Atrakcja'}
                  </p>
                  <p style={{ fontWeight: 600, margin: '4px 0 0', color: '#2a2a28' }}>{p.name}</p>
                  {p.address && (
                    <p style={{ fontSize: 12, color: '#5b6342', margin: '4px 0 0' }}>{p.address}</p>
                  )}
                </div>
              </InfoWindow>
            );
          })()}
        </Map>
      </APIProvider>
    </div>
  );
}

function Pin({ color, active }: { color: string; active: boolean }) {
  const size = active ? 38 : 30;
  return (
    <div style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" fill="white" />
      </svg>
    </div>
  );
}
