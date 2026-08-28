export const TRADE_TYPES = [
  "painter",
  "plumber",
  "mover",
  "handyman",
  "cleaner",
] as const;

export type TradeType = (typeof TRADE_TYPES)[number];

export type UserRole = "customer" | "tradesperson";

export type ServiceTier = "priority" | "within_12h" | "within_3d";

export type JobStatus =
  | "requested"
  | "accepted"
  | "en_route"
  | "arrived"
  | "completed"
  | "declined"
  | "cancelled";

export interface TradespersonProfile {
  id: string;
  display_name: string | null;
  rating: number | null;
  completed_jobs_count: number | null;
  trade_type: TradeType | null;
}

export interface User {
  id: string;
  email: string | null;
  role: UserRole;
  trade_type: TradeType | null;
  display_name: string | null;
  rating: number | null;
  completed_jobs_count: number | null;
  is_mock: boolean;
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
  service_tier: ServiceTier;
  scheduled_for: string | null;
  tradesperson_lat: number | null;
  tradesperson_lng: number | null;
  rating: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const TRADE_LABELS: Record<TradeType, string> = {
  painter: "Painter",
  plumber: "Plumber",
  mover: "Mover",
  handyman: "Handyman",
  cleaner: "Cleaner",
};

export const TRADE_ICONS: Record<TradeType, string> = {
  painter: "🎨",
  plumber: "🔧",
  mover: "📦",
  handyman: "🛠️",
  cleaner: "✨",
};

export const BASE_PRICES: Record<TradeType, number> = {
  painter: 65,
  plumber: 70,
  mover: 75,
  handyman: 55,
  cleaner: 45,
};

export const SERVICE_TIER_LABELS: Record<ServiceTier, string> = {
  priority: "Priority",
  within_12h: "Within 12 hours",
  within_3d: "Within 3 days",
};

export const SERVICE_TIER_DESCRIPTIONS: Record<ServiceTier, string> = {
  priority: "Soonest available tradesperson",
  within_12h: "Standard pricing · no surge",
  within_3d: "Lowest price · scheduled visit",
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  requested: "Finding a tradesperson…",
  accepted: "On the way",
  en_route: "On the way",
  arrived: "Your tradesperson has arrived",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

/** Default map center: central London for demo */
export const DEFAULT_CENTER: [number, number] = [51.5074, -0.1278];

/** Greater London bounding box for seed data */
export const LONDON_BOUNDS = {
  latMin: 51.28,
  latMax: 51.69,
  lngMin: -0.51,
  lngMax: 0.33,
};
