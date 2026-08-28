import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";
import { findNearestTradesperson, fetchTradespersonLocations } from "@/lib/eta";
import {
  buildTierQuotes,
  fetchSurgeForTrade,
} from "@/lib/pricing";
import { BASE_PRICES, TRADE_TYPES, TradeType } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tradeType = searchParams.get("trade_type") as TradeType | null;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!tradeType || !TRADE_TYPES.includes(tradeType)) {
    return NextResponse.json({ error: "Invalid trade type" }, { status: 400 });
  }
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const surge = await fetchSurgeForTrade(tradeType, supabase);
  const locations = await fetchTradespersonLocations(tradeType, supabase);

  const nearestAvailable = findNearestTradesperson(
    { lat, lng },
    locations,
    true
  );
  const nearestAny =
    nearestAvailable ??
    findNearestTradesperson({ lat, lng }, locations, false);

  const priorityEta = nearestAny?.etaMinutes ?? 45;
  const basePrice = BASE_PRICES[tradeType];
  const tiers = buildTierQuotes(basePrice, surge.multiplier, priorityEta);

  return NextResponse.json({
    tradeType,
    basePrice,
    surge,
    tiers,
    nearest: nearestAny
      ? {
          distanceKm: Math.round(nearestAny.distanceKm * 10) / 10,
          etaMinutes: nearestAny.etaMinutes,
          isAvailable: nearestAny.person.is_available,
        }
      : null,
  });
}
