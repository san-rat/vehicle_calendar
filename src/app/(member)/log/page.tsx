import {
  Badge,
  ButtonLink,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  buttonClassName,
  inputClassName,
} from "@/components/ui";
import { RouteTransition } from "@/components/RouteTransition";
import { ClockIcon, LogIcon, SearchIcon } from "@/components/ui/icons";
import { requireCurrentAppUser } from "@/lib/auth/user";
import {
  formatLogActionTime,
  formatRelativeLogTime,
  getLogActionLabel,
  getLogActionTone,
  getLogBookingStatus,
  getLogColorDotClass,
  getLogPageNumber,
  getLogPaginationWindow,
  getLogRetentionCutoffIso,
  getLogSearchPattern,
  LOG_PAGE_SIZE,
  LOG_RETENTION_DAYS,
  normalizeLogQuery,
  type LogActionType,
} from "@/lib/logs/log-page";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type LogPageProps = {
  searchParams?: Promise<{ page?: string; q?: string }>;
};

type JoinedUser = {
  color_hex: string;
  name: string;
};

type LogEntryRecord = {
  action_at: string;
  action_type: LogActionType;
  actor_user: JoinedUser | JoinedUser[] | null;
  description: string;
  id: string;
};

type LogPageData = {
  currentPage: number;
  entries: LogEntryRecord[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  query: string;
  totalCount: number;
};

function getJoinedOne<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getPageHref(page: number, query: string) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (query) {
    params.set("q", query);
  }

  const search = params.toString();

  return search ? `/log?${search}` : "/log";
}

async function getLogPageData(
  pageParam: string | undefined,
  queryParam: string | undefined
): Promise<LogPageData> {
  await requireCurrentAppUser();

  const currentPage = getLogPageNumber(pageParam);
  const query = normalizeLogQuery(queryParam);
  const searchPattern = getLogSearchPattern(query);
  const { from, to } = getLogPaginationWindow(currentPage);
  const supabase = createSupabaseAdminClient();
  let request = supabase
    .from("log_entries")
    .select(
      "id, action_at, action_type, description, actor_user:users!log_entries_actor_user_id_fkey(name, color_hex)",
      { count: "exact" }
    )
    .gte("created_at", getLogRetentionCutoffIso());

  if (searchPattern) {
    request = request.ilike("description", searchPattern);
  }

  const { count, data, error } = await request
    .order("created_at", { ascending: false })
    .order("action_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[getLogPageData] Supabase Error:", error);
    throw new Error("Unable to load system log. " + error.message);
  }

  const entries = (data ?? []) as LogEntryRecord[];
  const totalCount = count ?? entries.length;

  return {
    currentPage,
    entries,
    hasNextPage:
      typeof count === "number" ? to + 1 < count : entries.length === LOG_PAGE_SIZE,
    hasPreviousPage: currentPage > 1,
    query,
    totalCount,
  };
}

export default async function LogPage({ searchParams }: LogPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const {
    currentPage,
    entries,
    hasNextPage,
    hasPreviousPage,
    query,
    totalCount,
  } = await getLogPageData(resolvedSearchParams.page, resolvedSearchParams.q);
  const emptyDescription = query
    ? `No system actions matched "${query}" in the last ${LOG_RETENTION_DAYS} days.`
    : "No system actions were recorded in the current retention window.";

  return (
    <RouteTransition transitionKey={`log-page-${currentPage}-${query || "all"}`}>
      <div className="space-y-6 sm:space-y-8">
        <PageHeader eyebrow="Log" title="System Log" />

        <Panel className="sticky top-20 z-20 border-white/75 bg-[var(--bg)]/90 p-4 backdrop-blur-xl">
          <form
            action="/log"
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end"
            method="get"
          >
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[var(--text)]"
                htmlFor="log-search"
              >
                Search log
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  className={inputClassName("pl-11")}
                  defaultValue={query}
                  id="log-search"
                  name="q"
                  placeholder="Search descriptions or action types"
                  type="search"
                />
              </div>
            </div>

            <button
              className={buttonClassName({
                className: "w-full md:w-auto",
                tone: "primary",
              })}
              type="submit"
            >
              Apply filter
            </button>

            {query ? (
              <ButtonLink className="w-full md:w-auto" href="/log" tone="ghost">
                Clear
              </ButtonLink>
            ) : null}
          </form>
        </Panel>

        {entries.length === 0 ? (
          <EmptyState
            description={emptyDescription}
            icon={LogIcon}
            title="No log entries"
          />
        ) : (
          <section aria-label="System log entries" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--muted)]">
                Last {LOG_RETENTION_DAYS} days
              </p>
              <Badge tone="neutral">{totalCount} total</Badge>
            </div>

            <div className="space-y-3">
              {entries.map((entry) => {
                const actor = getJoinedOne(entry.actor_user);
                const actorColorClass = getLogColorDotClass(actor?.color_hex);
                const bookingStatus = getLogBookingStatus(entry.action_type);

                return (
                  <Panel as="article" className="p-4 sm:p-5" key={entry.id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex gap-3">
                        <span
                          aria-hidden="true"
                          className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${actorColorClass}`}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--text)]">
                              {actor?.name ?? "Unknown actor"}
                            </p>
                            {bookingStatus ? (
                              <StatusBadge status={bookingStatus} />
                            ) : (
                              <Badge tone={getLogActionTone(entry.action_type)}>
                                {getLogActionLabel(entry.action_type)}
                              </Badge>
                            )}
                          </div>

                          <p className="mt-2 text-sm font-medium text-[var(--text)] sm:text-[15px]">
                            {entry.description}
                          </p>
                        </div>
                      </div>

                      <Badge className="shrink-0 self-start" tone="neutral">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {formatRelativeLogTime(entry.action_at)}
                      </Badge>
                    </div>

                    <div className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
                      {formatLogActionTime(entry.action_at)}
                    </div>
                  </Panel>
                );
              })}
            </div>
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
              <ButtonLink
                href={getPageHref(currentPage - 1, query)}
                size="sm"
                tone="secondary"
              >
                Previous
              </ButtonLink>
            ) : (
              <span
                aria-disabled="true"
                className={buttonClassName({
                  className: "pointer-events-none opacity-50",
                  size: "sm",
                  tone: "neutral",
                })}
              >
                Previous
              </span>
            )}

            {hasNextPage ? (
              <ButtonLink
                href={getPageHref(currentPage + 1, query)}
                size="sm"
                tone="secondary"
              >
                Next
              </ButtonLink>
            ) : (
              <span
                aria-disabled="true"
                className={buttonClassName({
                  className: "pointer-events-none opacity-50",
                  size: "sm",
                  tone: "neutral",
                })}
              >
                Next
              </span>
            )}
          </div>
        </nav>
      </div>
    </RouteTransition>
  );
}
