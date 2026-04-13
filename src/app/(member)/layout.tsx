import type { ReactNode } from "react";
import { requireCurrentAppUser } from "@/lib/auth/user";
import { RouteTransition } from "@/components/RouteTransition";
import { TopBar } from "@/components/TopBar";

export default async function MemberLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentUser = await requireCurrentAppUser();

  return (
    <div className="min-h-screen">
      <TopBar
        currentUser={currentUser}
        showAdminActions={currentUser.role === "super_admin"}
      />
      <main className="app-container pb-10 pt-6 sm:pt-8">
        <RouteTransition>{children}</RouteTransition>
      </main>
    </div>
  );
}
