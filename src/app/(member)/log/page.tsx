import {
  Badge,
  ButtonLink,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  buttonClassName,
} from "@/components/ui";
import { ClipboardText } from "@/components/ClipboardText";
import { RouteTransition } from "@/components/RouteTransition";
import { CalendarIcon, ClockIcon, LogIcon } from "@/components/ui/icons";
import { requireCurrentAppUser } from "@/lib/auth/user";
import {
  formatLogActionTime,
  formatLogSnapshotJson,
  getLogActionLabel,
  getLogBookingStatus,
  getLogActionTone,
  getLogBookingDayHref,
  getLogColorDotClass,
  getLogPageNumber,
  getLogPaginationWindow,
  getLogRetentionCutoffIso,
  getLogSnapshotHighlights,
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
    <RouteTransition transitionKey={`log-page-${currentPage}`}>
      <div className="space-y-8">
        <PageHeader
          description={`Recent FleetTime actions from the last ${LOG_RETENTION_DAYS} days.`}
          eyebrow="Log"
          title="System Log"
        />

        <Panel className="grid gap-3 p-4 text-sm text-[var(--muted)] md:grid-cols-3">
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
        </Panel>

        {entries.length === 0 ? (
          <EmptyState
            description="No system actions were recorded in the current retention window."
            icon={LogIcon}
            title="No log entries"
          />
        ) : (
          <section className="space-y-4" aria-label="System log entries">
            {entries.map((entry) => {
              const actor = getJoinedOne(entry.actor_user);
              const targetUser = getJoinedOne(entry.target_user);
              const targetVehicle = getJoinedOne(entry.target_vehicle);
              const actorColorClass = getLogColorDotClass(actor?.color_hex);
              const bookingDayHref = getLogBookingDayHref({
                actionType: entry.action_type,
                snapshot: entry.snapshot,
                targetVehicleId: entry.target_vehicle_id,
              });
              const snapshotHighlights = getLogSnapshotHighlights(entry.snapshot);
              const snapshotJson = formatLogSnapshotJson(entry.snapshot);
              const bookingStatus = getLogBookingStatus(entry.action_type);

              return (
                <Panel as="article" key={entry.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white text-white shadow-sm ${actorColorClass}`}
                      >
                        <LogIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {bookingStatus ? (
                            <StatusBadge status={bookingStatus} />
                          ) : (
                            <Badge tone={getLogActionTone(entry.action_type)}>
                              {getLogActionLabel(entry.action_type)}
                            </Badge>
                          )}
                          <Badge tone="neutral">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {formatLogActionTime(entry.action_at)}
                          </Badge>
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
                      {bookingDayHref ? (
                        <dd className="mt-2">
                          <ButtonLink
                            href={bookingDayHref}
                            size="sm"
                            tone="neutral"
                          >
                            <CalendarIcon className="h-4 w-4" />
                            Open booking day
                          </ButtonLink>
                        </dd>
                      ) : null}
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

                  <details className="mt-5 border-t border-[var(--border)] pt-4">
                    <summary className="min-h-11 cursor-pointer rounded-md py-2 text-sm font-semibold text-[var(--primary)] transition hover:text-[var(--primary-hover)]">
                      View details
                    </summary>
                    <div className="mt-4 space-y-4">
                      <section>
                        <h3 className="text-sm font-semibold text-[var(--text)]">
                          Readable snapshot
                        </h3>
                        {snapshotHighlights.length === 0 ? (
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            No readable snapshot highlights are available.
                          </p>
                        ) : (
                          <dl className="mt-3 grid gap-3 md:grid-cols-2">
                            {snapshotHighlights.map((highlight) => (
                              <div
                                className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3"
                                key={`${entry.id}-${highlight.label}`}
                              >
                                <dt className="text-xs font-semibold uppercase text-[var(--muted)]">
                                  {highlight.label}
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                                  <ClipboardText
                                    ariaLabel={`Copy ${highlight.label}`}
                                    className="-mx-1.5 max-w-full text-[var(--text)]"
                                    text={highlight.copyValue}
                                  >
                                    <span className="block max-w-full break-words">
                                      {highlight.value}
                                    </span>
                                  </ClipboardText>
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </section>

                      <section>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-[var(--text)]">
                            Snapshot JSON
                          </h3>
                          <ClipboardText
                            ariaLabel="Copy snapshot JSON"
                            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--primary)] [@media(hover:hover)]:hover:border-[var(--primary)] [@media(hover:hover)]:hover:bg-[var(--primary)]/5"
                            text={snapshotJson}
                          >
                            <span>Copy JSON</span>
                          </ClipboardText>
                        </div>
                        <pre className="mt-3 max-h-96 overflow-auto rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-xs leading-5 text-[var(--text)]">
                          <code>{snapshotJson}</code>
                        </pre>
                      </section>
                    </div>
                  </details>
                </Panel>
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
              <ButtonLink
                href={getPageHref(currentPage - 1)}
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
                href={getPageHref(currentPage + 1)}
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
