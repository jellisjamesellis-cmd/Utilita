"use client";

import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import RequestFlowHeader from "@/components/RequestFlowHeader";
import TradeCategoryBanner from "@/components/TradeCategoryBanner";
import { TRADE_ICON_PROPS, TRADE_LUCIDE_ICONS } from "@/lib/tradeIcons";
import { saveTradeSelection } from "@/lib/requestDraft";
import {
  TRADE_LABELS,
  TradeType,
  DEFAULT_CENTER,
  BASE_PRICES,
} from "@/lib/types";
import { calculatePrice } from "@/lib/pricing";

interface TradeTeaser {
  priorityPrice: number;
  etaMinutes: number | null;
  surgeMultiplier: number;
}

export default function RequestHomePage() {
  const router = useRouter();
  const [tradeType, setTradeType] = useState<TradeType>("painter");
  const [teaser, setTeaser] = useState<TradeTeaser | null>(null);

  const loadTeaser = useCallback(async (trade: TradeType) => {
    const [lat, lng] = DEFAULT_CENTER;
    const res = await fetch(
      `/api/request/options?trade_type=${trade}&lat=${lat}&lng=${lng}`
    );
    if (!res.ok) return;
    const data = await res.json();
    const priority = data.tiers?.find(
      (t: { tier: string }) => t.tier === "priority"
    );
    setTeaser({
      priorityPrice: priority?.price ?? calculatePrice(BASE_PRICES[trade], data.surge?.multiplier ?? 1),
      etaMinutes: priority?.etaMinutes ?? data.nearest?.etaMinutes ?? null,
      surgeMultiplier: data.surge?.multiplier ?? 1,
    });
  }, []);

  useEffect(() => {
    loadTeaser(tradeType);
  }, [tradeType, loadTeaser]);

  function handleContinue() {
    saveTradeSelection(tradeType);
    router.push(`/request/location?trade=${tradeType}`);
  }

  const Icon = TRADE_LUCIDE_ICONS[tradeType];

  return (
    <main className="min-h-screen bg-[#f6f6f6] flex flex-col">
      <div className="mx-auto w-full max-w-lg flex-1 flex flex-col">
        <RequestFlowHeader
          title="Book a tradesperson"
          showBack={false}
          rightSlot={<UserButton afterSignOutUrl="/" />}
        />

        <TradeCategoryBanner selected={tradeType} onSelect={setTradeType} />

        <div className="flex-1 px-4 py-4">
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <Icon {...TRADE_ICON_PROPS} className="text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-black leading-tight">
                  {TRADE_LABELS[tradeType]}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Book a verified {TRADE_LABELS[tradeType].toLowerCase()} near you
                </p>
              </div>
            </div>

            {teaser && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Priority from
                  </p>
                  <p className="text-lg font-bold text-black">
                    £{teaser.priorityPrice.toFixed(2)}
                    {teaser.surgeMultiplier > 1.05 && (
                      <span className="ml-2 text-xs font-medium text-amber-700">
                        {teaser.surgeMultiplier.toFixed(1)}x surge
                      </span>
                    )}
                  </p>
                </div>
                {teaser.etaMinutes != null && (
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Est. arrival
                    </p>
                    <p className="text-lg font-bold text-black">
                      ~{teaser.etaMinutes} min
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 p-4 bg-[#f6f6f6] pb-safe">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-xl bg-black py-4 text-base font-semibold text-white hover:bg-gray-900 active:scale-[0.99] transition-all"
          >
            Continue with {TRADE_LABELS[tradeType]}
          </button>
        </div>
      </div>
    </main>
  );
}
