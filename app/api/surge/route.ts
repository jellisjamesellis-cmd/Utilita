import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";
import { fetchSurgeForTrade } from "@/lib/pricing";
import { TRADE_TYPES, TradeType } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tradeType = searchParams.get("trade_type") as TradeType | null;

  if (!tradeType || !TRADE_TYPES.includes(tradeType)) {
    return NextResponse.json({ error: "Invalid trade type" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const surge = await fetchSurgeForTrade(tradeType, supabase);

  return NextResponse.json(surge);
}
