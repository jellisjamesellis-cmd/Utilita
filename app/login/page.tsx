"use client";

import { SignIn, SignUp, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import UtilitaLogo from "@/components/UtilitaLogo";
import {
  BRAND_BG,
  readPendingOnboarding,
  savePendingOnboarding,
} from "@/lib/onboarding";
import {
  TRADE_TYPES,
  TRADE_LABELS,
  TradeType,
  UserRole,
} from "@/lib/types";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useUser();

  const roleParam = searchParams.get("role") as UserRole | null;
  const mode = searchParams.get("mode");
  const isSignUp = mode === "sign-up";

  const [role, setRole] = useState<UserRole>(
    roleParam === "tradesperson" ? "tradesperson" : "customer"
  );
  const [tradeType, setTradeType] = useState<TradeType>("handyman");
  const [syncing, setSyncing] = useState(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    const pending = readPendingOnboarding();
    if (roleParam === "customer" || roleParam === "tradesperson") {
      setRole(roleParam);
    } else if (pending?.role) {
      setRole(pending.role);
      if (pending.tradeType) {
        setTradeType(pending.tradeType as TradeType);
      }
    }
  }, [roleParam]);

  useEffect(() => {
    savePendingOnboarding(
      role === "tradesperson" ? { role, tradeType } : { role }
    );
  }, [role, tradeType]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || syncing || syncedRef.current) return;

    async function completeSignIn() {
      syncedRef.current = true;
      setSyncing(true);
      const pending = readPendingOnboarding();
      const finalRole = pending?.role ?? role;
      const finalTrade =
        finalRole === "tradesperson"
          ? (pending?.tradeType as TradeType) ?? tradeType
          : null;

      const res = await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: finalRole,
          trade_type: finalTrade,
        }),
      });

      if (res.ok) {
        router.replace(finalRole === "customer" ? "/request" : "/dashboard");
      } else {
        setSyncing(false);
      }
    }

    completeSignIn();
  }, [isLoaded, isSignedIn, role, tradeType, router, syncing]);

  if (isLoaded && isSignedIn) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: BRAND_BG }}
      >
        <p className="text-white/70 text-sm">Setting up your account…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f6f6] flex flex-col">
      <div className="mx-auto w-full max-w-lg flex-1 flex flex-col px-5 pb-8">
        <header className="flex items-center justify-between pt-5 pb-6">
          <Link
            href="/role"
            className="text-sm font-medium text-gray-600 hover:text-black"
          >
            ← Back
          </Link>
          <div
            className="rounded-2xl p-2"
            style={{ backgroundColor: BRAND_BG }}
            aria-hidden
          >
            <UtilitaLogo size={32} />
          </div>
        </header>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">
            {isSignUp ? "Create account" : "Sign in"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {role === "customer"
              ? "You’re requesting tradespeople"
              : "You’re accepting work as a tradesperson"}
          </p>
        </div>

        {role === "tradesperson" && (
          <div className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-gray-100">
            <label
              htmlFor="trade"
              className="text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              Your trade
            </label>
            <select
              id="trade"
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value as TradeType)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base font-medium text-black"
            >
              {TRADE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TRADE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-center">
          {isSignUp ? (
            <SignUp
              forceRedirectUrl={`/login?role=${role}&mode=sign-up`}
              signInUrl={`/login?role=${role}`}
            />
          ) : (
            <SignIn
              forceRedirectUrl={`/login?role=${role}`}
              signUpUrl={`/login?role=${role}&mode=sign-up`}
            />
          )}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <Link
                href={`/login?role=${role}`}
                className="font-semibold text-black underline"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href={`/login?role=${role}&mode=sign-up`}
                className="font-semibold text-black underline"
              >
                Create account
              </Link>
            </>
          )}
        </p>

        <p className="mt-auto pt-8 text-center text-xs text-gray-400">
          Unregulated trades only · Simulated location · Not a real marketplace
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: BRAND_BG }}
        >
          <p className="text-white/70 text-sm">Loading…</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
