"use client";

import { UserButton } from "@clerk/nextjs";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface RequestFlowHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  showBack?: boolean;
}

export default function RequestFlowHeader({
  title,
  subtitle,
  backHref,
  onBack,
  rightSlot,
  showBack = true,
}: RequestFlowHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
    if (backHref) {
      router.push(backHref);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/request");
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 pt-safe-header">
      <div className="mx-auto flex max-w-lg items-center justify-between px-2 py-2">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {showBack ? (
            backHref && !onBack ? (
              <Link
                href={backHref}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
                aria-label="Go back"
              >
                <ChevronLeft className="h-6 w-6 text-black" strokeWidth={2} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
                aria-label="Go back"
              >
                <ChevronLeft className="h-6 w-6 text-black" strokeWidth={2} />
              </button>
            )
          ) : (
            <div className="w-11" />
          )}
          <div className="min-w-0 py-1">
            <h1 className="truncate font-heading text-base font-bold text-black">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="shrink-0 pl-2">{rightSlot ?? <UserButton afterSignOutUrl="/" />}</div>
      </div>
    </header>
  );
}
