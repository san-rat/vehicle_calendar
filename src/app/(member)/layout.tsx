import type { ReactNode } from "react";
import { requireCurrentAppUser } from "@/lib/auth/user";
import { TopBar } from "@/components/TopBar";

export default async function MemberLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentUser = await requireCurrentAppUser();

  return (
    <div className="min-h-screen">
      <TopBar currentUser={currentUser} />
      <main className="app-container py-8">{children}</main>
    </div>
  );
}
