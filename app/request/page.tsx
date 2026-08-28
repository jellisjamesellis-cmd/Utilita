"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DynamicMapView from "@/components/DynamicMapView";
import {
  TRADE_TYPES,
  TRADE_LABELS,
  TradeType,
  DEFAULT_CENTER,
  BASE_PRICES,
} from "@/lib/types";
import { formatSurge, calculatePrice } from "@/lib/pricing";

export default function RequestPage() {
  const router = useRouter();
  const [tradeType, setTradeType] = useState<TradeType>("handyman");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [surge, setSurge] = useState({
    multiplier: 1,
    available: 0,
    openJobs: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSurge = useCallback(async () => {
    const res = await fetch(`/api/surge?trade_type=${tradeType}`);
    if (res.ok) {
      const data = await res.json();
      setSurge(data);
    }
  }, [tradeType]);

  useEffect(() => {
    fetchSurge();
    const interval = setInterval(fetchSurge, 15000);
    return () => clearInterval(interval);
  }, [fetchSurge]);

  const basePrice = BASE_PRICES[tradeType];
  const estimatedPrice = calculatePrice(basePrice, surge.multiplier);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) {
      setError("Tap the map to drop a pin at your location.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trade_type: tradeType,
        description,
        lat: pin.lat,
        lng: pin.lng,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create request");
      setSubmitting(false);
      return;
    }

    router.push(`/job/${data.job.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-sm text-brand-600 hover:underline">
              ← Utilita
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Request help</h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl space-y-6 px-6 py-8"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-medium text-slate-700">
            Trade type
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TRADE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTradeType(t)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  tradeType === t
                    ? "border-brand-600 bg-brand-50 text-brand-900"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {TRADE_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              {formatSurge(surge.multiplier)}
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              {surge.available} available · {surge.openJobs} open requests
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              Est. £{estimatedPrice.toFixed(2)}{" "}
              <span className="text-sm font-normal text-slate-500">
                (base £{basePrice.toFixed(2)})
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your location
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Click the map to drop a pin (simulated GPS for demo)
          </p>
          <DynamicMapView
            center={pin ? [pin.lat, pin.lng] : DEFAULT_CENTER}
            pins={
              pin
                ? [
                    {
                      lat: pin.lat,
                      lng: pin.lng,
                      label: "Your location",
                      type: "customer",
                    },
                  ]
                : []
            }
            draggable
            onPinDrop={(lat, lng) => setPin({ lat, lng })}
            className="h-72 w-full rounded-xl overflow-hidden border border-slate-200"
          />
          {pin && (
            <p className="mt-2 text-xs text-slate-500 font-mono">
              {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700"
          >
            What do you need?
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Hang two shelves in the living room"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            required
            minLength={5}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Request tradesperson"}
        </button>
      </form>
    </main>
  );
}
