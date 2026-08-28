"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RequestFlowHeader from "@/components/RequestFlowHeader";
import { SERVICE_TIER_LABELS, ServiceTier } from "@/lib/types";

export default function RequestConfirmedContent() {
  const params = useSearchParams();
  const tier = (params.get("tier") as ServiceTier) ?? "within_12h";
  const jobId = params.get("job");

  return (
    <main className="min-h-screen bg-[#f6f6f6]">
      <div className="mx-auto max-w-lg min-h-screen flex flex-col">
        <RequestFlowHeader title="Booking confirmed" backHref="/request" />

        <div className="flex-1 px-4 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl text-white">
            ✓
          </div>
          <h2 className="mt-6 text-2xl font-bold text-black">
            {SERVICE_TIER_LABELS[tier]} booked
          </h2>
          <p className="mt-2 text-gray-500">
            We&apos;ll match you with a tradesperson for your scheduled window.
            No live dispatch for this tier — check back for updates.
          </p>
          {jobId && (
            <p className="mt-4 text-xs font-mono text-gray-400">Ref: {jobId}</p>
          )}
          <Link
            href="/request"
            className="mt-8 inline-block rounded-xl bg-black px-8 py-3 font-semibold text-white"
          >
            Book another job
          </Link>
        </div>
      </div>
    </main>
  );
}
