import Link from "next/link";
import { requireCurrentAppUser } from "@/lib/auth/user";
import {
  formatLogActionTime,
  getLogActionLabel,
  getLogColorDotClass,
  getLogPageNumber,
  getLogPaginationWindow,
  getLogRetentionCutoffIso,
  getLogTargetSummary,
  LOG_PAGE_SIZE,
  LOG_RETENTION_DAYS,
  type LogActionType,
} from "@/lib/logs/log-page";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type LogPageProps = {
  searchParams?: Promise<{ page?: string }>;
};

type JoinedUser = {
  color_hex: string;
  name: string;
};

type JoinedVehicle = {
  name: string;
};

type LogEntryRecord = {
  action_at: string;
  action_type: LogActionType;
  actor_user: JoinedUser | JoinedUser[] | null;
  booking_id: string | null;
  created_at: string;
  description: string;
  id: string;
  snapshot: unknown;
  target_user: JoinedUser | JoinedUser[] | null;
  target_user_id: string | null;
  target_vehicle: JoinedVehicle | JoinedVehicle[] | null;
  target_vehicle_id: string | null;
};

type LogPageData = {
  currentPage: number;
  entries: LogEntryRecord[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
};

function getJoinedOne<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getPageHref(page: number) {
  return page <= 1 ? "/log" : `/log?page=${page}`;
}

async function getLogPageData(pageParam: string | undefined): Promise<LogPageData> {
  await requireCurrentAppUser();

  const currentPage = getLogPageNumber(pageParam);
  const { from, to } = getLogPaginationWindow(currentPage);
  const supabase = createSupabaseAdminClient();
  const { count, data, error } = await supabase
    .from("log_entries")
    .select(
      "id, action_at, action_type, description, snapshot, booking_id, target_user_id, target_vehicle_id, created_at, actor_user:users!log_entries_actor_user_id_fkey(name, color_hex), target_user:users!log_entries_target_user_id_fkey(name, color_hex), target_vehicle:vehicles!log_entries_target_vehicle_id_fkey(name)",
      { count: "exact" }
    )
    .gte("created_at", getLogRetentionCutoffIso())
    .order("created_at", { ascending: false })
    .order("action_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error("Unable to load system log.");
  }

  const entries = (data ?? []) as LogEntryRecord[];
  const totalCount = count ?? entries.length;

  return {
    currentPage,
    entries,
    hasNextPage:
      typeof count === "number" ? to + 1 < count : entries.length === LOG_PAGE_SIZE,
    hasPreviousPage: currentPage > 1,
    totalCount,
  };
}

export default async function LogPage({ searchParams }: LogPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { currentPage, entries, hasNextPage, hasPreviousPage, totalCount } =
    await getLogPageData(resolvedSearchParams.page);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-[var(--primary)]">Log</p>
        <h1 className="mt-1 text-2xl font-semibold">System Log</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Recent FleetTime actions from the last {LOG_RETENTION_DAYS} days.
        </p>
      </header>

      <section className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)] md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase">Retention</p>
          <p className="mt-1 font-medium text-[var(--text)]">
            Last {LOG_RETENTION_DAYS} days
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase">Entries</p>
          <p className="mt-1 font-medium text-[var(--text)]">{totalCount}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase">Page</p>
          <p className="mt-1 font-medium text-[var(--text)]">{currentPage}</p>
        </div>
      </section>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
          No system actions were recorded in the current retention window.
        </p>
      ) : (
        <section className="space-y-4" aria-label="System log entries">
          {entries.map((entry) => {
            const actor = getJoinedOne(entry.actor_user);
            const targetUser = getJoinedOne(entry.target_user);
            const targetVehicle = getJoinedOne(entry.target_vehicle);
            const actorColorClass = getLogColorDotClass(actor?.color_hex);

            return (
              <article
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
                key={entry.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full border border-white shadow-sm ${actorColorClass}`}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                          {getLogActionLabel(entry.action_type)}
                        </span>
                        <span className="text-xs font-medium text-[var(--muted)]">
                          {formatLogActionTime(entry.action_at)}
                        </span>
                      </div>
                      <h2 className="mt-3 text-base font-semibold text-[var(--text)]">
                        {entry.description}
                      </h2>
                    </div>
                  </div>
                </div>

                <dl className="mt-5 grid gap-4 border-t border-[var(--border)] pt-4 text-sm md:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-[var(--muted)]">
                      Actor
                    </dt>
                    <dd className="mt-1 font-medium text-[var(--text)]">
                      {actor?.name ?? "Unknown actor"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-[var(--muted)]">
                      Target
                    </dt>
                    <dd className="mt-1 font-medium text-[var(--text)]">
                      {getLogTargetSummary({
                        actionType: entry.action_type,
                        bookingId: entry.booking_id,
                        snapshot: entry.snapshot,
                        targetUser,
                        targetUserId: entry.target_user_id,
                        targetVehicle,
                        targetVehicleId: entry.target_vehicle_id,
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-[var(--muted)]">
                      Recorded
                    </dt>
                    <dd className="mt-1 font-medium text-[var(--text)]">
                      {formatLogActionTime(entry.created_at)}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </section>
      )}

      <nav
        aria-label="Log pagination"
        className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-[var(--muted)]">
          Showing up to {LOG_PAGE_SIZE} entries per page.
        </p>
        <div className="flex gap-2">
          {hasPreviousPage ? (
            <Link
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]"
              href={getPageHref(currentPage - 1)}
            >
              Previous
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)] opacity-50"
            >
              Previous
            </span>
          )}

          {hasNextPage ? (
            <Link
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]"
              href={getPageHref(currentPage + 1)}
            >
              Next
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)] opacity-50"
            >
              Next
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}
