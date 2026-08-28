"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import RequestFlowHeader from "@/components/RequestFlowHeader";
import ServiceTierCard from "@/components/ServiceTierCard";
import { TierQuote } from "@/lib/pricing";
import {
  clearRequestDraft,
  readRequestDraft,
  savePendingBooking,
} from "@/lib/requestDraft";
import { TRADE_LABELS, ServiceTier } from "@/lib/types";

function OptionsStepContent() {
  const router = useRouter();
  const [draft, setDraft] = useState(readRequestDraft());
  const [tiers, setTiers] = useState<TierQuote[]>([]);
  const [selectedTier, setSelectedTier] = useState<ServiceTier>("priority");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = readRequestDraft();
    if (!d?.lat || !d?.lng || !d.description) {
      router.replace("/request");
      return;
    }
    setDraft(d);

    fetch(
      `/api/request/options?trade_type=${d.tradeType}&lat=${d.lat}&lng=${d.lng}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.tiers) setTiers(data.tiers);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load pricing");
        setLoading(false);
      });
  }, [router]);

  async function handleChooseTier() {
    if (!draft) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trade_type: draft.tradeType,
        service_tier: selectedTier,
        description: draft.description,
        location_label: draft.locationLabel,
        lat: draft.lat,
        lng: draft.lng,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create request");
      setSubmitting(false);
      return;
    }

    clearRequestDraft();

    if (selectedTier === "priority") {
      router.push(`/job/${data.job.id}`);
    } else {
      savePendingBooking({ jobId: data.job.id, tier: selectedTier });
      router.push(`/request/confirmed?tier=${selectedTier}&job=${data.job.id}`);
    }
  }

  if (!draft) {
    return null;
  }

  const selectedQuote = tiers.find((t) => t.tier === selectedTier);

  return (
    <main className="min-h-screen bg-[#f6f6f6]">
      <div className="mx-auto max-w-lg min-h-screen flex flex-col pb-28">
        <RequestFlowHeader
          title="Choose an option"
          subtitle={`${TRADE_LABELS[draft.tradeType]} · ${draft.locationLabel}`}
          backHref={`/request/location?trade=${draft.tradeType}`}
        />

        <div className="flex-1 px-4 py-4 space-y-3">
          {loading ? (
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

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f6f6f6] border-t border-gray-200 pb-safe">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              disabled={submitting || !selectedQuote || loading}
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

export default function RequestOptionsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f6f6] flex items-center justify-center">
          <p className="text-gray-500">Loading…</p>
        </main>
      }
    >
      <OptionsStepContent />
    </Suspense>
  );
}
