"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import JobCard from "@/components/JobCard";
import { useOpenJobsRealtime } from "@/lib/hooks";
import { Job, TRADE_LABELS, User } from "@/lib/types";

const COUNTDOWN_SECONDS = 30;

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [available, setAvailable] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetch("/api/users/sync")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, []);

  const { jobs, loading } = useOpenJobsRealtime(
    user?.trade_type ?? null,
    available
  );

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleAvailable = useCallback(async () => {
    const next = !available;
    setAvailable(next);
    await fetch("/api/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: next }),
    });
  }, [available]);

  async function handleAccept(jobId: string) {
    setActionLoading(jobId);
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    setActionLoading(null);
    if (res.ok) {
      setAvailable(false);
      await fetch("/api/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: false }),
      });
    }
  }

  async function handleDecline(jobId: string) {
    setActionLoading(jobId);
    await fetch(`/api/jobs/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline" }),
    });
    setActionLoading(null);
  }

  async function handleComplete(jobId: string) {
    setActionLoading(jobId);
    await fetch(`/api/jobs/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });
    setActionLoading(null);
  }

  const [activeJob, setActiveJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/jobs/active")
      .then((r) => (r.ok ? r.json() : { job: null }))
      .then((d) => setActiveJob(d.job));
  }, [user, actionLoading]);

  const countdownFor = useMemo(() => {
    return (job: Job) => {
      if (!job.expires_at) return null;
      const remaining = Math.ceil(
        (new Date(job.expires_at).getTime() - now) / 1000
      );
      return Math.max(0, remaining);
    };
  }, [now]);

  useEffect(() => {
    if (!available || jobs.length === 0) return;

    jobs.forEach((job) => {
      const remaining = countdownFor(job);
      if (remaining === 0 && job.expires_at && actionLoading !== job.id) {
        handleDecline(job.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, jobs, available]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-sm text-brand-600 hover:underline">
              ← Utilita
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
            {user?.trade_type && (
              <p className="text-sm text-slate-500">
                {TRADE_LABELS[user.trade_type]}
              </p>
            )}
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <p className="font-semibold text-slate-900">Available now</p>
            <p className="text-sm text-slate-500">
              {available
                ? "You’ll receive incoming job requests"
                : "Turn on to see open jobs"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAvailable}
            className={`relative h-8 w-14 rounded-full transition-colors ${
              available ? "bg-brand-600" : "bg-slate-200"
            }`}
            aria-pressed={available}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                available ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        {activeJob && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Active job
            </h2>
            <JobCard job={activeJob} />
            {(activeJob.status === "accepted" ||
              activeJob.status === "en_route") && (
              <button
                type="button"
                disabled={actionLoading === activeJob.id}
                onClick={() => handleComplete(activeJob.id)}
                className="mt-3 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Mark job complete
              </button>
            )}
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Incoming requests
          </h2>

          {!available ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Go available to see jobs matching your trade.
            </p>
          ) : loading ? (
            <p className="text-sm text-slate-500">Loading jobs…</p>
          ) : jobs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No open requests right now. Waiting for customers…
            </p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  showActions
                  countdownSeconds={countdownFor(job)}
                  loading={actionLoading === job.id}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
