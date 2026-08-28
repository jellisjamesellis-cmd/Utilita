import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("role, trade_type")
    .eq("id", userId)
    .single();

  if (user?.role !== "tradesperson") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("trade_type", user.trade_type!)
    .eq("status", "requested")
    .eq("service_tier", "priority")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const active = (jobs ?? []).filter(
    (j) => !j.expires_at || new Date(j.expires_at).getTime() > now
  );

  return NextResponse.json({ jobs: active });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const isAvailable = Boolean(body.is_available);
  const lat = body.current_lat != null ? Number(body.current_lat) : undefined;
  const lng = body.current_lng != null ? Number(body.current_lng) : undefined;

  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (user?.role !== "tradesperson") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = { is_available: isAvailable };
  if (lat != null && !Number.isNaN(lat)) updates.current_lat = lat;
  if (lng != null && !Number.isNaN(lng)) updates.current_lng = lng;

  const { data, error } = await supabase
    .from("availability")
    .upsert(
      { tradesperson_id: userId, ...updates },
      { onConflict: "tradesperson_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ availability: data });
}
