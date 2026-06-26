"use client";

import { RouteErrorState } from "@/components/RouteErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg-page)] px-4 py-10 text-[var(--text-primary)] antialiased sm:px-6 lg:px-8">
        <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center">
          <RouteErrorState
            description="FleetTime hit an application error. Retry once, and contact an admin if the problem repeats."
            error={error}
            reset={reset}
            title="FleetTime needs a retry"
          />
        </main>
      </body>
    </html>
  );
}
