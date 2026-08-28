"use client";

import { useEffect, useState } from "react";
import { TRADE_ICON_PROPS, TRADE_LUCIDE_ICONS } from "@/lib/tradeIcons";
import { TRADE_TYPES, TRADE_LABELS, TradeType } from "@/lib/types";

interface TradeCategoryBannerProps {
  selected: TradeType;
  onSelect: (trade: TradeType) => void;
}

export default function TradeCategoryBanner({
  selected,
  onSelect,
}: TradeCategoryBannerProps) {
  const [activeIndex, setActiveIndex] = useState(
    TRADE_TYPES.indexOf(selected)
  );
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TRADE_TYPES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    setActiveIndex(TRADE_TYPES.indexOf(selected));
  }, [selected]);

  const highlighted = TRADE_TYPES[activeIndex];

  return (
    <div className="bg-black text-white px-4 pt-5 pb-6">
      <p className="font-heading text-xs uppercase tracking-widest text-white/60 mb-5">
        What do you need?
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {TRADE_TYPES.map((trade) => {
          const Icon = TRADE_LUCIDE_ICONS[trade];
          const isHighlighted = trade === highlighted;
          const isSelected = trade === selected;

          return (
            <button
              key={trade}
              type="button"
              onClick={() => {
                setPaused(true);
                onSelect(trade);
              }}
              className={`flex shrink-0 snap-start flex-col items-center gap-3 rounded-2xl px-6 py-5 min-w-[100px] transition-all duration-200 ${
                isSelected
                  ? "bg-white text-black shadow-lg shadow-black/20 ring-2 ring-white/90 scale-[1.02]"
                  : isHighlighted && !paused
                    ? "bg-white/15 text-white ring-1 ring-white/20"
                    : "bg-white/5 text-white/75 ring-1 ring-transparent hover:bg-white/10"
              }`}
            >
              <Icon {...TRADE_ICON_PROPS} className="shrink-0" />
              <span className="font-heading text-sm font-semibold whitespace-nowrap">
                {TRADE_LABELS[trade]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
