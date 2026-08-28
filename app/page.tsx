"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import UtilitaLogo from "@/components/UtilitaLogo";
import { BRAND_BG } from "@/lib/onboarding";

export default function SplashPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const redirected = useRef(false);

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

    const timer = setTimeout(() => {
      redirected.current = true;
      router.replace("/role");
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, router]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: BRAND_BG }}
    >
      <div className="animate-logo-enter flex flex-col items-center">
        <div
          className="rounded-[22%] p-6 animate-logo-pulse"
          style={{ backgroundColor: BRAND_BG }}
        >
          <UtilitaLogo size={160} />
        </div>
      </div>
    </main>
  );
}
