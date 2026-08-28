import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";
import { calculatePrice } from "@/lib/pricing";
import { fetchSurgeForTrade } from "@/lib/pricing";
import { BASE_PRICES, TRADE_TYPES, TradeType } from "@/lib/types";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const tradeType = body.trade_type as TradeType;
  const description = (body.description as string)?.trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!tradeType || !TRADE_TYPES.includes(tradeType)) {
    return NextResponse.json({ error: "Invalid trade type" }, { status: 400 });
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
  const price = calculatePrice(basePrice, multiplier);

  const expiresAt = new Date(Date.now() + 30_000).toISOString();

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      customer_id: userId,
      trade_type: tradeType,
      description,
      lat,
      lng,
      status: "requested",
      base_price: basePrice,
      price,
      surge_multiplier: multiplier,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job });
}
