"use client";

import { useMemo, useState } from "react";
import { Badge, ButtonLink, Panel } from "@/components/ui";

export type CalendarBookingSummary = {
  colorHex: string;
  date: string;
  endTime: string;
  id: string;
  isAllDay: boolean;
  startTime: string;
  status: "confirmed" | "requested";
  userName: string;
};

export type CalendarDaySummary = {
  bookings: CalendarBookingSummary[];
  date: string;
  isBookable: boolean;
  isToday: boolean;
};

type CalendarWorkspaceProps = {
  days: CalendarDaySummary[];
  firstWeekday: number;
  monthLabel: string;
  nextMonthHref: string;
  prevMonthHref: string;
  vehicleId: string;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const userColorDotClasses: Record<string, string> = {
  "#10B981": "bg-[#10B981]",
  "#14B8A6": "bg-[#14B8A6]",
  "#3B82F6": "bg-[#3B82F6]",
  "#6366F1": "bg-[#6366F1]",
  "#EC4899": "bg-[#EC4899]",
  "#F97316": "bg-[#F97316]",
};

function getUserColorDotClass(colorHex: string) {
  return userColorDotClasses[colorHex.toUpperCase()] ?? "bg-[var(--brand-500)]";
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00Z`);

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function formatShortDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00Z`);

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function getBookingTimeLabel(booking: CalendarBookingSummary) {
  if (booking.isAllDay) {
    return "All day";
  }

  return `${booking.startTime.slice(0, 5)} - ${booking.endTime.slice(0, 5)}`;
}

function sortBookings(
  first: CalendarBookingSummary,
  second: CalendarBookingSummary
) {
  if (first.isAllDay !== second.isAllDay) {
    return first.isAllDay ? -1 : 1;
  }

  return (
    first.startTime.localeCompare(second.startTime) ||
    first.endTime.localeCompare(second.endTime) ||
    first.userName.localeCompare(second.userName)
  );
}

export function CalendarWorkspace({
  days,
  firstWeekday,
  monthLabel,
  nextMonthHref,
  prevMonthHref,
  vehicleId,
}: CalendarWorkspaceProps) {
  const defaultSelectedDate =
    days.find((day) => day.isToday && day.isBookable)?.date ??
    days.find((day) => day.isBookable)?.date ??
    days[0]?.date ??
    "";
  const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);
  const selectedDay =
    days.find((day) => day.date === selectedDate) ?? days[0] ?? null;
  const selectedBookings = useMemo(
    () => [...(selectedDay?.bookings ?? [])].sort(sortBookings),
    [selectedDay]
  );
  const confirmedCount = selectedBookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;
  const requestedCount = selectedBookings.filter(
    (booking) => booking.status === "requested"
  ).length;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Panel className="overflow-hidden p-4 md:p-5" variant="elevated">
        <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)] md:text-[1.55rem]">
              {monthLabel}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Select a day to review availability.
            </p>
          </div>
          <div className="flex gap-2">
            <ButtonLink href={prevMonthHref} size="sm" tone="secondary">
              Previous
            </ButtonLink>
            <ButtonLink href={nextMonthHref} size="sm" tone="secondary">
              Next
            </ButtonLink>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="success">Confirmed occupancy</Badge>
          <Badge tone="warning">Pending requests</Badge>
          <Badge tone="primary">Today</Badge>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekdayLabels.map((label) => (
            <div
              className="py-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] sm:text-[11px]"
              key={label}
            >
              {label}
            </div>
          ))}

          {Array.from({ length: firstWeekday }, (_, index) => (
            <div aria-hidden="true" key={`blank-${index}`} />
          ))}

          {days.map((day) => {
            const dayNumber = Number(day.date.slice(-2));
            const isSelected = day.date === selectedDate;
            const confirmedBookings = day.bookings.filter(
              (booking) => booking.status === "confirmed"
            );
            const requestedBookings = day.bookings.filter(
              (booking) => booking.status === "requested"
            );
            const visibleConfirmed = confirmedBookings.slice(0, 3);
            const totalSignals = day.bookings.length;
            const cellClass = [
              "flex min-h-[72px] flex-col rounded-[16px] border px-2 py-2 text-left transition-all duration-200 sm:min-h-[116px] sm:rounded-[18px] sm:px-3 sm:py-3",
              day.isBookable
                ? "bg-white shadow-[0_8px_18px_rgba(15,23,42,0.05)] hover:border-[var(--brand-500)]/28 hover:shadow-[0_14px_28px_rgba(15,23,42,0.09)]"
                : "cursor-not-allowed bg-[var(--bg-surface-inset)] text-[var(--text-muted)] opacity-70",
              day.isToday ? "border-[var(--brand-500)]/45" : "border-[var(--border-subtle)]",
              isSelected ? "ring-4 ring-[var(--brand-500)]/14" : "",
            ].join(" ");

            return (
              <button
                aria-label={`Show bookings for ${day.date}`}
                aria-pressed={isSelected}
                className={cellClass}
                disabled={!day.isBookable}
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      day.isToday
                        ? "border-2 border-[var(--brand-500)] bg-white text-[var(--brand-600)]"
                        : "bg-[var(--bg-surface-tint)] text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    {dayNumber}
                  </span>
                  {totalSignals > 0 ? (
                    <span className="rounded-full bg-[var(--bg-surface-tint)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                      {totalSignals}
                    </span>
                  ) : null}
                </div>

                <div className="mt-auto space-y-1.5 pt-3">
                  {day.isToday ? (
                    <p className="hidden text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-600)] sm:block">
                      Today
                    </p>
                  ) : null}
                  {visibleConfirmed.length > 0 ? (
                    <div className="flex gap-1">
                      {visibleConfirmed.map((booking) => (
                        <span
                          aria-label={`Confirmed booking for ${booking.userName}`}
                          className={`h-2 flex-1 rounded-full ${getUserColorDotClass(
                            booking.colorHex
                          )}`}
                          key={booking.id}
                          title={`Confirmed booking for ${booking.userName}`}
                        />
                      ))}
                    </div>
                  ) : null}
                  {requestedBookings.length > 0 ? (
                    <div className="rounded-full border border-dashed border-[var(--warning)]/50 bg-[var(--warning-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)]">
                      {requestedBookings.length} req
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      {selectedDay ? (
        <Panel
          className="sticky top-[5.5rem] h-fit p-4 md:p-5"
          variant={selectedBookings.length > 0 ? "elevated" : "base"}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-600)]">
                Selected day
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                {formatDateLabel(selectedDay.date)}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {selectedBookings.length > 0
                  ? `${selectedBookings.length} booking signal${
                      selectedBookings.length === 1 ? "" : "s"
                    }`
                  : "No bookings scheduled."}
              </p>
            </div>
            <Badge tone={confirmedCount > 0 ? "warning" : "success"}>
              {confirmedCount > 0 ? "Busy" : "Available"}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Confirmed
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                {confirmedCount}
              </p>
            </div>
            <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Requested
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                {requestedCount}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {selectedBookings.length > 0 ? (
              selectedBookings.map((booking) => (
                <div
                  className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3.5 py-3"
                  key={booking.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          booking.status === "requested"
                            ? "bg-[var(--warning)]"
                            : getUserColorDotClass(booking.colorHex)
                        }`}
                      />
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {booking.userName}
                      </p>
                    </div>
                    <Badge tone={booking.status === "confirmed" ? "success" : "warning"}>
                      {booking.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {getBookingTimeLabel(booking)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-3.5 py-3 text-sm text-[var(--text-secondary)]">
                {formatShortDateLabel(selectedDay.date)} is open for booking.
              </p>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <ButtonLink
              href={`/vehicles/${vehicleId}/date/${selectedDay.date}`}
              tone="primary"
            >
              New booking
            </ButtonLink>
            <ButtonLink
              href={`/vehicles/${vehicleId}/date/${selectedDay.date}`}
              tone="secondary"
            >
              Open day timeline
            </ButtonLink>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
