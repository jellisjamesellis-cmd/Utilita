"use client";

import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import TradeCategoryBanner from "@/components/TradeCategoryBanner";
import { TRADE_ICON_PROPS, TRADE_LUCIDE_ICONS } from "@/lib/tradeIcons";
import { getTradeTheme } from "@/lib/tradeThemes";
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
  const theme = getTradeTheme(tradeType);

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
    <main
      className="min-h-screen flex flex-col transition-colors duration-500"
      style={{ backgroundColor: theme.tint }}
    >
      <div className="mx-auto w-full max-w-lg flex-1 flex flex-col min-h-screen">
        {/* Trade-themed hero — safe area + breathing room at top */}
        <section
          className="relative px-5 pb-8 pt-safe-logo transition-all duration-500 ease-out"
          style={{
            background: `linear-gradient(145deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`,
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-6 h-40 w-40 rounded-full opacity-30 blur-2xl"
            style={{ backgroundColor: theme.onGradient }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full opacity-20 blur-2xl"
            style={{ backgroundColor: theme.primaryDark }}
            aria-hidden
          />

          <div className="relative flex items-start justify-between gap-3 mb-8 mt-2">
            <div className="min-w-0 pt-1">
              <h1
                className="font-heading text-2xl font-bold leading-tight"
                style={{ color: theme.onGradient }}
              >
                Book a tradesperson
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: theme.onGradientMuted }}
              >
                Pick a trade, then we&apos;ll find someone nearby
              </p>
            </div>
            <div className="shrink-0 pt-1">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>

          <div className="relative">
            <TradeCategoryBanner
              selected={tradeType}
              onSelect={setTradeType}
              theme={theme}
              embedded
            />
          </div>
        </section>

        {/* Detail card — vertically centred in remaining space */}
        <div className="flex-1 flex flex-col justify-center px-5 py-6">
          <div
            className="rounded-3xl bg-white px-5 py-5 shadow-lg ring-1 transition-shadow duration-500"
            style={{
              boxShadow: `0 16px 40px ${theme.primary}22`,
              borderColor: `${theme.primary}22`,
            }}
          >
            <div className="flex items-start gap-3.5">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors duration-500"
                style={{ backgroundColor: theme.iconBg }}
              >
                <Icon
                  {...TRADE_ICON_PROPS}
                  size={28}
                  style={{ color: theme.iconColor }}
                />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2
                  className="font-heading text-xl font-bold leading-tight transition-colors duration-500"
                  style={{ color: theme.primaryDark }}
                >
                  {TRADE_LABELS[tradeType]}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Book a verified {TRADE_LABELS[tradeType].toLowerCase()} near you
                </p>
              </div>
            </div>

            {teaser && (
              <div
                className="mt-5 flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 transition-colors duration-500"
                style={{ backgroundColor: theme.statBg }}
              >
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: theme.statLabel }}
                  >
                    Priority from
                  </p>
                  <p
                    className="font-heading text-lg font-bold mt-0.5"
                    style={{ color: theme.primaryDark }}
                  >
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
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: theme.statLabel }}
                    >
                      Est. arrival
                    </p>
                    <p
                      className="font-heading text-lg font-bold mt-0.5"
                      style={{ color: theme.primaryDark }}
                    >
                      ~{teaser.etaMinutes} min
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className="sticky bottom-0 p-5 pb-safe transition-colors duration-500"
          style={{ backgroundColor: theme.tint }}
        >
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-2xl py-4 text-base font-semibold text-white hover:opacity-95 active:scale-[0.99] transition-all duration-300 shadow-lg"
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 8px 24px ${theme.primary}55`,
            }}
          >
            Continue with {TRADE_LABELS[tradeType]}
          </button>
        </div>
      </div>
    </main>
  );
}
