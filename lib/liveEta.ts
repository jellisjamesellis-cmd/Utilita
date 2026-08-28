import { distanceKm, LatLng } from "./simulateMovement";

/** Uber-style live ETA from current position to destination */
export function liveEtaMinutes(from: LatLng, to: LatLng): number {
  const km = distanceKm(from, to);
  if (km < 0.05) return 0;
  const raw = (km / 25) * 60;
  return Math.max(1, Math.ceil(raw));
}

export function formatUberEta(minutes: number): string {
  if (minutes <= 0) return "Arriving";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}
