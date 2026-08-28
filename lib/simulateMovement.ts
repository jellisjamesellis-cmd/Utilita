export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/** Haversine distance in km */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Linearly interpolate position toward destination.
 * @param progress 0–1
 */
export function interpolatePosition(
  start: LatLng,
  destination: LatLng,
  progress: number
): LatLng {
  const t = Math.min(1, Math.max(0, progress));
  return {
    lat: start.lat + (destination.lat - start.lat) * t,
    lng: start.lng + (destination.lng - start.lng) * t,
  };
}

/** Generate a mock start point ~2–4 km away from the job */
export function mockStartPosition(jobLocation: LatLng): LatLng {
  const angle = Math.random() * 2 * Math.PI;
  const offsetKm = 2 + Math.random() * 2;
  const latOffset = (offsetKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const lngOffset =
    (offsetKm / (EARTH_RADIUS_KM * Math.cos(toRad(jobLocation.lat)))) *
    (180 / Math.PI);

  return {
    lat: jobLocation.lat + latOffset * Math.cos(angle),
    lng: jobLocation.lng + lngOffset * Math.sin(angle),
  };
}

export interface MovementConfig {
  /** Total duration of simulated journey in ms (default ~2 min) */
  durationMs?: number;
  /** Tick interval in ms */
  intervalMs?: number;
}

/**
 * Simulates tradesperson movement toward the customer over ~2 minutes.
 * Calls onUpdate with each new position; resolves when arrival (progress = 1).
 */
export function simulateMovement(
  start: LatLng,
  destination: LatLng,
  onUpdate: (position: LatLng, progress: number, etaMinutes: number) => void,
  config: MovementConfig = {}
): () => void {
  const durationMs = config.durationMs ?? 120_000;
  const intervalMs = config.intervalMs ?? 3_000;
  const totalDistance = distanceKm(start, destination);
  const startTime = Date.now();

  const tick = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    const position = interpolatePosition(start, destination, progress);
    const remainingKm = totalDistance * (1 - progress);
    const etaMinutes = Math.max(1, Math.ceil((remainingKm / 25) * 60)); // ~25 km/h mock speed

    onUpdate(position, progress, etaMinutes);

    if (progress >= 1) {
      clearInterval(handle);
    }
  };

  tick();
  const handle = setInterval(tick, intervalMs);

  return () => clearInterval(handle);
}

export function formatEta(minutes: number): string {
  if (minutes <= 1) return "Arriving now";
  return `${minutes} min away`;
}
