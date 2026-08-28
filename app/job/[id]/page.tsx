"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DynamicMapView from "@/components/DynamicMapView";
import type { MapPin } from "@/components/MapView";
import { useJobRealtime } from "@/lib/hooks";
import {
  simulateMovement,
  formatEta,
  distanceKm,
} from "@/lib/simulateMovement";
import { STATUS_LABELS, TRADE_LABELS } from "@/lib/types";

export default function JobTrackingPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { job, loading } = useJobRealtime(jobId);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [simPosition, setSimPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const simStarted = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!job) return;

    const canSimulate =
      (job.status === "accepted" || job.status === "en_route") &&
      job.tradesperson_lat != null &&
      job.tradesperson_lng != null;

    if (!canSimulate || simStarted.current) return;
    simStarted.current = true;

    const start = {
      lat: job.tradesperson_lat!,
      lng: job.tradesperson_lng!,
    };
    const destination = { lat: job.lat, lng: job.lng };

    cleanupRef.current = simulateMovement(
      start,
      destination,
      (position, progress, eta) => {
        setSimPosition(position);
        setEtaMinutes(eta);

        fetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tradesperson_lat: position.lat,
            tradesperson_lng: position.lng,
          }),
        }).catch(() => {});
      },
      { durationMs: 120_000, intervalMs: 3000 }
    );

    return () => {
      cleanupRef.current?.();
    };
  }, [job, jobId]);

  useEffect(() => {
    if (job?.rating) {
      setRating(job.rating);
      setRated(true);
    }
  }, [job?.rating]);

  async function submitRating(stars: number) {
    setRating(stars);
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: stars }),
    });
    if (res.ok) setRated(true);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading job…</p>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-slate-600">Job not found.</p>
        <Link href="/request" className="text-brand-600 hover:underline">
          Back to request
        </Link>
      </main>
    );
  }

  const tpLat = simPosition?.lat ?? job.tradesperson_lat;
  const tpLng = simPosition?.lng ?? job.tradesperson_lng;
  const showTradesperson =
    tpLat != null && tpLng != null && job.status !== "requested";

  const pins: MapPin[] = [
    {
      lat: job.lat,
      lng: job.lng,
      label: "Your location",
      type: "customer",
    },
  ];

  if (showTradesperson) {
    pins.push({
      lat: tpLat!,
      lng: tpLng!,
      label: "Tradesperson (simulated)",
      type: "tradesperson",
    });
  }

  const distance =
    showTradesperson && tpLat != null && tpLng != null
      ? distanceKm({ lat: tpLat, lng: tpLng }, { lat: job.lat, lng: job.lng })
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/request" className="text-sm text-brand-600 hover:underline">
              ← New request
            </Link>
            <h1 className="text-lg font-bold text-slate-900">
              {TRADE_LABELS[job.trade_type]} job
            </h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-600">
                {STATUS_LABELS[job.status]}
              </p>
              <p className="mt-1 text-slate-900">{job.description}</p>
            </div>
            <p className="text-xl font-bold text-slate-900 shrink-0">
              £{Number(job.price).toFixed(2)}
            </p>
          </div>

          {job.status === "requested" && (
            <p className="mt-4 text-sm text-slate-500 animate-pulse">
              Searching for an available {TRADE_LABELS[job.trade_type].toLowerCase()}…
            </p>
          )}

          {(job.status === "accepted" || job.status === "en_route") && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span className="rounded-full bg-green-100 text-green-800 px-3 py-1 font-medium">
                {etaMinutes != null ? formatEta(etaMinutes) : "Calculating ETA…"}
              </span>
              {distance != null && (
                <span className="text-slate-500">
                  {(distance * 1000).toFixed(0)}m away (simulated)
                </span>
              )}
            </div>
          )}
        </div>

        <DynamicMapView
          center={[job.lat, job.lng]}
          zoom={14}
          pins={pins}
          className="h-96 w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm"
        />

        <p className="text-xs text-center text-slate-400">
          Blue = you · Green = tradesperson · Movement is simulated for demo
        </p>

        {job.status === "completed" && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <h2 className="font-semibold text-slate-900">Job complete</h2>
            <p className="mt-1 text-sm text-slate-500">How did it go?</p>
            <div className="mt-4 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={rated}
                  onClick={() => submitRating(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    star <= rating ? "opacity-100" : "opacity-30"
                  }`}
                  aria-label={`Rate ${star} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            {rated && (
              <p className="mt-2 text-sm text-brand-600">Thanks for your rating!</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
