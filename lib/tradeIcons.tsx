import {
  Hammer,
  LucideIcon,
  Package,
  PaintRoller,
  Sparkles,
  Wrench,
} from "lucide-react";
import { TradeType } from "./types";

export const TRADE_LUCIDE_ICONS: Record<TradeType, LucideIcon> = {
  painter: PaintRoller,
  plumber: Wrench,
  mover: Package,
  handyman: Hammer,
  cleaner: Sparkles,
};

export const TRADE_ICON_PROPS = {
  size: 24,
  strokeWidth: 2,
  "aria-hidden": true,
} as const;
