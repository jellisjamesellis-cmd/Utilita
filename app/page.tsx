"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import RoleSelection from "@/components/RoleSelection";
import UtilitaLogo from "@/components/UtilitaLogo";
import { BRAND_BG } from "@/lib/onboarding";

const SPLASH_HOLD_MS = 1500;
const CROSSFADE_MS = 900;

export default function EntryPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const redirected = useRef(false);
  const [crossfading, setCrossfading] = useState(false);
  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    if (!isLoaded || redirected.current) return;

    if (isSignedIn) {
      redirected.current = true;
      fetch("/api/users/sync")
        .then((r) => r.json())
        .then((data) => {
          if (data.user?.role === "tradesperson") {
            router.replace("/dashboard");
          } else {
            router.replace("/request");
          }
        })
        .catch(() => router.replace("/request"));
      return;
    }

    const fadeTimer = setTimeout(() => {
      setCrossfading(true);
    }, SPLASH_HOLD_MS);

    const unmountTimer = setTimeout(() => {
      setSplashMounted(false);
    }, SPLASH_HOLD_MS + CROSSFADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="relative min-h-screen">
      {/* Role selection — fades in underneath */}
      <div
        className="min-h-screen transition-opacity ease-out"
        style={{
          opacity: crossfading ? 1 : 0,
          transitionDuration: `${CROSSFADE_MS}ms`,
        }}
        aria-hidden={!crossfading && splashMounted}
      >
        <RoleSelection />
      </div>

      {/* Splash overlay — fades out */}
      {splashMounted && (
        <div
          className="fixed inset-0 z-20 flex flex-col items-center justify-center transition-opacity ease-out"
          style={{
            backgroundColor: BRAND_BG,
            opacity: crossfading ? 0 : 1,
            transitionDuration: `${CROSSFADE_MS}ms`,
            pointerEvents: crossfading ? "none" : "auto",
          }}
        >
          <div className="animate-logo-enter flex flex-col items-center">
            <div
              className="rounded-[22%] p-6 animate-logo-pulse"
              style={{ backgroundColor: BRAND_BG }}
            >
              <UtilitaLogo size={160} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
