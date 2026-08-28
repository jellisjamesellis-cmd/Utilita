"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DynamicMapView from "@/components/DynamicMapView";
import RequestFlowHeader from "@/components/RequestFlowHeader";
import ServiceTierCard from "@/components/ServiceTierCard";
import TradeCategoryBanner from "@/components/TradeCategoryBanner";
import { TierQuote } from "@/lib/pricing";
import {
  TRADE_LABELS,
  TradeType,
  ServiceTier,
  DEFAULT_CENTER,
  TRADE_ICONS,
} from "@/lib/types";

type Step = "home" | "location" | "options";

function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export default function RequestPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("home");
  const [tradeType, setTradeType] = useState<TradeType>("painter");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Current location");
  const [description, setDescription] = useState("");
  const [selectedTier, setSelectedTier] = useState<ServiceTier>("priority");
  const [tiers, setTiers] = useState<TierQuote[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPin({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
      setLocationLabel("Central London");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPin({ lat, lng });
        setLocationLabel("Current location");
        setLocating(false);
      },
      () => {
        setPin({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
        setLocationLabel("Central London");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (step === "location" && !pin) {
      requestGeolocation();
    }
  }, [step, pin, requestGeolocation]);

  async function loadOptions() {
    if (!pin) return;
    setLoadingOptions(true);
    setError(null);
    const res = await fetch(
      `/api/request/options?trade_type=${tradeType}&lat=${pin.lat}&lng=${pin.lng}`
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load options");
      setLoadingOptions(false);
      return;
    }
    setTiers(data.tiers);
    setSelectedTier("priority");
    setLoadingOptions(false);
    setStep("options");
  }

  async function handleConfirmLocation() {
    if (!pin) {
      setError("Drop a pin or allow location access.");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setError("Describe what you need (min 5 characters).");
      return;
    }
    await loadOptions();
  }

  async function handleChooseTier() {
    if (!pin) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trade_type: tradeType,
        service_tier: selectedTier,
        description: description.trim(),
        location_label: locationLabel,
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

    if (selectedTier === "priority") {
      router.push(`/job/${data.job.id}`);
    } else {
      router.push(`/request/confirmed?job=${data.job.id}&tier=${selectedTier}`);
    }
  }

  const selectedQuote = tiers.find((t) => t.tier === selectedTier);

  if (step === "home") {
    return (
      <main className="min-h-screen bg-[#f6f6f6] flex flex-col">
        <div className="mx-auto w-full max-w-lg flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
            <Link href="/" className="text-sm font-semibold text-black">
              Utilita
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>

          <TradeCategoryBanner selected={tradeType} onSelect={setTradeType} />

          <div className="flex-1 px-4 py-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{TRADE_ICONS[tradeType]}</span>
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    {TRADE_LABELS[tradeType]}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Book a verified {TRADE_LABELS[tradeType].toLowerCase()} near
                    you
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              Tap a category above or swipe to browse trades
            </p>
          </div>

          <div className="sticky bottom-0 p-4 bg-[#f6f6f6]">
            <button
              type="button"
              onClick={() => setStep("location")}
              className="w-full rounded-xl bg-black py-4 text-base font-semibold text-white hover:bg-gray-900 transition-colors"
            >
              Continue with {TRADE_LABELS[tradeType]}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (step === "location") {
    return (
      <main className="min-h-screen bg-[#f6f6f6]">
        <div className="mx-auto max-w-lg min-h-screen flex flex-col">
          <RequestFlowHeader
            title="Plan your job"
            subtitle={TRADE_LABELS[tradeType]}
            onBack={() => setStep("home")}
          />

          <div className="flex-1 px-4 py-4 space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Where do you need this?
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3">
                <span className="text-lg" aria-hidden>
                  📍
                </span>
                <input
                  type="text"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="Enter address or use map"
                  className="flex-1 bg-transparent text-base font-medium text-black outline-none placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={requestGeolocation}
                  className="text-xs font-semibold text-black underline"
                >
                  {locating ? "…" : "GPS"}
                </button>
              </div>
              {pin && (
                <p className="mt-2 text-xs text-gray-400 font-mono">
                  {formatCoords(pin.lat, pin.lng)}
                </p>
              )}
            </div>

            <DynamicMapView
              center={pin ? [pin.lat, pin.lng] : DEFAULT_CENTER}
              zoom={14}
              pins={
                pin
                  ? [
                      {
                        lat: pin.lat,
                        lng: pin.lng,
                        label: locationLabel,
                        type: "customer",
                      },
                    ]
                  : []
              }
              draggable
              onPinDrop={(lat, lng) => {
                setPin({ lat, lng });
                if (locationLabel === "Current location") {
                  setLocationLabel("Selected pin");
                }
              }}
              className="h-64 w-full rounded-2xl overflow-hidden ring-1 ring-gray-200"
            />

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <label
                htmlFor="description"
                className="text-xs font-semibold uppercase tracking-wide text-gray-400"
              >
                What do you need?
              </label>
              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`e.g. ${TRADE_LABELS[tradeType]} for…`}
                className="mt-2 w-full resize-none bg-transparent text-base text-black outline-none placeholder:text-gray-400"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                {error}
              </p>
            )}
          </div>

          <div className="sticky bottom-0 p-4 bg-[#f6f6f6]">
            <button
              type="button"
              disabled={loadingOptions || locating}
              onClick={handleConfirmLocation}
              className="w-full rounded-xl bg-black py-4 text-base font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
            >
              {loadingOptions ? "Loading options…" : "Confirm location"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f6f6]">
      <div className="mx-auto max-w-lg min-h-screen flex flex-col pb-28">
        <RequestFlowHeader
          title="Choose an option"
          subtitle={`${TRADE_LABELS[tradeType]} · ${locationLabel}`}
          onBack={() => setStep("location")}
        />

        <div className="flex-1 px-4 py-4 space-y-3">
          {loadingOptions ? (
            <p className="text-center text-gray-500 py-12">Loading prices…</p>
          ) : (
            tiers.map((quote) => (
              <ServiceTierCard
                key={quote.tier}
                quote={quote}
                selected={selectedTier === quote.tier}
                onSelect={() => setSelectedTier(quote.tier)}
              />
            ))
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f6f6f6] border-t border-gray-200">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              disabled={submitting || !selectedQuote}
              onClick={handleChooseTier}
              className="w-full rounded-xl bg-black py-4 text-base font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
            >
              {submitting
                ? "Booking…"
                : `Choose ${selectedQuote?.label ?? "option"}`}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
