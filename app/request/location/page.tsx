"use client";

import { MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import DynamicMapView from "@/components/DynamicMapView";
import RequestFlowHeader from "@/components/RequestFlowHeader";
import { readRequestDraft, saveRequestDraft } from "@/lib/requestDraft";
import { TRADE_LABELS, TRADE_TYPES, TradeType, DEFAULT_CENTER } from "@/lib/types";

function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function LocationStepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tradeParam = searchParams.get("trade") as TradeType | null;
  const tradeType =
    tradeParam && TRADE_TYPES.includes(tradeParam) ? tradeParam : "painter";

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Current location");
  const [description, setDescription] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const draft = readRequestDraft();
    if (draft?.description) setDescription(draft.description);
    if (draft?.locationLabel) setLocationLabel(draft.locationLabel);
    if (draft?.lat && draft?.lng) {
      setPin({ lat: draft.lat, lng: draft.lng });
    }
  }, []);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPin({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
      setLocationLabel("Central London");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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
    if (!pin) requestGeolocation();
  }, [pin, requestGeolocation]);

  async function handleConfirmLocation() {
    if (!pin) {
      setError("Drop a pin or allow location access.");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setError("Describe what you need (min 5 characters).");
      return;
    }

    setLoadingOptions(true);
    setError(null);

    saveRequestDraft({
      tradeType,
      lat: pin.lat,
      lng: pin.lng,
      locationLabel,
      description: description.trim(),
    });

    router.push("/request/options");
  }

  return (
    <main className="min-h-screen bg-[#f6f6f6]">
      <div className="mx-auto max-w-lg min-h-screen flex flex-col">
        <RequestFlowHeader
          title="Plan your job"
          subtitle={TRADE_LABELS[tradeType]}
          backHref={`/request`}
        />

        <div className="flex-1 px-4 py-4 space-y-4 pb-28">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Where do you need this?
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3">
              <MapPin className="h-5 w-5 shrink-0 text-gray-500" strokeWidth={2} />
              <input
                type="text"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="Enter address or use map"
                className="flex-1 bg-transparent text-base font-medium text-black outline-none placeholder:text-gray-400 min-w-0"
              />
              <button
                type="button"
                onClick={requestGeolocation}
                className="shrink-0 text-xs font-semibold text-black underline"
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

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f6f6f6] border-t border-gray-200 pb-safe">
          <div className="mx-auto max-w-lg">
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
      </div>
    </main>
  );
}

export default function RequestLocationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f6f6] flex items-center justify-center">
          <p className="text-gray-500">Loading…</p>
        </main>
      }
    >
      <LocationStepContent />
    </Suspense>
  );
}
