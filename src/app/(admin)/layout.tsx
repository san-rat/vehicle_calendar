import type { ReactNode } from "react";
import { requireAdminAppUser } from "@/lib/auth/user";
import { RouteTransition } from "@/components/RouteTransition";
import { TopBar } from "@/components/TopBar";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentUser = await requireAdminAppUser();

  return (
    <div className="min-h-screen">
      <TopBar currentUser={currentUser} showAdminActions />
      <main className="app-container pb-10 pt-6 sm:pt-8">
        <RouteTransition>{children}</RouteTransition>
      </main>
    </div>
  );
}
