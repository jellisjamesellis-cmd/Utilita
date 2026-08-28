import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";
import { mockStartPosition } from "@/lib/simulateMovement";

async function fetchTradespersonProfile(
  supabase: ReturnType<typeof import("@/lib/supabaseClient").createServiceClient>,
  tradespersonId: string | null
) {
  if (!tradespersonId) return null;
  const { data } = await supabase
    .from("users")
    .select("id, display_name, rating, completed_jobs_count, trade_type")
    .eq("id", tradespersonId)
    .single();
  return data;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const tradesperson = await fetchTradespersonProfile(
    supabase,
    job.tradesperson_id
  );

  return NextResponse.json({ job, tradesperson });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const supabase = createServiceClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const isCustomer = job.customer_id === userId;
  const isAssignedTp = job.tradesperson_id === userId;
  const updates: Record<string, unknown> = {};

  if (body.tradesperson_lat != null && body.tradesperson_lng != null) {
    if (!isCustomer && !isAssignedTp) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    updates.tradesperson_lat = body.tradesperson_lat;
    updates.tradesperson_lng = body.tradesperson_lng;
    if (job.status === "accepted") {
      updates.status = "en_route";
    }
  }

  if (body.status === "arrived" && isCustomer) {
    if (["accepted", "en_route"].includes(job.status)) {
      updates.status = "arrived";
      updates.tradesperson_lat = job.lat;
      updates.tradesperson_lng = job.lng;
    }
  }

  if (body.status === "completed" && (isAssignedTp || isCustomer)) {
    if (["arrived", "en_route", "accepted"].includes(job.status)) {
      updates.status = "completed";
    }
  }

  if (body.rating != null && isCustomer) {
    const rating = Number(body.rating);
    if (rating >= 1 && rating <= 5 && job.status === "completed") {
      updates.rating = rating;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates" }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tradesperson = await fetchTradespersonProfile(
    supabase,
    updated.tradesperson_id
  );

  return NextResponse.json({ job: updated, tradesperson });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const action = body.action as "accept" | "decline" | "complete" | "auto_accept";
  const supabase = createServiceClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (action === "auto_accept") {
    if (job.customer_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (job.status !== "requested" || !job.tradesperson_id) {
      return NextResponse.json({ error: "Job not eligible" }, { status: 409 });
    }

    const { data: updated, error } = await supabase
      .from("jobs")
      .update({
        status: "accepted",
        expires_at: null,
      })
      .eq("id", id)
      .eq("status", "requested")
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: "Could not accept job" }, { status: 409 });
    }

    const tradesperson = await fetchTradespersonProfile(
      supabase,
      updated.tradesperson_id
    );

    return NextResponse.json({ job: updated, tradesperson });
  }

  if (action === "accept") {
    const { data: tp } = await supabase
      .from("users")
      .select("role, trade_type, is_mock")
      .eq("id", userId)
      .single();

    if (tp?.role !== "tradesperson" || tp.trade_type !== job.trade_type) {
      return NextResponse.json({ error: "Not eligible" }, { status: 403 });
    }

    if (job.status !== "requested" || job.tradesperson_id) {
      return NextResponse.json({ error: "Job no longer available" }, { status: 409 });
    }

    const start = mockStartPosition({ lat: job.lat, lng: job.lng });

    const { data: updated, error } = await supabase
      .from("jobs")
      .update({
        tradesperson_id: userId,
        status: "accepted",
        tradesperson_lat: start.lat,
        tradesperson_lng: start.lng,
        expires_at: null,
      })
      .eq("id", id)
      .eq("status", "requested")
      .is("tradesperson_id", null)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: "Could not accept — job may have been taken" },
        { status: 409 }
      );
    }

    await supabase
      .from("availability")
      .update({
        current_lat: start.lat,
        current_lng: start.lng,
      })
      .eq("tradesperson_id", userId);

    return NextResponse.json({ job: updated });
  }

  if (action === "decline") {
    if (job.status !== "requested") {
      return NextResponse.json({ error: "Job not open" }, { status: 409 });
    }

    const expiresAt = new Date(Date.now() + 30_000).toISOString();
    await supabase
      .from("jobs")
      .update({ expires_at: expiresAt })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
    if (job.tradesperson_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ job: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
