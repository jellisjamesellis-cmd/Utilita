import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";
import { TradeType, UserRole } from "@/lib/types";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const role = body.role as UserRole;
  const tradeType = body.trade_type as TradeType | null | undefined;

  if (!role || !["customer", "tradesperson"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (role === "tradesperson" && !tradeType) {
    return NextResponse.json(
      { error: "Tradesperson must select a trade type" },
      { status: 400 }
    );
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: userId,
        email,
        role,
        trade_type: role === "tradesperson" ? tradeType : null,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (role === "tradesperson") {
    await supabase.from("availability").upsert(
      {
        tradesperson_id: userId,
        is_available: false,
        current_lat: 51.5074 + (Math.random() - 0.5) * 0.05,
        current_lng: -0.1278 + (Math.random() - 0.5) * 0.05,
      },
      { onConflict: "tradesperson_id" }
    );
  }

  return NextResponse.json({ user: data });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data ?? null });
}
