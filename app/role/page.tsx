"use client";

import { useRouter } from "next/navigation";
import { savePendingOnboarding } from "@/lib/onboarding";
import UtilitaLogo from "@/components/UtilitaLogo";
import { BRAND_BG } from "@/lib/onboarding";

export default function RoleSelectionPage() {
  const router = useRouter();

  function chooseRole(role: "customer" | "tradesperson") {
    savePendingOnboarding({ role });
    router.push(`/login?role=${role}`);
  }

  return (
    <main className="min-h-screen bg-[#f6f6f6] flex flex-col">
      <div className="mx-auto w-full max-w-lg flex-1 flex flex-col px-5 pb-6">
        <header className="flex justify-end pt-5 pb-8">
          <div
            className="rounded-2xl p-2.5"
            style={{ backgroundColor: BRAND_BG }}
            aria-hidden
          >
            <UtilitaLogo size={36} />
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-center gap-4 py-4">
          <button
            type="button"
            onClick={() => chooseRole("customer")}
            className="w-full rounded-2xl bg-black px-6 py-6 text-left hover:bg-gray-900 active:scale-[0.99] transition-all"
          >
            <span className="block text-xl font-bold text-white">
              Want a trade?
            </span>
            <span className="mt-1.5 block text-sm text-white/70">
              Request a tradesperson and track them live
            </span>
          </button>

          <button
            type="button"
            onClick={() => chooseRole("tradesperson")}
            className="w-full rounded-2xl bg-black px-6 py-6 text-left hover:bg-gray-900 active:scale-[0.99] transition-all"
          >
            <span className="block text-xl font-bold text-white">
              Want a job?
            </span>
            <span className="mt-1.5 block text-sm text-white/70">
              Go available and start accepting work
            </span>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pt-4">
          Unregulated trades only · Simulated location · Not a real marketplace
        </p>
      </div>
    </main>
  );
}
