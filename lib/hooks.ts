"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Job } from "@/lib/types";

export function useJobRealtime(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    async function fetchJob() {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setJob(data.job);
      }
      if (!cancelled) setLoading(false);
    }

    fetchJob();

    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          setJob(payload.new as Job);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { job, loading, setJob };
}

export function useOpenJobsRealtime(tradeType: string | null, enabled: boolean) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tradeType || !enabled) {
      setJobs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchJobs() {
      const res = await fetch("/api/availability");
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setJobs(data.jobs ?? []);
      }
      if (!cancelled) setLoading(false);
    }

    fetchJobs();

    const channel = supabase
      .channel(`open-jobs-${tradeType}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    const poll = setInterval(fetchJobs, 5000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [tradeType, enabled]);

  return { jobs, loading, refetch: () => {} };
}
