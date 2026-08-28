"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ReactNode } from "react";

interface RequestFlowHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
}

export default function RequestFlowHeader({
  title,
  subtitle,
  backHref,
  onBack,
  rightSlot,
}: RequestFlowHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-gray-100"
              aria-label="Go back"
            >
              ←
            </button>
          ) : backHref ? (
            <Link
              href={backHref}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-gray-100"
              aria-label="Go back"
            >
              ←
            </Link>
          ) : (
            <div className="w-9" />
          )}
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-black">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        {rightSlot ?? <UserButton afterSignOutUrl="/" />}
      </div>
    </header>
  );
}
