/**
 * NearbyPlaces — pod apartamentem pokazuje 3 najbliższe restauracje
 * i 3 atrakcje, posortowane wg odległości od centrum Orte.
 *
 * Używa wzoru haversine'a do obliczenia dystansu w km. Apartament
 * traktujemy jako punkt centralny okolicy Orte (42.4583, 12.3833).
 */

import Link from 'next/link';
import { MapPin } from 'lucide-react';

import { OrnamentSimple } from '@/components/public/decorative/Ornament';
import {
  AmphoraIcon,
  CypressIcon,
} from '@/components/public/decorative/ItalianIcons';
import type { Restaurant, Attraction } from '@/lib/types';

interface NearbyPlacesProps {
  restaurants: Restaurant[];
  attractions: Attraction[];
  // Domyślnie centrum Orte
  origin?: { lat: number; lng: number };
}

const ORTE_CENTER = { lat: 42.4583, lng: 12.3833 };

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function NearbyPlaces({ restaurants, attractions, origin = ORTE_CENTER }: NearbyPlacesProps) {
  const nearestRestaurants = restaurants
    .filter((r) => r.latitude !== null && r.longitude !== null && r.region === 'orte_area')
    .map((r) => ({
      ...r,
      distanceKm: haversineKm(origin, { lat: r.latitude!, lng: r.longitude! }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  const nearestAttractions = attractions
    .filter((a) => a.latitude !== null && a.longitude !== null && a.region === 'orte_area')
    .map((a) => ({
      ...a,
      distanceKm: haversineKm(origin, { lat: a.latitude!, lng: a.longitude! }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  if (nearestRestaurants.length === 0 && nearestAttractions.length === 0) {
    return null;
  }

  return (
    <section
      className="border border-gold/30 bg-flag-white p-6 shadow-warm md:p-8"
      aria-labelledby="nearby-heading"
    >
      <div className="text-center">
        <p className="text-eyebrow text-gold">W okolicy</p>
        <h2 id="nearby-heading" className="heading-section mt-2 text-2xl text-ink md:text-3xl">
          Najbliżej <span className="italic text-olive">apartamentu</span>
        </h2>
        <OrnamentSimple className="mx-auto mt-4 h-2 w-24 text-gold" />
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {nearestRestaurants.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <AmphoraIcon size={18} className="text-terracotta" />
              <h3 className="font-display text-lg text-ink">Restauracje</h3>
            </div>
            <ul className="space-y-3">
              {nearestRestaurants.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/restaurants/${r.slug}`}
                    className="group flex items-baseline justify-between gap-3 border-b border-gold/20 pb-3 hover:text-terracotta"
                  >
                    <div>
                      <p className="font-display text-base text-ink group-hover:text-terracotta">
                        {r.name}
                      </p>
                      {r.address && (
                        <p className="mt-0.5 text-xs text-cypress/70">{r.address}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-display italic text-stone">
                      <MapPin size={11} />
                      {formatDistance(r.distanceKm)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {nearestAttractions.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <CypressIcon size={18} className="text-olive" />
              <h3 className="font-display text-lg text-ink">Atrakcje</h3>
            </div>
            <ul className="space-y-3">
              {nearestAttractions.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/places/${a.slug}`}
                    className="group flex items-baseline justify-between gap-3 border-b border-gold/20 pb-3 hover:text-terracotta"
                  >
                    <div>
                      <p className="font-display text-base text-ink group-hover:text-terracotta">
                        {a.name}
                      </p>
                      {a.address && (
                        <p className="mt-0.5 text-xs text-cypress/70">{a.address}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-display italic text-stone">
                      <MapPin size={11} />
                      {formatDistance(a.distanceKm)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
