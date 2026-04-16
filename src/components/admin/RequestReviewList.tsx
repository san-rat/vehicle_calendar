"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  Notice,
  Panel,
  StatusBadge,
  warningInputClassName,
} from "@/components/ui";
import { CalendarIcon, EmptyStateIcon } from "@/components/ui/icons";
import {
  getVehicleTypeLabel,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { normalizeDbTime, type BookingTimeWindow } from "@/lib/booking/bookings";
import { parseIsoDate } from "@/lib/booking/dates";

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

export type RequestWithReviewState = RequestedBookingRecord & {
  approvalProblem: string | null;
  conflicts: ConfirmedBookingRecord[];
};

type RequestReviewListProps = {
  approveBookingRequestAction: (formData: FormData) => void | Promise<void>;
  rejectBookingRequestAction: (formData: FormData) => void | Promise<void>;
  requests: RequestWithReviewState[];
};

type MobileRequestFilter = "blocked" | "conflicts" | "pending" | "ready";

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

export function RequestReviewList({
  approveBookingRequestAction,
  rejectBookingRequestAction,
  requests,
}: RequestReviewListProps) {
  const [activeFilter, setActiveFilter] = useState<MobileRequestFilter>("pending");

  const counts = useMemo(
    () => ({
      blocked: requests.filter((request) => request.approvalProblem).length,
      conflicts: requests.filter((request) => request.conflicts.length > 0).length,
      pending: requests.length,
      ready: requests.filter(
        (request) => !request.approvalProblem && request.conflicts.length === 0
      ).length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    switch (activeFilter) {
      case "blocked":
        return requests.filter((request) => request.approvalProblem);
      case "conflicts":
        return requests.filter((request) => request.conflicts.length > 0);
      case "ready":
        return requests.filter(
          (request) => !request.approvalProblem && request.conflicts.length === 0
        );
      case "pending":
      default:
        return requests;
    }
  }, [activeFilter, requests]);

  const groupedRequests = useMemo(
    () => groupRequestsByDate(filteredRequests),
    [filteredRequests]
  );

  const mobileFilters: Array<{
    count: number;
    id: MobileRequestFilter;
    label: string;
  }> = [
    { count: counts.pending, id: "pending", label: "Pending" },
    { count: counts.ready, id: "ready", label: "Ready" },
    { count: counts.conflicts, id: "conflicts", label: "Conflicts" },
    { count: counts.blocked, id: "blocked", label: "Blocked" },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="md:hidden">
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex gap-2 px-1">
            {mobileFilters.map((filter) => {
              const isActive = activeFilter === filter.id;

              return (
                <button
                  className={[
                    "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "border-[var(--brand-500)]/18 bg-[var(--brand-100)] text-[var(--brand-600)] shadow-[0_8px_18px_rgba(17,122,108,0.12)]"
                      : "border-[var(--border-subtle)] bg-white text-[var(--text-secondary)]",
                  ].join(" ")}
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  type="button"
                >
                  <span>{filter.label}</span>
                  <span
                    className={[
                      "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      isActive
                        ? "bg-white text-[var(--brand-600)]"
                        : "bg-[var(--bg-surface-tint)] text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {groupedRequests.length === 0 ? (
        <EmptyState
          description={`No ${activeFilter} requests are visible in the current queue.`}
          icon={EmptyStateIcon}
          title={`No ${activeFilter} requests`}
        />
      ) : (
        groupedRequests.map((group) => (
          <section className="space-y-3 md:space-y-4" key={group.date}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:text-[1.25rem]">
                  {getDateLabel(group.date)}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  {group.items.length} request{group.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <Badge tone="neutral">
                {group.items.length} item{group.items.length === 1 ? "" : "s"}
              </Badge>
            </div>

            <div className="space-y-3 md:space-y-4">
              {group.items.map((request) => {
                const member = getJoinedOne(request.booking_user);
                const vehicle = getJoinedOne(request.booking_vehicle);
                const isMemberInactive = member?.is_active === false;
                const isVehicleInactive = vehicle?.is_active === false;
                const approveBlockReason = isMemberInactive
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
                  <Panel
                    as="article"
                    className="p-4 md:p-6"
                    key={request.id}
                    variant="elevated"
                  >
                    <div className="flex flex-col gap-4 md:gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            className={`h-3 w-3 rounded-full ${getUserColorDotClass(
                              member?.color_hex ?? "#3B82F6"
                            )}`}
                          />
                          <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:text-xl">
                            {member?.name ?? "Unknown member"}
                          </h3>
                          <StatusBadge status="requested" />
                          {isMemberInactive ? (
                            <Badge tone="neutral">Member inactive</Badge>
                          ) : null}
                          {isVehicleInactive ? (
                            <Badge tone="neutral">Vehicle inactive</Badge>
                          ) : null}
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

                    <div className="mt-4 grid gap-2.5 md:hidden">
                      <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3.5 py-3">
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
                      <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3.5 py-3">
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
                    </div>

                    <div className="mt-5 hidden gap-3 md:grid md:grid-cols-3">
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
                      <Notice
                        className="mt-4"
                        tone={request.approvalProblem ? "danger" : "warning"}
                      >
                        {approveBlockReason}
                      </Notice>
                    ) : null}

                    {request.conflicts.length > 0 ? (
                      <div className="mt-4 rounded-[18px] border border-[var(--warning)]/26 bg-[var(--warning-soft)] px-3.5 py-3.5 md:rounded-[22px] md:px-4 md:py-4">
                        <p className="text-sm font-semibold text-[var(--warning)]">
                          Confirmed bookings overlap this request.
                        </p>
                        <div className="mt-3 space-y-2">
                          {request.conflicts.map((conflict) => {
                            const conflictUser = getJoinedOne(conflict.booking_user);

                            return (
                              <div
                                className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] bg-white px-3 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.06)] md:rounded-[18px] md:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
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
                            action={approveBookingRequestAction}
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
                                Approve and mark overlapping confirmed bookings as overridden.
                              </span>
                            </label>
                            <Field
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
                            <Button className="w-full md:w-auto" type="submit" tone="warning">
                              Approve with override
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-2.5 border-t border-[var(--border-subtle)] pt-4 xl:grid-cols-[1fr_auto] xl:items-center">
                      <div className="grid gap-2 sm:flex sm:flex-wrap">
                        <ButtonLink
                          className="w-full justify-center sm:w-auto"
                          href={`/vehicles/${request.vehicle_id}/date/${request.date}`}
                          size="sm"
                          tone="neutral"
                        >
                          <CalendarIcon className="h-4 w-4" />
                          Open booking day
                        </ButtonLink>
                        <form action={approveBookingRequestAction}>
                          <input name="id" type="hidden" value={request.id} />
                          <Button
                            className="w-full sm:w-auto"
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
                        {approveBlockReason ?? "Ready to approve."}
                      </p>
                    </div>

                    <div className="mt-4 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3.5 py-3 md:hidden">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        Reason
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                        {request.reason ?? "No reason provided."}
                      </p>
                    </div>

                    <form
                      action={rejectBookingRequestAction}
                      className="mt-4 grid gap-3 border-t border-[var(--border-subtle)] pt-4 md:grid-cols-[1fr_auto] md:items-end"
                    >
                      <input name="id" type="hidden" value={request.id} />
                      <Field
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
                      <Button className="w-full md:w-auto" type="submit" tone="danger">
                        Reject
                      </Button>
                    </form>
                  </Panel>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
