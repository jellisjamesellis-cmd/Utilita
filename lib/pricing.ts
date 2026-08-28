import { TradeType } from "./types";

const MIN_MULTIPLIER = 1.0;
const MAX_MULTIPLIER = 2.5;

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

  // ratio 0 → 1.0x, ratio 1 → ~1.4x, ratio 2+ → up to 2.5x
  const multiplier = MIN_MULTIPLIER + ratio * 0.4;

  return Math.min(MAX_MULTIPLIER, Math.round(multiplier * 10) / 10);
}

export function formatSurge(multiplier: number): string {
  if (multiplier <= 1.05) {
    return "Standard pricing";
  }
  return `${multiplier.toFixed(1)}x surge right now`;
}

export function calculatePrice(basePrice: number, surgeMultiplier: number): number {
  return Math.round(basePrice * surgeMultiplier * 100) / 100;
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
    .eq("status", "requested");

  const openJobs = openJobsCount ?? 0;
  const multiplier = calculateSurgeMultiplier(availableForTrade, openJobs);

  return { multiplier: multiplier, available: availableForTrade, openJobs };
}
