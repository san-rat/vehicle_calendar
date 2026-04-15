import type { ReactNode } from "react";
import { requireAdminAppUser } from "@/lib/auth/user";
import { AdminSidebar } from "@/components/AdminSidebar";
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
      <main className="app-container pb-12 pt-6 sm:pt-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-[6.5rem]">
              <AdminSidebar />
            </div>
          </aside>
          <div className="min-w-0">
            <RouteTransition>{children}</RouteTransition>
          </div>
        </div>
      </main>
    </div>
  );
}
