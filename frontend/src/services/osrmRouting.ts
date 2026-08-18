// OSRM Routing Service — proxied through backend for security
// The OSRM base URL and any future API keys live ONLY in backend/.env
// Frontend only calls /api/routing/route on our own backend server.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const ROUTING_ENDPOINT = `${API_BASE}/routing/route`;

export interface OSRMRouteResult {
  geometry: [number, number][]; // [lat, lng][] for Leaflet polyline
  geojsonCoordinates: [number, number][]; // [lng, lat][] raw GeoJSON
  distanceKm: number;
  durationMins: number;
  steps: any[];
  error?: string;
}

// In-memory cache keyed by coordinate string — avoids duplicate backend calls
const routeCache = new Map<string, OSRMRouteResult>();

/**
 * Get a real road route via the backend proxy (which calls OSRM server-side).
 * Frontend never contacts OSRM or holds any API credentials.
 *
 * @param coordinates Array of [longitude, latitude] pairs (GeoJSON order)
 */
export const getRouteFromOSRM = async (
  coordinates: [number, number][],
  _isLngLat: boolean = true // always lng,lat — kept for API compatibility
): Promise<OSRMRouteResult> => {
  if (!coordinates || coordinates.length < 2) {
    return {
      geometry: [],
      geojsonCoordinates: [],
      distanceKm: 0,
      durationMins: 0,
      steps: [],
      error: 'At least 2 points are required to calculate a route.'
    };
  }

  // Cache key based on coordinate string
  const cacheKey = coordinates
    .map(([lng, lat]) => `${lng.toFixed(5)},${lat.toFixed(5)}`)
    .join(';');

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    // POST to our backend proxy — no external URLs or API keys in frontend
    const response = await fetch(ROUTING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates }),
      signal: AbortSignal.timeout(20000) // 20s timeout
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        geometry: [],
        geojsonCoordinates: [],
        distanceKm: 0,
        durationMins: 0,
        steps: [],
        error: data.message || 'Unable to calculate a road route for this location.'
      };
    }

    const { geometry, distanceKm, durationMins, legs } = data.data;
    const geojsonCoords: [number, number][] = geometry.coordinates; // [lng, lat][]
    const leafletCoords: [number, number][] = geojsonCoords.map(([lng, lat]) => [lat, lng]); // [lat, lng][]

    const result: OSRMRouteResult = {
      geometry: leafletCoords,
      geojsonCoordinates: geojsonCoords,
      distanceKm,
      durationMins,
      steps: legs ? legs.flatMap((leg: any) => leg.steps || []) : []
    };

    routeCache.set(cacheKey, result);
    return result;

  } catch (err: any) {
    console.error('[osrmRouting] Proxy call failed:', err.message);
    return {
      geometry: [],
      geojsonCoordinates: [],
      distanceKm: 0,
      durationMins: 0,
      steps: [],
      error: 'Unable to calculate a road route for this location.'
    };
  }
};

/**
 * Haversine distance between two [lng, lat] coordinates (km)
 */
export const calculateRouteDistance = (coordinates: [number, number][]): number => {
  if (!coordinates || coordinates.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[i + 1];
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return Math.round(total * 10) / 10;
};

/**
 * Estimated duration in minutes based on distance and average speed
 */
export const calculateRouteDuration = (distanceKm: number, avgSpeedKmH = 30): number => {
  if (distanceKm <= 0) return 0;
  return Math.round((distanceKm / avgSpeedKmH) * 60);
};

/**
 * Interpolate a position along a Leaflet [lat, lng][] polyline at fraction 0–1
 */
export const interpolatePosition = (
  routeCoords: [number, number][],
  progressFraction: number
): [number, number] => {
  if (!routeCoords || routeCoords.length === 0) return [28.6139, 77.2090];
  if (progressFraction <= 0) return routeCoords[0];
  if (progressFraction >= 1) return routeCoords[routeCoords.length - 1];

  const total = routeCoords.length;
  const exact = progressFraction * (total - 1);
  const i1 = Math.floor(exact);
  const i2 = Math.min(i1 + 1, total - 1);
  const t = exact - i1;

  const [lat1, lng1] = routeCoords[i1];
  const [lat2, lng2] = routeCoords[i2];
  return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t];
};
