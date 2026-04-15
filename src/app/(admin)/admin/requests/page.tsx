import {
  Badge,
  BreadcrumbNav,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  warningInputClassName,
} from "@/components/ui";
import { CalendarIcon, EmptyStateIcon, LogIcon } from "@/components/ui/icons";
import {
  getVehicleTypeLabel,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { requireAdminAppUser } from "@/lib/auth/user";
import {
  getApprovalTimingProblem,
  getBusinessTimeMinutes,
  getConfirmedBookingConflicts,
  normalizeDbTime,
  type BookingTimeWindow,
} from "@/lib/booking/bookings";
import { getBusinessToday, parseIsoDate } from "@/lib/booking/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { approveBookingRequest, rejectBookingRequest } from "./actions";

type JoinedUser = {
  color_hex: string;
  is_active: boolean;
  name: string;
};

type JoinedVehicle = {
  is_active: boolean;
  name: string;
  type: VehicleType;
};

type RequestedBookingRecord = BookingTimeWindow & {
  booking_user: JoinedUser | JoinedUser[] | null;
  booking_vehicle: JoinedVehicle | JoinedVehicle[] | null;
  created_at: string;
  date: string;
  id: string;
  is_all_day: boolean;
  reason: string | null;
  user_id: string;
  vehicle_id: string;
};

type ConfirmedBookingRecord = BookingTimeWindow & {
  booking_user:
    | Pick<JoinedUser, "color_hex" | "name">
    | Pick<JoinedUser, "color_hex" | "name">[]
    | null;
  date: string;
  id: string;
  is_all_day: boolean;
  user_id: string;
  vehicle_id: string;
};

type RequestWithReviewState = RequestedBookingRecord & {
  approvalProblem: string | null;
  conflicts: ConfirmedBookingRecord[];
};

const userColorDotClasses: Record<string, string> = {
  "#10B981": "bg-[#10B981]",
  "#14B8A6": "bg-[#14B8A6]",
  "#3B82F6": "bg-[#3B82F6]",
  "#6366F1": "bg-[#6366F1]",
  "#EC4899": "bg-[#EC4899]",
  "#F97316": "bg-[#F97316]",
};

function getJoinedOne<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getDateLabel(date: string) {
  const parts = parseIsoDate(date);

  if (!parts) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)));
}

function getRequestedAtLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Colombo",
    year: "numeric",
  }).format(new Date(value));
}

function getTimeLabel(booking: BookingTimeWindow & { is_all_day: boolean }) {
  if (booking.is_all_day) {
    return "All day";
  }

  return `${normalizeDbTime(booking.start_time)} - ${normalizeDbTime(
    booking.end_time
  )}`;
}

function getUserColorDotClass(colorHex: string) {
  return userColorDotClasses[colorHex.toUpperCase()] ?? "bg-[var(--brand-500)]";
}

function compareRequests(
  first: RequestedBookingRecord,
  second: RequestedBookingRecord
) {
  const firstVehicle = getJoinedOne(first.booking_vehicle)?.name ?? "";
  const secondVehicle = getJoinedOne(second.booking_vehicle)?.name ?? "";

  return (
    first.date.localeCompare(second.date) ||
    normalizeDbTime(first.start_time).localeCompare(
      normalizeDbTime(second.start_time)
    ) ||
    firstVehicle.localeCompare(secondVehicle) ||
    first.created_at.localeCompare(second.created_at)
  );
}

async function getRequestReviewData() {
  await requireAdminAppUser();

  const supabase = createSupabaseAdminClient();
  const { data: requestRows, error: requestsError } = await supabase
    .from("bookings")
    .select(
      "id, user_id, vehicle_id, date, start_time, end_time, is_all_day, reason, created_at, booking_user:users!bookings_user_id_fkey(name, color_hex, is_active), booking_vehicle:vehicles!bookings_vehicle_id_fkey(name, type, is_active)"
    )
    .eq("status", "requested")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .order("created_at", { ascending: true });

  if (requestsError) {
    throw new Error("Unable to load booking requests.");
  }

  const requests = ((requestRows ?? []) as RequestedBookingRecord[]).sort(
    compareRequests
  );
  const vehicleIds = Array.from(
    new Set(requests.map((request) => request.vehicle_id))
  );
  const dates = Array.from(new Set(requests.map((request) => request.date)));
  let confirmedBookings: ConfirmedBookingRecord[] = [];

  if (vehicleIds.length > 0 && dates.length > 0) {
    const { data: confirmedRows, error: confirmedError } = await supabase
      .from("bookings")
      .select(
        "id, user_id, vehicle_id, date, start_time, end_time, is_all_day, booking_user:users!bookings_user_id_fkey(name, color_hex)"
      )
      .eq("status", "confirmed")
      .in("vehicle_id", vehicleIds)
      .in("date", dates);

    if (confirmedError) {
      throw new Error("Unable to load confirmed bookings for request review.");
    }

    confirmedBookings = (confirmedRows ?? []) as ConfirmedBookingRecord[];
  }

  const today = getBusinessToday();
  const currentTimeMinutes = getBusinessTimeMinutes();
  const requestsWithReviewState: RequestWithReviewState[] = requests.map(
    (request) => {
      const sameVehicleDateConfirmed = confirmedBookings.filter(
        (booking) =>
          booking.vehicle_id === request.vehicle_id && booking.date === request.date
      );

      return {
        ...request,
        approvalProblem: getApprovalTimingProblem({
          currentTimeMinutes,
          date: request.date,
          startTime: request.start_time,
          today,
        }),
        conflicts: getConfirmedBookingConflicts(
          request,
          sameVehicleDateConfirmed
        ),
      };
    }
  );

  return requestsWithReviewState;
}

function groupRequestsByDate(requests: RequestWithReviewState[]) {
  const groups = new Map<string, RequestWithReviewState[]>();

  for (const request of requests) {
    const current = groups.get(request.date) ?? [];
    current.push(request);
    groups.set(request.date, current);
  }

  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    items,
  }));
}

export default async function AdminRequestsPage() {
  const requests = await getRequestReviewData();
  const groupedRequests = groupRequestsByDate(requests);
  const blockedRequests = requests.filter((request) => request.approvalProblem).length;
  const conflictRequests = requests.filter(
    (request) => request.conflicts.length > 0
  ).length;
  const readyRequests = requests.filter(
    (request) => !request.approvalProblem && request.conflicts.length === 0
  ).length;

  return (
    <div className="page-stack">
      <BreadcrumbNav
        items={[
          { href: "/admin/settings", label: "Settings" },
          { label: "Requests" },
        ]}
      />
      <PageHeader
        action={<Badge tone="primary">Approval queue</Badge>}
        description="Review and resolve booking requests."
        eyebrow="Admin"
        title="Booking Requests"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={LogIcon}
          label="Pending"
          tone={requests.length > 0 ? "warning" : "success"}
          value={requests.length}
        />
        <StatCard
          icon={LogIcon}
          label="Ready"
          tone="success"
          value={readyRequests}
        />
        <StatCard
          icon={LogIcon}
          label="Conflicts"
          tone="warning"
          value={conflictRequests}
        />
        <StatCard
          icon={LogIcon}
          label="Blocked"
          tone="info"
          value={blockedRequests}
        />
      </section>

      {requests.length === 0 ? (
        <EmptyState
          action={
            <ButtonLink href="/admin/privileges" tone="secondary">
              Review privilege settings
            </ButtonLink>
          }
          description="No booking requests are waiting for review."
          icon={EmptyStateIcon}
          supportingCopy="New requests appear here."
          title="No pending requests"
        />
      ) : (
        <div className="space-y-6">
          {groupedRequests.map((group) => (
            <section className="space-y-4" key={group.date}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[1.25rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    {getDateLabel(group.date)}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                    {group.items.length} request{group.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge tone="neutral">{group.items.length} item{group.items.length === 1 ? "" : "s"}</Badge>
              </div>

              <div className="space-y-4">
                {group.items.map((request) => {
                  const member = getJoinedOne(request.booking_user);
                  const vehicle = getJoinedOne(request.booking_vehicle);
                  const isMemberInactive = member?.is_active === false;
                  const isVehicleInactive = vehicle?.is_active === false;
                  const approveBlockReason =
                    isMemberInactive
                      ? "This member is inactive."
                      : isVehicleInactive
                        ? "This vehicle is inactive."
                        : request.approvalProblem
                          ? request.approvalProblem
                          : request.conflicts.length > 0
                            ? "Override required because this request conflicts with confirmed bookings."
                            : null;
                  const canApprove = approveBlockReason === null;
                  const canOverride =
                    !isMemberInactive &&
                    !isVehicleInactive &&
                    !request.approvalProblem &&
                    request.conflicts.length > 0;

                  return (
                    <Panel as="article" className="p-5 sm:p-6" key={request.id} variant="elevated">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`h-3 w-3 rounded-full ${getUserColorDotClass(
                                member?.color_hex ?? "#3B82F6"
                              )}`}
                            />
                            <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                              {member?.name ?? "Unknown member"}
                            </h3>
                            <StatusBadge status="requested" />
                            {isMemberInactive ? <Badge tone="neutral">Member inactive</Badge> : null}
                            {isVehicleInactive ? <Badge tone="neutral">Vehicle inactive</Badge> : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                            Requested {getRequestedAtLabel(request.created_at)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {request.conflicts.length > 0 ? (
                            <Badge tone="warning">
                              {request.conflicts.length} conflict
                              {request.conflicts.length === 1 ? "" : "s"}
                            </Badge>
                          ) : (
                            <Badge tone="success">No conflict</Badge>
                          )}
                          {request.approvalProblem ? (
                            <Badge tone="danger">Approval blocked</Badge>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                            Vehicle
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                            {vehicle?.name ?? "Unknown vehicle"}
                          </p>
                          {vehicle ? (
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              {getVehicleTypeLabel(vehicle.type)}
                            </p>
                          ) : null}
                        </div>
                        <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                            Date and time
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                            {getDateLabel(request.date)}
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {getTimeLabel(request)}
                          </p>
                        </div>
                        <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                            Reason
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                            {request.reason ?? "No reason provided."}
                          </p>
                        </div>
                      </div>

                      {approveBlockReason ? (
                        <Notice className="mt-4" tone={request.approvalProblem ? "danger" : "warning"}>
                          {approveBlockReason}
                        </Notice>
                      ) : null}

                      {request.conflicts.length > 0 ? (
                        <div className="mt-4 rounded-[22px] border border-[var(--warning)]/26 bg-[var(--warning-soft)] px-4 py-4">
                          <p className="text-sm font-semibold text-[var(--warning)]">
                            Confirmed bookings overlap this request.
                          </p>
                          <div className="mt-3 space-y-2">
                            {request.conflicts.map((conflict) => {
                              const conflictUser = getJoinedOne(conflict.booking_user);

                              return (
                                <div
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] bg-white px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                                  key={conflict.id}
                                >
                                  <span className="font-medium text-[var(--text-primary)]">
                                    {conflictUser?.name ?? "Unknown member"}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge status="confirmed" />
                                    <span className="text-sm text-[var(--text-secondary)]">
                                      {getTimeLabel(conflict)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {canOverride ? (
                            <form
                              action={approveBookingRequest}
                              className="mt-4 space-y-3 border-t border-[var(--warning)]/30 pt-4"
                            >
                              <input name="id" type="hidden" value={request.id} />
                              <label className="flex gap-3 text-sm text-[var(--warning)]">
                                <input
                                  className="mt-1 h-4 w-4 rounded border-[var(--warning)]"
                                  name="override_confirmation"
                                  required
                                  type="checkbox"
                                  value="override"
                                />
                                <span>
                                  Approve and mark overlapping confirmed bookings
                                  as overridden.
                                </span>
                              </label>
                              <Field
                                description="Saved to the audit log."
                                htmlFor={`override-note-${request.id}`}
                                label="Override note"
                                optionalLabel="Optional"
                              >
                                <textarea
                                  className={warningInputClassName(
                                    "min-h-20 border-[var(--warning)]/35"
                                  )}
                                  id={`override-note-${request.id}`}
                                  maxLength={500}
                                  name="override_note"
                                  placeholder="Why override"
                                />
                              </Field>
                              <Button type="submit" tone="warning">
                                Approve with override
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-3 border-t border-[var(--border-subtle)] pt-4 xl:grid-cols-[1fr_auto] xl:items-center">
                        <div className="flex flex-wrap gap-2">
                          <ButtonLink
                            href={`/vehicles/${request.vehicle_id}/date/${request.date}`}
                            size="sm"
                            tone="neutral"
                          >
                            <CalendarIcon className="h-4 w-4" />
                            Open booking day
                          </ButtonLink>
                          <form action={approveBookingRequest}>
                            <input name="id" type="hidden" value={request.id} />
                            <Button
                              disabled={!canApprove}
                              size="sm"
                              tone="primary"
                              type="submit"
                            >
                              Approve
                            </Button>
                          </form>
                        </div>
                        <p className="text-sm leading-6 text-[var(--text-secondary)] xl:text-right">
                          {approveBlockReason ??
                            "Ready to approve."}
                        </p>
                      </div>

                      <form
                        action={rejectBookingRequest}
                        className="mt-4 grid gap-3 border-t border-[var(--border-subtle)] pt-4 md:grid-cols-[1fr_auto] md:items-end"
                      >
                        <input name="id" type="hidden" value={request.id} />
                        <Field
                          description="Saved to the audit log."
                          htmlFor={`rejection-reason-${request.id}`}
                          label="Rejection reason"
                          optionalLabel="Optional"
                        >
                          <textarea
                            className={warningInputClassName("min-h-20")}
                            id={`rejection-reason-${request.id}`}
                            maxLength={500}
                            name="rejection_reason"
                            placeholder="Why reject"
                          />
                        </Field>
                        <Button type="submit" tone="danger">
                          Reject
                        </Button>
                      </form>
                    </Panel>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
