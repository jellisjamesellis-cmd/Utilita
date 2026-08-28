import { TradeType } from "./types";

export interface TradeTheme {
  primary: string;
  primaryDark: string;
  gradientFrom: string;
  gradientTo: string;
  tint: string;
  iconBg: string;
  iconColor: string;
  statBg: string;
  statLabel: string;
  onGradient: string;
  onGradientMuted: string;
}

export const TRADE_THEMES: Record<TradeType, TradeTheme> = {
  painter: {
    primary: "#7C3AED",
    primaryDark: "#6D28D9",
    gradientFrom: "#8B5CF6",
    gradientTo: "#EC4899",
    tint: "#F5F3FF",
    iconBg: "#EDE9FE",
    iconColor: "#7C3AED",
    statBg: "rgba(237, 233, 254, 0.85)",
    statLabel: "#7C3AED",
    onGradient: "#FFFFFF",
    onGradientMuted: "rgba(255,255,255,0.72)",
  },
  plumber: {
    primary: "#0284C7",
    primaryDark: "#0369A1",
    gradientFrom: "#0EA5E9",
    gradientTo: "#06B6D4",
    tint: "#E0F2FE",
    iconBg: "#BAE6FD",
    iconColor: "#0284C7",
    statBg: "rgba(186, 230, 253, 0.85)",
    statLabel: "#0369A1",
    onGradient: "#FFFFFF",
    onGradientMuted: "rgba(255,255,255,0.72)",
  },
  mover: {
    primary: "#EA580C",
    primaryDark: "#C2410C",
    gradientFrom: "#F97316",
    gradientTo: "#FBBF24",
    tint: "#FFF7ED",
    iconBg: "#FFEDD5",
    iconColor: "#EA580C",
    statBg: "rgba(255, 237, 213, 0.9)",
    statLabel: "#C2410C",
    onGradient: "#FFFFFF",
    onGradientMuted: "rgba(255,255,255,0.72)",
  },
  handyman: {
    primary: "#059669",
    primaryDark: "#047857",
    gradientFrom: "#10B981",
    gradientTo: "#14B8A6",
    tint: "#ECFDF5",
    iconBg: "#D1FAE5",
    iconColor: "#059669",
    statBg: "rgba(209, 250, 229, 0.9)",
    statLabel: "#047857",
    onGradient: "#FFFFFF",
    onGradientMuted: "rgba(255,255,255,0.72)",
  },
  cleaner: {
    primary: "#0891B2",
    primaryDark: "#0E7490",
    gradientFrom: "#22D3EE",
    gradientTo: "#6366F1",
    tint: "#ECFEFF",
    iconBg: "#CFFAFE",
    iconColor: "#0891B2",
    statBg: "rgba(207, 250, 254, 0.9)",
    statLabel: "#0E7490",
    onGradient: "#FFFFFF",
    onGradientMuted: "rgba(255,255,255,0.72)",
  },
};

export function getTradeTheme(trade: TradeType): TradeTheme {
  return TRADE_THEMES[trade];
}
