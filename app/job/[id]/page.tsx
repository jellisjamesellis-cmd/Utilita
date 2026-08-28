"use client";

import RequestFlowHeader from "@/components/RequestFlowHeader";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DynamicMapView from "@/components/DynamicMapView";
import TradespersonCard from "@/components/TradespersonCard";
import type { MapPin } from "@/components/MapView";
import { useJobRealtime } from "@/lib/hooks";
import { liveEtaMinutes } from "@/lib/liveEta";
import { simulateMovement } from "@/lib/simulateMovement";
import { STATUS_LABELS, TRADE_LABELS } from "@/lib/types";

const MOVEMENT_DURATION_MS = 150_000; // ~2.5 min

export default function JobTrackingPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { job, tradesperson, loading } = useJobRealtime(jobId);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [simPosition, setSimPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [searching, setSearching] = useState(true);
  const simStarted = useRef(false);
  const acceptTriggered = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Auto-accept after 2–5s simulated matching delay
  useEffect(() => {
    if (!job) return;
    if (
      job.status !== "requested" ||
      !job.tradesperson_id ||
      acceptTriggered.current
    ) {
      if (job.status !== "requested") setSearching(false);
      return;
    }

    acceptTriggered.current = true;
    const delay = 2000 + Math.random() * 3000;

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto_accept" }),
      });
      if (res.ok) {
        setSearching(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [job, jobId]);

  // Simulated movement toward customer
  useEffect(() => {
    if (!job) return;

    const canSimulate =
      (job.status === "accepted" || job.status === "en_route") &&
      job.tradesperson_lat != null &&
      job.tradesperson_lng != null;

    if (!canSimulate || simStarted.current) return;
    simStarted.current = true;
    setSearching(false);

    const start = {
      lat: job.tradesperson_lat!,
      lng: job.tradesperson_lng!,
    };
    const destination = { lat: job.lat, lng: job.lng };

    cleanupRef.current = simulateMovement(
      start,
      destination,
      (position, progress) => {
        setSimPosition(position);
        const eta = liveEtaMinutes(position, destination);
        setEtaMinutes(eta);

        fetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tradesperson_lat: position.lat,
            tradesperson_lng: position.lng,
          }),
        }).catch(() => {});

        if (progress >= 1) {
          fetch(`/api/jobs/${jobId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "arrived" }),
          }).catch(() => {});
          setEtaMinutes(0);
        }
      },
      { durationMs: MOVEMENT_DURATION_MS, intervalMs: 2000 }
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
    if (job?.status === "arrived" || job?.status === "en_route" || job?.status === "accepted") {
      setSearching(false);
    }
  }, [job?.rating, job?.status]);

  async function submitRating(stars: number) {
    setRating(stars);
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: stars }),
    });
    if (res.ok) setRated(true);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f6f6f6]">
        <p className="text-gray-500">Loading job…</p>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#f6f6f6] gap-4">
        <p className="text-gray-600">Job not found.</p>
        <Link href="/request" className="text-black font-semibold underline">
          Back to request
        </Link>
      </main>
    );
  }

  const tpLat = simPosition?.lat ?? job.tradesperson_lat;
  const tpLng = simPosition?.lng ?? job.tradesperson_lng;
  const showTradesperson =
    tpLat != null &&
    tpLng != null &&
    job.status !== "requested" &&
    job.tradesperson_id;

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
      label: tradesperson?.display_name ?? "Tradesperson",
      type: "tradesperson",
    });
  }

  const isLive =
    job.status === "accepted" ||
    job.status === "en_route" ||
    job.status === "arrived";

  return (
    <main className="min-h-screen bg-[#f6f6f6] flex flex-col">
      <RequestFlowHeader title={TRADE_LABELS[job.trade_type]} backHref="/request" />

      <div className="relative flex-1 min-h-[45vh]">
        <DynamicMapView
          center={[job.lat, job.lng]}
          zoom={14}
          pins={pins}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      <div className="relative z-10 -mt-6 px-4 pb-8 space-y-3 max-w-lg mx-auto w-full">
        {(tradesperson || job.tradesperson_id) && (
          <TradespersonCard
            tradesperson={
              tradesperson ?? {
                id: job.tradesperson_id!,
                display_name: "Your tradesperson",
                rating: 4.8,
                completed_jobs_count: 120,
                trade_type: job.trade_type,
              }
            }
            etaMinutes={isLive && job.status !== "arrived" ? etaMinutes : null}
            status={job.status}
            searching={searching && job.status === "requested"}
          />
        )}

        <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {TRADE_LABELS[job.trade_type]}
          </p>
          <p className="font-semibold text-black mt-1">
            {STATUS_LABELS[job.status]}
          </p>
          <p className="text-sm text-gray-600 mt-1">{job.description}</p>
          <p className="text-lg font-bold text-black mt-2">
            £{Number(job.price).toFixed(2)}
          </p>
        </div>

        {job.status === "arrived" && !rated && (
          <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-gray-100">
            <h2 className="font-bold text-black">How was your service?</h2>
            <div className="mt-4 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => submitRating(star)}
                  className="text-3xl hover:scale-110 transition-transform"
                  aria-label={`Rate ${star} stars`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        )}

        {job.status === "completed" && rated && (
          <p className="text-center text-sm text-green-600 font-medium">
            Thanks for your rating!
          </p>
        )}

        <p className="text-xs text-center text-gray-400">
          Simulated dispatch · not real GPS
        </p>
      </div>
    </main>
  );
}
