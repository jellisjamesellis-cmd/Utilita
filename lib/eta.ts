import { distanceKm, LatLng } from "./simulateMovement";
import { TradeType } from "./types";

const MOCK_URBAN_SPEED_KMH = 25;

export interface TradespersonLocation {
  tradesperson_id: string;
  lat: number;
  lng: number;
  is_available: boolean;
}

export function etaMinutesFromDistance(distanceKm: number): number {
  const raw = (distanceKm / MOCK_URBAN_SPEED_KMH) * 60;
  const withMinimum = Math.max(8, raw);
  return Math.round(withMinimum / 5) * 5;
}

export function formatEtaMinutes(minutes: number): string {
  return `~${minutes} min`;
}

export function findNearestTradesperson(
  customer: LatLng,
  tradespeople: TradespersonLocation[],
  availableOnly = false
): { person: TradespersonLocation; distanceKm: number; etaMinutes: number } | null {
  const pool = availableOnly
    ? tradespeople.filter((p) => p.is_available)
    : tradespeople;

  if (pool.length === 0) return null;

  let nearest = pool[0];
  let minDistance = distanceKm(customer, { lat: nearest.lat, lng: nearest.lng });

  for (const person of pool.slice(1)) {
    const d = distanceKm(customer, { lat: person.lat, lng: person.lng });
    if (d < minDistance) {
      minDistance = d;
      nearest = person;
    }
  }

  let eta = etaMinutesFromDistance(minDistance);
  if (!nearest.is_available) {
    eta = Math.min(60, eta + 20);
  }

  return { person: nearest, distanceKm: minDistance, etaMinutes: eta };
}

export async function fetchMockTradespersonLocations(
  tradeType: TradeType,
  supabase: ReturnType<typeof import("./supabaseClient").createServiceClient>
): Promise<TradespersonLocation[]> {
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .eq("role", "tradesperson")
    .eq("trade_type", tradeType)
    .eq("is_mock", true);

  const ids = (users ?? []).map((u) => u.id);
  if (ids.length === 0) return [];

  const { data: rows } = await supabase
    .from("availability")
    .select("tradesperson_id, is_available, current_lat, current_lng")
    .in("tradesperson_id", ids)
    .not("current_lat", "is", null)
    .not("current_lng", "is", null);

  return (rows ?? []).map((row) => ({
    tradesperson_id: row.tradesperson_id,
    lat: row.current_lat as number,
    lng: row.current_lng as number,
    is_available: row.is_available,
  }));
}

export async function fetchTradespersonLocations(
  tradeType: TradeType,
  supabase: ReturnType<typeof import("./supabaseClient").createServiceClient>
): Promise<TradespersonLocation[]> {
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .eq("role", "tradesperson")
    .eq("trade_type", tradeType);

  const ids = (users ?? []).map((u) => u.id);
  if (ids.length === 0) return [];

  const { data: rows } = await supabase
    .from("availability")
    .select("tradesperson_id, is_available, current_lat, current_lng")
    .in("tradesperson_id", ids)
    .not("current_lat", "is", null)
    .not("current_lng", "is", null);

  return (rows ?? []).map((row) => ({
    tradesperson_id: row.tradesperson_id,
    lat: row.current_lat as number,
    lng: row.current_lng as number,
    is_available: row.is_available,
  }));
}
