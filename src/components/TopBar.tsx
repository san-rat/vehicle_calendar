import Link from "next/link";
import type { AppUser } from "@/lib/auth/user";

type TopBarProps = {
  currentUser: Pick<AppUser, "name" | "role">;
  showAdminActions?: boolean;
};

export function TopBar({
  currentUser,
  showAdminActions = false,
}: TopBarProps) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="app-container flex h-14 items-center justify-between">
        <Link
          href="/vehicles"
          className="text-lg font-semibold text-[var(--text)]"
        >
          FleetTime
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-[var(--muted)] sm:inline">
            {currentUser.name}
          </span>
          <Link
            href="/log"
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)]"
          >
            Log
          </Link>
          {showAdminActions ? (
            <Link
              href="/admin/settings"
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)]"
            >
              Settings
            </Link>
          ) : null}
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)]"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
