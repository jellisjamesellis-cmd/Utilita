import { createServiceClient } from "./supabaseClient";
import {
  findNearestTradesperson,
  fetchMockTradespersonLocations,
} from "./eta";
import { LatLng } from "./simulateMovement";
import { TradeType } from "./types";

export interface MockMatchResult {
  tradesperson_id: string;
  lat: number;
  lng: number;
  distanceKm: number;
  etaMinutes: number;
}

export async function findNearestMockTradesperson(
  tradeType: TradeType,
  customer: LatLng
): Promise<MockMatchResult | null> {
  const supabase = createServiceClient();
  const locations = await fetchMockTradespersonLocations(tradeType, supabase);

  const nearest =
    findNearestTradesperson(customer, locations, true) ??
    findNearestTradesperson(customer, locations, false);

  if (!nearest) return null;

  return {
    tradesperson_id: nearest.person.tradesperson_id,
    lat: nearest.person.lat,
    lng: nearest.person.lng,
    distanceKm: nearest.distanceKm,
    etaMinutes: nearest.etaMinutes,
  };
}
