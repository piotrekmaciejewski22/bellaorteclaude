/**
 * parseMapsUrl — wyciąga współrzędne z URL Google Maps.
 *
 * Obsługiwane formaty:
 *   - https://www.google.com/maps/place/Name/@42.45,12.38,17z/...
 *   - https://www.google.com/maps/@42.45,12.38,15z
 *   - https://www.google.com/maps?q=42.45,12.38
 *   - https://www.google.com/maps?q=Name&ll=42.45,12.38
 *   - https://maps.google.com/?ll=42.45,12.38
 *   - https://goo.gl/maps/abc — NIE działa (potrzeba rozwinięcia, robi to przeglądarka)
 *   - https://maps.app.goo.gl/abc — NIE działa (skrót, trzeba rozwinąć w Google Maps)
 *
 * Dla skróconych linków (goo.gl/maps.app.goo.gl) zwracamy `null`
 * i informujemy admina żeby otworzył w Google Maps i skopiował pełen URL.
 */

export interface ParsedMapsUrl {
  latitude: number;
  longitude: number;
  // Czysty URL z koordynatami — używamy go jako mapsUrl
  cleanUrl: string;
}

const SHORT_HOSTS = ['goo.gl', 'maps.app.goo.gl'];

export function parseMapsUrl(input: string): ParsedMapsUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  // Skrócone linki — bez rozwinięcia nie wyciągniemy koordynatów.
  if (SHORT_HOSTS.includes(url.hostname)) return null;

  // 1. Format /@lat,lng,zoom — najczęstszy w nowych URL-ach Google Maps
  const atMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && isValidCoord(lat, lng)) {
      return { latitude: lat, longitude: lng, cleanUrl: trimmed };
    }
  }

  // 2. Parametr `q=lat,lng`
  const q = url.searchParams.get('q');
  if (q) {
    const m = q.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && isValidCoord(lat, lng)) {
        return { latitude: lat, longitude: lng, cleanUrl: trimmed };
      }
    }
  }

  // 3. Parametr `ll=lat,lng`
  const ll = url.searchParams.get('ll');
  if (ll) {
    const m = ll.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && isValidCoord(lat, lng)) {
        return { latitude: lat, longitude: lng, cleanUrl: trimmed };
      }
    }
  }

  // 4. Parametr `query=lat,lng`
  const query = url.searchParams.get('query');
  if (query) {
    const m = query.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && isValidCoord(lat, lng)) {
        return { latitude: lat, longitude: lng, cleanUrl: trimmed };
      }
    }
  }

  return null;
}

function isValidCoord(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function isShortMapsUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    return SHORT_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}
