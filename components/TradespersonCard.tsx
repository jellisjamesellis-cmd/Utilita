"use client";

import { avatarUrl } from "@/lib/avatar";
import { formatUberEta } from "@/lib/liveEta";
import { TradespersonProfile } from "@/lib/types";

interface TradespersonCardProps {
  tradesperson: TradespersonProfile;
  etaMinutes: number | null;
  status: string;
  searching?: boolean;
}

export default function TradespersonCard({
  tradesperson,
  etaMinutes,
  status,
  searching = false,
}: TradespersonCardProps) {
  const name = tradesperson.display_name ?? "Your tradesperson";
  const rating = tradesperson.rating ?? 4.8;
  const jobs = tradesperson.completed_jobs_count ?? 0;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-100">
      {searching ? (
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1">
            <p className="font-heading font-semibold text-black animate-pulse">
              Finding the best match…
            </p>
            <p className="text-sm text-gray-500 mt-0.5">Usually takes a few seconds</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl(name)}
            alt=""
            className="h-14 w-14 rounded-full object-cover ring-2 ring-gray-100"
          />
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold text-lg text-black truncate">{name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-amber-500">★ {rating.toFixed(1)}</span>
              <span>·</span>
              <span>{jobs} jobs</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{status}</p>
          </div>
          {etaMinutes != null && status !== "arrived" && status !== "completed" && (
            <div className="text-right shrink-0">
              <p className="font-heading text-3xl font-bold text-black leading-none">
                {formatUberEta(etaMinutes).replace(" min", "")}
              </p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {etaMinutes <= 0 ? "" : "min"}
              </p>
            </div>
          )}
          {status === "arrived" && (
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-green-600">Arrived</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
