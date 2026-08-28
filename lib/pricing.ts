import { ServiceTier, TradeType } from "./types";
import { BASE_PRICES } from "./types";

const MIN_MULTIPLIER = 1.0;
const MAX_MULTIPLIER = 2.5;
const SCHEDULED_3D_DISCOUNT = 0.85;

/**
 * Surge multiplier based on supply/demand ratio.
 * Few available tradespeople + many open jobs = higher surge.
 */
export function calculateSurgeMultiplier(
  availableTradespeople: number,
  openJobs: number
): number {
  if (availableTradespeople === 0) {
    return MAX_MULTIPLIER;
  }

  const ratio = openJobs / availableTradespeople;
  const multiplier = MIN_MULTIPLIER + ratio * 0.4;
  return Math.min(MAX_MULTIPLIER, Math.round(multiplier * 10) / 10);
}

export function formatSurge(multiplier: number): string {
  if (multiplier <= 1.05) {
    return "Standard pricing";
  }
  return `${multiplier.toFixed(1)}x surge right now`;
}

export function calculatePrice(
  basePrice: number,
  surgeMultiplier: number
): number {
  return Math.round(basePrice * surgeMultiplier * 100) / 100;
}

export function calculateTierPrice(
  basePrice: number,
  tier: ServiceTier,
  surgeMultiplier: number
): number {
  switch (tier) {
    case "priority":
      return calculatePrice(basePrice, surgeMultiplier);
    case "within_12h":
      return calculatePrice(basePrice, 1);
    case "within_3d":
      return calculatePrice(basePrice, SCHEDULED_3D_DISCOUNT);
    default:
      return basePrice;
  }
}

export interface TierQuote {
  tier: ServiceTier;
  label: string;
  description: string;
  price: number;
  surgeMultiplier: number;
  etaMinutes: number | null;
  etaLabel: string | null;
}

export function buildTierQuotes(
  basePrice: number,
  surgeMultiplier: number,
  priorityEtaMinutes: number | null
): TierQuote[] {
  return [
    {
      tier: "priority",
      label: "Priority",
      description: "Soonest available tradesperson",
      price: calculateTierPrice(basePrice, "priority", surgeMultiplier),
      surgeMultiplier,
      etaMinutes: priorityEtaMinutes,
      etaLabel: priorityEtaMinutes ? `~${priorityEtaMinutes} min` : null,
    },
    {
      tier: "within_12h",
      label: "Within 12 hours",
      description: "Standard pricing · no surge",
      price: calculateTierPrice(basePrice, "within_12h", surgeMultiplier),
      surgeMultiplier: 1,
      etaMinutes: null,
      etaLabel: "Today",
    },
    {
      tier: "within_3d",
      label: "Within 3 days",
      description: "Lowest price · scheduled visit",
      price: calculateTierPrice(basePrice, "within_3d", surgeMultiplier),
      surgeMultiplier: SCHEDULED_3D_DISCOUNT,
      etaMinutes: null,
      etaLabel: "Scheduled",
    },
  ];
}

export function scheduledForTier(tier: ServiceTier): string | null {
  const now = Date.now();
  if (tier === "within_12h") {
    return new Date(now + 6 * 60 * 60 * 1000).toISOString();
  }
  if (tier === "within_3d") {
    return new Date(now + 48 * 60 * 60 * 1000).toISOString();
  }
  return null;
}

export async function fetchSurgeForTrade(
  tradeType: TradeType,
  supabase: ReturnType<typeof import("./supabaseClient").createServiceClient>
): Promise<{ multiplier: number; available: number; openJobs: number }> {
  const { data: availableRows } = await supabase
    .from("availability")
    .select("tradesperson_id")
    .eq("is_available", true);

  const tradespersonIds = (availableRows ?? []).map((r) => r.tradesperson_id);

  let availableForTrade = 0;
  if (tradespersonIds.length > 0) {
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .in("id", tradespersonIds)
      .eq("trade_type", tradeType);
    availableForTrade = count ?? 0;
  }

  const { count: openJobsCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("trade_type", tradeType)
    .eq("status", "requested")
    .eq("service_tier", "priority");

  const openJobs = openJobsCount ?? 0;
  const multiplier = calculateSurgeMultiplier(availableForTrade, openJobs);

  return { multiplier, available: availableForTrade, openJobs };
}
