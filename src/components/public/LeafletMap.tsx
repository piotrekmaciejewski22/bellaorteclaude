"use client";

/**
 * LeafletMap — pure-client leafletowa mapa z OpenStreetMap.
 *
 * Wydzielona z PlacesMap, bo Leaflet bezwzględnie wymaga `window` w
 * imporcie. Lazy-loadowana w PlacesMap przez `next/dynamic({ ssr: false })`.
 */

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface LeafletMapProps {
  places: Place[];
  activeId: string | null;
  onSelect: (id: string) => void;
  typeColor: Record<Place['type'], string>;
}

// Ikona pina jako SVG inline — kolor zależy od typu miejsca.
function makeIcon(color: string, isActive: boolean): L.DivIcon {
  const size = isActive ? 36 : 28;
  return L.divIcon({
    className: '',
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Komponent który auto-fituje mapę do widoku wszystkich pinów.
function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();
  useEffect(() => {
    if (places.length === 0) return;
    const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [places, map]);
  return null;
}

// Centruje mapę gdy zmienia się `activeId`.
function FlyTo({ active }: { active: Place | null }) {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    map.flyTo([active.latitude, active.longitude], Math.max(map.getZoom(), 14), {
      duration: 0.6,
    });
  }, [active, map]);
  return null;
}

export function LeafletMap({ places, activeId, onSelect, typeColor }: LeafletMapProps) {
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const center = useMemo<[number, number]>(() => {
    if (places.length === 0) return [42.4583, 12.3833]; // Orte
    return [places[0].latitude, places[0].longitude];
  }, [places]);

  const activePlace = activeId ? places.find((p) => p.id === activeId) ?? null : null;

  // Otwórz popup gdy aktywny pin zmieni się przez listę po lewej.
  useEffect(() => {
    if (!activeId) return;
    const marker = markersRef.current.get(activeId);
    if (marker) marker.openPopup();
  }, [activeId]);

  return (
    <div className="relative aspect-[4/3] overflow-hidden border border-gold/40">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FitBounds places={places} />
        <FlyTo active={activePlace} />
        {places.map((p) => {
          const isActive = p.id === activeId;
          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={makeIcon(typeColor[p.type], isActive)}
              eventHandlers={{
                click: () => onSelect(p.id),
              }}
              ref={(ref) => {
                if (ref) markersRef.current.set(p.id, ref);
                else markersRef.current.delete(p.id);
              }}
            >
              <Popup>
                <div className="font-display">
                  <p className="text-xs uppercase tracking-wide text-stone">
                    {p.type === 'apartment'
                      ? 'Apartament'
                      : p.type === 'restaurant'
                        ? 'Restauracja'
                        : 'Atrakcja'}
                  </p>
                  <p className="mt-1 text-base font-semibold text-ink">{p.name}</p>
                  {p.address && (
                    <p className="mt-1 text-xs text-cypress/80">{p.address}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
