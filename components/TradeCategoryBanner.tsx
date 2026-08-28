"use client";

import { useEffect, useState } from "react";
import { TRADE_ICON_PROPS, TRADE_LUCIDE_ICONS } from "@/lib/tradeIcons";
import { getTradeTheme, TradeTheme } from "@/lib/tradeThemes";
import { TRADE_TYPES, TRADE_LABELS, TradeType } from "@/lib/types";

interface TradeCategoryBannerProps {
  selected: TradeType;
  onSelect: (trade: TradeType) => void;
  theme?: TradeTheme;
  /** When true, omits outer background — parent supplies the hero gradient */
  embedded?: boolean;
}

export default function TradeCategoryBanner({
  selected,
  onSelect,
  theme,
  embedded = false,
}: TradeCategoryBannerProps) {
  const activeTheme = theme ?? getTradeTheme(selected);
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

  const content = (
    <>
      <p
        className="font-heading text-xs uppercase tracking-widest mb-5"
        style={{ color: embedded ? activeTheme.onGradientMuted : "#9CA3AF" }}
      >
        What do you need?
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
        {TRADE_TYPES.map((trade) => {
          const Icon = TRADE_LUCIDE_ICONS[trade];
          const tradeTheme = getTradeTheme(trade);
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
              className={`flex shrink-0 snap-start flex-col items-center gap-2.5 rounded-2xl px-5 py-4 min-w-[96px] transition-all duration-300 ${
                isSelected
                  ? "scale-[1.04] shadow-xl ring-2 ring-white/90"
                  : isHighlighted && !paused
                    ? "ring-1 ring-white/30"
                    : "ring-1 ring-transparent hover:ring-white/20"
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: "#FFFFFF",
                      color: tradeTheme.primary,
                      boxShadow: `0 12px 28px ${tradeTheme.primary}40`,
                    }
                  : embedded
                    ? {
                        backgroundColor: "rgba(255,255,255,0.18)",
                        color: activeTheme.onGradient,
                      }
                    : {
                        backgroundColor: isHighlighted && !paused ? "#374151" : "#1F2937",
                        color: "#FFFFFF",
                      }
              }
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300"
                style={{
                  backgroundColor: isSelected
                    ? tradeTheme.iconBg
                    : embedded
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.08)",
                }}
              >
                <Icon
                  {...TRADE_ICON_PROPS}
                  className="shrink-0"
                  style={{ color: isSelected ? tradeTheme.iconColor : undefined }}
                />
              </span>
              <span className="font-heading text-sm font-semibold whitespace-nowrap">
                {TRADE_LABELS[trade]}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  return (
    <div className="bg-black text-white px-4 pt-5 pb-6">{content}</div>
  );
}
