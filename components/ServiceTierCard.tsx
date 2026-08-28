"use client";

import { TierQuote } from "@/lib/pricing";

interface ServiceTierCardProps {
  quote: TierQuote;
  selected: boolean;
  onSelect: () => void;
}

export default function ServiceTierCard({
  quote,
  selected,
  onSelect,
}: ServiceTierCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl bg-white p-4 text-left transition-all ${
        selected
          ? "ring-2 ring-black shadow-md"
          : "ring-1 ring-gray-200 hover:ring-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-black">{quote.label}</h3>
            {quote.etaLabel && quote.tier === "priority" && (
              <span className="rounded-full bg-black px-2.5 py-0.5 text-xs font-semibold text-white">
                {quote.etaLabel}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{quote.description}</p>
          {quote.tier === "priority" && quote.surgeMultiplier > 1.05 && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              {quote.surgeMultiplier.toFixed(1)}x surge applied
            </p>
          )}
          {quote.tier === "within_12h" && (
            <p className="mt-2 text-xs text-gray-400">Flexible arrival window</p>
          )}
          {quote.tier === "within_3d" && (
            <p className="mt-2 text-xs text-gray-400">Book ahead · best value</p>
          )}
        </div>
        <p className="shrink-0 text-xl font-bold text-black">
          £{quote.price.toFixed(2)}
        </p>
      </div>
    </button>
  );
}

export type { TierQuote };
