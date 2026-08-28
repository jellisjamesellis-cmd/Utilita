import { ServiceTier, TradeType } from "./types";

const STORAGE_KEY = "utilita_request_draft";

export interface RequestDraft {
  tradeType: TradeType;
  lat: number;
  lng: number;
  locationLabel: string;
  description: string;
}

export function saveRequestDraft(draft: RequestDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function readRequestDraft(): RequestDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RequestDraft;
  } catch {
    return null;
  }
}

export function clearRequestDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function saveTradeSelection(tradeType: TradeType): void {
  const existing = readRequestDraft();
  saveRequestDraft({
    tradeType,
    lat: existing?.lat ?? 0,
    lng: existing?.lng ?? 0,
    locationLabel: existing?.locationLabel ?? "",
    description: existing?.description ?? "",
  });
}

export interface PendingBooking {
  jobId: string;
  tier: ServiceTier;
}

const PENDING_KEY = "utilita_pending_booking";

export function savePendingBooking(booking: PendingBooking): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(booking));
}

export function readPendingBooking(): PendingBooking | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingBooking;
  } catch {
    return null;
  }
}

export function clearPendingBooking(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_KEY);
}
