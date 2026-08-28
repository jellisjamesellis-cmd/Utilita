export const BRAND_BG = "#15171B";

export type PendingRole = "customer" | "tradesperson";

export interface PendingOnboarding {
  role: PendingRole;
  tradeType?: string;
}

const KEY = "utilita_pending_onboarding";

export function savePendingOnboarding(data: PendingOnboarding): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function readPendingOnboarding(): PendingOnboarding | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingOnboarding;
  } catch {
    return null;
  }
}

export function clearPendingOnboarding(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
