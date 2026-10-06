export type LatLng = { lat: number; lng: number };

export type RouteResult = {
  coords: LatLng[];
  minutes: number;
};

const geocodeCache = new Map<string, LatLng>();
const pendingGeocodes = new Map<string, Promise<LatLng | null>>();

export function geocodeAddress(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase();
  const cached = geocodeCache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = pendingGeocodes.get(key);
  if (pending) return pending;
  const request = geocodeUncached(key, address).finally(() =>
    pendingGeocodes.delete(key),
  );
  pendingGeocodes.set(key, request);
  return request;
}

async function geocodeUncached(
  key: string,
  address: string,
): Promise<LatLng | null> {
  const query = /philippines|metro manila/i.test(address)
    ? address
    : `${address}, Metro Manila, Philippines`;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) return null;
    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
    }>;
    const first = results[0];
    if (!first) return null;
    const point = { lat: Number(first.lat), lng: Number(first.lon) };
    geocodeCache.set(key, point);
    return point;
  } catch {
    return null;
  }
}

export async function fetchRoute(
  from: LatLng,
  to: LatLng,
): Promise<RouteResult | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{
        duration?: number;
        geometry?: { coordinates?: number[][] };
      }>;
    };
    const route = data.routes?.[0];
    const coordinates = route?.geometry?.coordinates;
    if (!route || !coordinates?.length) return null;
    return {
      coords: coordinates.map(([lng, lat]) => ({ lat, lng })),
      minutes: Math.max(1, Math.round((route.duration ?? 0) / 60)),
    };
  } catch {
    return null;
  }
}
