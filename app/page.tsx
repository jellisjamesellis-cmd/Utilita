"use client";

import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  TRADE_TYPES,
  TRADE_LABELS,
  TradeType,
  UserRole,
  User,
} from "@/lib/types";

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [tradeType, setTradeType] = useState<TradeType>("handyman");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    fetch("/api/users/sync")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setDbUser(data.user);
          if (data.user.role === "customer") router.push("/request");
          if (data.user.role === "tradesperson") router.push("/dashboard");
        }
      });
  }, [isLoaded, isSignedIn, router]);

  async function handleContinue() {
    if (!selectedRole) return;
    setLoading(true);

    const res = await fetch("/api/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: selectedRole,
        trade_type: selectedRole === "tradesperson" ? tradeType : null,
      }),
    });

    if (res.ok) {
      router.push(selectedRole === "customer" ? "/request" : "/dashboard");
    } else {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-brand-50">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm font-medium text-brand-700">Utilita</p>
          <h1 className="text-xl font-bold text-slate-900">Trade dispatch demo</h1>
        </div>
        {isSignedIn && <UserButton afterSignOutUrl="/" />}
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            On-demand trades, live
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Handyman, painter, mover, or cleaner — request help, watch a mock
            tradesperson head your way, and see surge pricing in real time. Demo
            only: no real GPS, vetting, or payments.
          </p>

          {!isLoaded ? (
            <p className="mt-8 text-slate-500">Loading…</p>
          ) : !isSignedIn ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <SignUpButton mode="modal">
                <button className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
                  Sign up
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                  Sign in
                </button>
              </SignInButton>
            </div>
          ) : dbUser ? (
            <p className="mt-8 text-slate-500">Redirecting…</p>
          ) : (
            <div className="mt-8 space-y-6">
              <p className="font-medium text-slate-900">
                How will you use Utilita?
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("customer")}
                  className={`rounded-xl border-2 p-6 text-left transition-colors ${
                    selectedRole === "customer"
                      ? "border-brand-600 bg-brand-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl">🛠️</span>
                  <h3 className="mt-2 font-semibold text-slate-900">
                    I need help
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Request a tradesperson and track them on the map.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("tradesperson")}
                  className={`rounded-xl border-2 p-6 text-left transition-colors ${
                    selectedRole === "tradesperson"
                      ? "border-brand-600 bg-brand-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl">🔧</span>
                  <h3 className="mt-2 font-semibold text-slate-900">
                    I&apos;m a tradesperson
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Go available and accept incoming jobs.
                  </p>
                </button>
              </div>

              {selectedRole === "tradesperson" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your trade
                  </label>
                  <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value as TradeType)}
                    className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    {TRADE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TRADE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRole && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleContinue}
                  className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? "Setting up…" : "Continue"}
                </button>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Unregulated trades only · Simulated location · Not a real marketplace
        </p>
      </section>
    </main>
  );
}
