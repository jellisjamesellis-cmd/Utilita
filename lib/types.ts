export const TRADE_TYPES = [
  "handyman",
  "painter",
  "mover",
  "cleaner",
] as const;

export type TradeType = (typeof TRADE_TYPES)[number];

export type UserRole = "customer" | "tradesperson";

export type JobStatus =
  | "requested"
  | "accepted"
  | "en_route"
  | "completed"
  | "declined"
  | "cancelled";

export interface User {
  id: string;
  email: string | null;
  role: UserRole;
  trade_type: TradeType | null;
  created_at: string;
}

export interface Availability {
  id: string;
  tradesperson_id: string;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  updated_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  tradesperson_id: string | null;
  trade_type: TradeType;
  description: string;
  lat: number;
  lng: number;
  status: JobStatus;
  base_price: number;
  price: number;
  surge_multiplier: number;
  tradesperson_lat: number | null;
  tradesperson_lng: number | null;
  rating: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const TRADE_LABELS: Record<TradeType, string> = {
  handyman: "Handyman",
  painter: "Painter",
  mover: "Mover",
  cleaner: "Cleaner",
};

export const BASE_PRICES: Record<TradeType, number> = {
  handyman: 55,
  painter: 65,
  mover: 75,
  cleaner: 45,
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  requested: "Finding a tradesperson…",
  accepted: "Accepted — preparing to leave",
  en_route: "On the way",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

/** Default map center: central London for demo */
export const DEFAULT_CENTER: [number, number] = [51.5074, -0.1278];
