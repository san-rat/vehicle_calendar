import type { ReactNode } from "react";
import { TopBar } from "@/components/TopBar";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="app-container py-8">{children}</main>
    </div>
  );
}
