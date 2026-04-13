import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  Panel,
  inputClassName,
} from "@/components/ui";
import { CalendarIcon, EmptyStateIcon } from "@/components/ui/icons";
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

type AdminRequestsPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

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
  booking_user: Pick<JoinedUser, "color_hex" | "name"> | Pick<JoinedUser, "color_hex" | "name">[] | null;
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
  return userColorDotClasses[colorHex.toUpperCase()] ?? "bg-[var(--primary)]";
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

export default async function AdminRequestsPage({
  searchParams,
}: AdminRequestsPageProps) {
  const requests = await getRequestReviewData();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusMessage =
    resolvedSearchParams.success ?? resolvedSearchParams.error ?? null;
  const statusTone = resolvedSearchParams.error ? "error" : "success";

  return (
    <div className="space-y-8">
      <PageHeader
        description="Review requested trips, spot conflicts, and keep inactive or past requests visible for a decision."
        eyebrow="Admin"
        title="Booking Requests"
      />

      {statusMessage ? (
        <Notice tone={statusTone === "error" ? "danger" : "success"}>
          {statusMessage}
        </Notice>
      ) : null}

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Pending Requests</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Requested trips do not block availability until approved.
            </p>
          </div>
          <Badge tone="neutral">
            {requests.length} total
          </Badge>
        </div>

        {requests.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              description="No booking requests are waiting for review."
              icon={<EmptyStateIcon className="h-6 w-6" />}
              title="No pending requests"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {requests.map((request) => {
              const member = getJoinedOne(request.booking_user);
              const vehicle = getJoinedOne(request.booking_vehicle);
              const isMemberInactive = member?.is_active === false;
              const isVehicleInactive = vehicle?.is_active === false;
              const approveBlockReason =
                isMemberInactive
                  ? "Approval is blocked because this member is inactive."
                  : isVehicleInactive
                    ? "Approval is blocked because this vehicle is inactive."
                    : request.approvalProblem
                      ? request.approvalProblem
                      : request.conflicts.length > 0
                        ? "Approval needs override review because this request conflicts with confirmed bookings."
                        : null;
              const canApprove = approveBlockReason === null;
              const canOverride =
                !isMemberInactive &&
                !isVehicleInactive &&
                !request.approvalProblem &&
                request.conflicts.length > 0;

              return (
                <Panel as="article" key={request.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full ${getUserColorDotClass(
                            member?.color_hex ?? "#3B82F6"
                          )}`}
                        />
                        <h3 className="text-lg font-semibold">
                          {member?.name ?? "Unknown member"}
                        </h3>
                        {isMemberInactive ? (
                          <Badge tone="neutral">
                            Member inactive
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        Requested at {getRequestedAtLabel(request.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {request.conflicts.length > 0 ? (
                        <Badge tone="warning">
                          {request.conflicts.length} conflict
                          {request.conflicts.length === 1 ? "" : "s"}
                        </Badge>
                      ) : (
                        <Badge tone="success">
                          No conflict
                        </Badge>
                      )}
                      {request.approvalProblem ? (
                        <Badge tone="danger">
                          Approval blocked
                        </Badge>
                      ) : null}
                      {isVehicleInactive ? (
                        <Badge tone="neutral">
                          Vehicle inactive
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                        Vehicle
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {vehicle?.name ?? "Unknown vehicle"}
                      </p>
                      {vehicle ? (
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {getVehicleTypeLabel(vehicle.type)}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                        Date
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {getDateLabel(request.date)}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {getTimeLabel(request)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                        Reason
                      </p>
                      <p className="mt-1 text-sm text-[var(--text)]">
                        {request.reason ?? "No reason provided."}
                      </p>
                    </div>
                  </div>

                  {request.approvalProblem ? (
                    <Notice className="mt-4" tone="danger">
                      {request.approvalProblem}
                    </Notice>
                  ) : null}

                  {request.conflicts.length > 0 ? (
                    <div className="mt-4 rounded-md border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--warning-text)]">
                        Confirmed bookings overlap this request.
                      </p>
                      <div className="mt-3 space-y-2">
                        {request.conflicts.map((conflict) => {
                          const conflictUser = getJoinedOne(conflict.booking_user);

                          return (
                            <div
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm"
                              key={conflict.id}
                            >
                              <span className="font-medium text-[var(--text)]">
                                {conflictUser?.name ?? "Unknown member"}
                              </span>
                              <span className="text-[var(--muted)]">
                                {getTimeLabel(conflict)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {canOverride ? (
                        <form
                          action={approveBookingRequest}
                          className="mt-4 space-y-3 border-t border-[var(--warning)]/40 pt-4"
                        >
                          <input name="id" type="hidden" value={request.id} />
                          <label className="flex gap-3 text-sm text-[var(--warning-text)]">
                            <input
                              className="mt-1 h-4 w-4 rounded border-[var(--warning)]"
                              name="override_confirmation"
                              required
                              type="checkbox"
                              value="override"
                            />
                            <span>
                              Approve this request and mark every overlapping
                              confirmed booking as overridden.
                            </span>
                          </label>
                          <Field
                            htmlFor={`override-note-${request.id}`}
                            label="Optional override note"
                          >
                            <textarea
                              className={inputClassName(
                                "min-h-20 border-[var(--warning)]/50 focus:border-[var(--warning)]"
                              )}
                              id={`override-note-${request.id}`}
                              maxLength={500}
                              name="override_note"
                              placeholder="Note stored in audit log only"
                            />
                          </Field>
                          <Button type="submit" tone="warning">
                            Approve with override
                          </Button>
                        </form>
                      ) : (
                        <p className="mt-4 border-t border-[var(--warning)]/40 pt-4 text-sm text-[var(--warning-text)]">
                          Override approval is unavailable until the request is
                          active and has not already started.
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-4 border-t border-[var(--border)] pt-4">
                    <ButtonLink
                      href={`/vehicles/${request.vehicle_id}/date/${request.date}`}
                      size="sm"
                      tone="neutral"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      Open booking day
                    </ButtonLink>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-[auto_1fr] md:items-center">
                    <form action={approveBookingRequest}>
                      <input name="id" type="hidden" value={request.id} />
                      <Button
                        disabled={!canApprove}
                        tone="primary"
                        type="submit"
                      >
                        Approve
                      </Button>
                    </form>
                    <p className="text-sm text-[var(--muted)]">
                      {approveBlockReason ??
                        "No conflicts found. This request can be approved."}
                    </p>
                  </div>

                  <form
                    action={rejectBookingRequest}
                    className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-[1fr_auto] md:items-end"
                  >
                    <input name="id" type="hidden" value={request.id} />
                    <Field
                      htmlFor={`rejection-reason-${request.id}`}
                      label="Optional rejection reason"
                    >
                      <textarea
                        className={inputClassName("min-h-20")}
                        id={`rejection-reason-${request.id}`}
                        maxLength={500}
                        name="rejection_reason"
                        placeholder="Reason shown in audit log only"
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
        )}
      </section>
    </div>
  );
}
