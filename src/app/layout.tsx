import type { Metadata } from "next";
import { Suspense } from "react";
import { ToastViewport } from "@/components/ToastViewport";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetTime",
  description: "Premium vehicle scheduling, approvals, and fleet coordination.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Suspense fallback={null}>
          <ToastViewport />
        </Suspense>
      </body>
    </html>
  );
}
