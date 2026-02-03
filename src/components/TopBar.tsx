import Link from "next/link";

type TopBarProps = {
  showAdminActions?: boolean;
};

export function TopBar({ showAdminActions = false }: TopBarProps) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="app-container flex h-14 items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-[var(--text)]">
          FleetTime
        </Link>
        <div className="flex items-center gap-2">
          {showAdminActions ? (
            <button
              type="button"
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)]"
            >
              Settings
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)]"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
