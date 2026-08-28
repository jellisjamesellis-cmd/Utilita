import { Suspense } from "react";
import RequestConfirmedContent from "./RequestConfirmedContent";

export default function RequestConfirmedPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f6f6] flex items-center justify-center">
          <p className="text-gray-500">Loading…</p>
        </main>
      }
    >
      <RequestConfirmedContent />
    </Suspense>
  );
}
