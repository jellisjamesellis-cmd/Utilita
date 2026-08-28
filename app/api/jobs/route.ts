import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";
import {
  calculateTierPrice,
  fetchSurgeForTrade,
  scheduledForTier,
} from "@/lib/pricing";
import {
  BASE_PRICES,
  SERVICE_TIER_LABELS,
  TRADE_TYPES,
  ServiceTier,
  TradeType,
} from "@/lib/types";

const SERVICE_TIERS: ServiceTier[] = ["priority", "within_12h", "within_3d"];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const tradeType = body.trade_type as TradeType;
  const serviceTier = (body.service_tier as ServiceTier) ?? "priority";
  const description = (body.description as string)?.trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const locationLabel = (body.location_label as string)?.trim() || null;

  if (!tradeType || !TRADE_TYPES.includes(tradeType)) {
    return NextResponse.json({ error: "Invalid trade type" }, { status: 400 });
  }
  if (!SERVICE_TIERS.includes(serviceTier)) {
    return NextResponse.json({ error: "Invalid service tier" }, { status: 400 });
  }
  if (!description || description.length < 5) {
    return NextResponse.json(
      { error: "Please add a short description (min 5 chars)" },
      { status: 400 }
    );
  }
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (user?.role !== "customer") {
    return NextResponse.json(
      { error: "Only customers can request jobs" },
      { status: 403 }
    );
  }

  const { multiplier } = await fetchSurgeForTrade(tradeType, supabase);
  const basePrice = BASE_PRICES[tradeType];
  const price = calculateTierPrice(basePrice, serviceTier, multiplier);
  const scheduledFor = scheduledForTier(serviceTier);

  const fullDescription = locationLabel
    ? `${description} · ${locationLabel}`
    : description;

  const expiresAt =
    serviceTier === "priority"
      ? new Date(Date.now() + 30_000).toISOString()
      : null;

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      customer_id: userId,
      trade_type: tradeType,
      description: fullDescription,
      lat,
      lng,
      status: "requested",
      base_price: basePrice,
      price,
      surge_multiplier: serviceTier === "priority" ? multiplier : 1,
      service_tier: serviceTier,
      scheduled_for: scheduledFor,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    job,
    tierLabel: SERVICE_TIER_LABELS[serviceTier],
  });
}
