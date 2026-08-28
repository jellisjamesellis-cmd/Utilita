"use client";

import { Job, TRADE_LABELS, STATUS_LABELS } from "@/lib/types";

interface JobCardProps {
  job: Job;
  showActions?: boolean;
  countdownSeconds?: number | null;
  onAccept?: (jobId: string) => void;
  onDecline?: (jobId: string) => void;
  loading?: boolean;
}

export default function JobCard({
  job,
  showActions = false,
  countdownSeconds,
  onAccept,
  onDecline,
  loading = false,
}: JobCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {TRADE_LABELS[job.trade_type]}
          </p>
          <h3 className="font-heading mt-1 font-semibold text-slate-900 line-clamp-2">
            {job.description}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <p className="font-heading text-lg font-bold text-slate-900">
            £{Number(job.price).toFixed(2)}
          </p>
          {job.surge_multiplier > 1.05 && (
            <p className="text-xs text-amber-600">
              {job.surge_multiplier.toFixed(1)}x surge
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5">
          {STATUS_LABELS[job.status]}
        </span>
        <span>
          📍 {job.lat.toFixed(4)}, {job.lng.toFixed(4)}
        </span>
      </div>

      {countdownSeconds != null && countdownSeconds > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Respond before timeout</span>
            <span className="font-mono font-semibold text-amber-600">
              {countdownSeconds}s
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-1000"
              style={{ width: `${(countdownSeconds / 30) * 100}%` }}
            />
          </div>
        </div>
      )}

      {showActions && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => onAccept?.(job.id)}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onDecline?.(job.id)}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Decline
          </button>
        </div>
      )}
    </article>
  );
}
