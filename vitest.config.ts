import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "src/test/server-only.ts"),
    },
  },
  test: {
    coverage: {
      exclude: [
        ".next/**",
        "next-env.d.ts",
        "next.config.ts",
        "src/app/favicon.ico",
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
      ],
      include: [
        "src/lib/admin/*.ts",
        "src/lib/booking/*.ts",
        "src/lib/logs/*.ts",
        "src/lib/auth/user.ts",
        "src/app/(admin)/admin/privileges/actions.ts",
        "src/app/(admin)/admin/requests/actions.ts",
        "src/app/(admin)/admin/vehicles/actions.ts",
        "src/app/(member)/vehicles/[vehicleId]/date/[date]/actions.ts",
        "src/app/(public)/login/actions.ts",
        "src/components/BookingWorkspace.tsx",
        "src/components/CalendarWorkspace.tsx",
        "src/components/LoginForm.tsx",
        "src/components/ToastViewport.tsx",
        "src/components/admin/*.tsx",
      ],
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    environment: "jsdom",
    globals: true,
    pool: "vmThreads",
    setupFiles: ["./src/test/setup.ts"],
  },
});
