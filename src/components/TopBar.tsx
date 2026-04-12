import Link from "next/link";
import type { AppUser } from "@/lib/auth/user";
import { Button } from "@/components/ui";
import {
  FleetIcon,
  LogIcon,
  LogoutIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/icons";

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
      <div className="app-container flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/vehicles"
          className="inline-flex min-h-11 items-center gap-2 rounded-md text-lg font-semibold text-[var(--text)] transition hover:text-[var(--primary)]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
            <FleetIcon className="h-5 w-5" />
          </span>
          FleetTime
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--muted)]">
            <UserIcon className="h-4 w-4" />
            <span className="max-w-36 truncate sm:max-w-48">
              {currentUser.name}
            </span>
          </span>
          <Link
            href="/log"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <LogIcon className="h-4 w-4" />
            Log
          </Link>
          {showAdminActions ? (
            <Link
              href="/admin/settings"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Link>
          ) : null}
          <form action="/auth/logout" method="post">
            <Button
              size="sm"
              tone="secondary"
              type="submit"
              className="bg-white"
            >
              <LogoutIcon className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
