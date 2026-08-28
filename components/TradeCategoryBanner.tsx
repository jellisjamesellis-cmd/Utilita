"use client";

import { useEffect, useState } from "react";
import {
  TRADE_TYPES,
  TRADE_LABELS,
  TRADE_ICONS,
  TradeType,
} from "@/lib/types";

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TRADE_TYPES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setActiveIndex(TRADE_TYPES.indexOf(selected));
  }, [selected]);

  const highlighted = TRADE_TYPES[activeIndex];

  return (
    <div className="bg-black text-white px-4 pt-6 pb-5">
      <p className="text-xs uppercase tracking-widest text-white/60 mb-4">
        What do you need?
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TRADE_TYPES.map((trade) => {
          const isHighlighted = trade === highlighted;
          const isSelected = trade === selected;
          return (
            <button
              key={trade}
              type="button"
              onClick={() => onSelect(trade)}
              className={`flex shrink-0 flex-col items-center gap-2 rounded-2xl px-5 py-4 min-w-[88px] transition-all duration-300 ${
                isSelected
                  ? "bg-white text-black scale-105"
                  : isHighlighted
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {TRADE_ICONS[trade]}
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">
                {TRADE_LABELS[trade]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
