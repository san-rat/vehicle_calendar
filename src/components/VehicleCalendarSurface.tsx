"use client";

import Link from "next/link";
import { type MouseEvent, useState } from "react";
import type { CalendarMonth } from "@/lib/booking/dates";
import { isDateWithinBookingWindow } from "@/lib/booking/dates";
import { ButtonLink } from "@/components/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

export type CalendarDateSummary = {
  confirmedCount: number;
  requestedCount: number;
};

type VehicleCalendarSurfaceProps = {
  allowBookingFreedom: boolean;
  bookableDays: number;
  confirmedCount: number;
  maxDaysInFuture: number;
  month: Pick<
    CalendarMonth,
    "days" | "firstWeekday" | "label" | "nextMonth" | "prevMonth"
  >;
  requestedCount: number;
  summaryByDate: Record<string, CalendarDateSummary>;
  today: string;
  vehicleId: string;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDateLabel(
  value: string,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...options,
  }).format(new Date(`${value}T00:00:00Z`));
}

function getSelectedDateCopy(summary: CalendarDateSummary) {
  if (summary.confirmedCount > 0 && summary.requestedCount > 0) {
    return {
      description:
        "Confirmed bookings and pending requests are already visible on this date. Check the timeline to find an open time window.",
      title: "Busy day",
    };
  }

  if (summary.confirmedCount > 0) {
    return {
      description:
        "Confirmed bookings are already visible on this date. You can still continue to check for a free time window.",
      title: "Has confirmed bookings",
    };
  }

  if (summary.requestedCount > 0) {
    return {
      description:
        "Pending requests are already visible on this date. They do not block booking, but you should review the timeline before continuing.",
      title: "Has pending requests",
    };
  }

  return {
    description: "No visible bookings are on this date yet.",
    title: "Open for booking",
  };
}

export function VehicleCalendarSurface({
  allowBookingFreedom,
  bookableDays,
  confirmedCount,
  maxDaysInFuture,
  month,
  requestedCount,
  summaryByDate,
  today,
  vehicleId,
}: VehicleCalendarSurfaceProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedSummary = selectedDate
    ? (summaryByDate[selectedDate] ?? { confirmedCount: 0, requestedCount: 0 })
    : null;
  const selectedDateCopy = selectedSummary
    ? getSelectedDateCopy(selectedSummary)
    : null;
  const selectedDateLabel = selectedDate
    ? formatDateLabel(selectedDate, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const handleBookableDateClick = (
    event: MouseEvent<HTMLAnchorElement>,
    date: string
  ) => {
    if (!window.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    event.preventDefault();
    setSelectedDate(date);
  };

  return (
    <section className="rounded-[22px] border border-white/75 bg-[var(--bg-surface)] p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)] md:rounded-[24px] md:p-5 md:shadow-[0_20px_48px_rgba(15,23,42,0.1)]">
      <div className="flex items-center justify-between gap-3">
        <ButtonLink
          aria-label={`Open ${month.prevMonth}`}
          className="h-10 w-10 p-0"
          href={`/vehicles/${vehicleId}/calendar?month=${month.prevMonth}`}
          size="sm"
          tone="secondary"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </ButtonLink>

        <div className="min-w-0 text-center">
          <h2 className="text-[1.1rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)] md:text-[1.35rem]">
            {month.label}
          </h2>
        </div>

        <ButtonLink
          aria-label={`Open ${month.nextMonth}`}
          className="h-10 w-10 p-0"
          href={`/vehicles/${vehicleId}/calendar?month=${month.nextMonth}`}
          size="sm"
          tone="secondary"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </ButtonLink>
      </div>

      <p className="mt-3 hidden text-sm font-medium text-[var(--text-secondary)] md:block">
        {confirmedCount} confirmed · {requestedCount} requested · {bookableDays}{" "}
        bookable days
      </p>

      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekdayLabels.map((label) => (
          <div
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] md:py-2 md:text-[11px]"
            key={label}
          >
            {label}
          </div>
        ))}

        {Array.from({ length: month.firstWeekday }, (_, index) => (
          <div aria-hidden="true" key={`blank-${index}`} />
        ))}

        {month.days.map((date) => {
          const dayNumber = Number(date.slice(-2));
          const isToday = date === today;
          const isSelected = selectedDate === date;
          const isBookable = isDateWithinBookingWindow({
            date,
            maxDaysInFuture,
            today,
          });
          const summary = summaryByDate[date] ?? {
            confirmedCount: 0,
            requestedCount: 0,
          };
          const visibleSignalCount =
            Number(summary.confirmedCount > 0) + Number(summary.requestedCount > 0);
          const totalSignals = summary.confirmedCount + summary.requestedCount;
          const hiddenSignalCount = Math.max(totalSignals - visibleSignalCount, 0);
          const cellClassName = joinClasses(
            "flex aspect-square min-h-[3.6rem] flex-col justify-between rounded-[16px] border p-1.5 text-left transition-all duration-200 md:min-h-[6rem] md:rounded-[18px] md:p-2.5",
            isBookable
              ? "bg-white shadow-[0_8px_18px_rgba(15,23,42,0.04)] hover:border-[var(--brand-500)]/28 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[var(--text-muted)] opacity-70",
            isSelected
              ? "border-[var(--brand-500)] bg-[var(--brand-500)] text-white shadow-[0_16px_30px_rgba(17,122,108,0.22)]"
              : "border-[var(--border-subtle)] text-[var(--text-primary)]"
          );
          const dateBadgeClassName = joinClasses(
            "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold md:h-8 md:w-8",
            isSelected
              ? isToday
                ? "border border-white/70 bg-white/14 text-white"
                : "bg-white/14 text-white"
              : isToday
                ? "border-2 border-[var(--brand-500)] text-[var(--brand-600)]"
                : "text-[var(--text-primary)]"
          );
          const cellContent = (
            <>
              <div className="flex items-start justify-between gap-1">
                <span className={dateBadgeClassName}>{dayNumber}</span>
                {hiddenSignalCount > 0 ? (
                  <span
                    className={joinClasses(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      isSelected
                        ? "bg-white/14 text-white"
                        : "bg-[var(--bg-surface-tint)] text-[var(--text-secondary)]"
                    )}
                  >
                    +{hiddenSignalCount}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-1">
                {summary.confirmedCount > 0 ? (
                  <span
                    aria-label={`${summary.confirmedCount} confirmed booking${summary.confirmedCount === 1 ? "" : "s"}`}
                    className={joinClasses(
                      "h-2 w-2 rounded-full",
                      isSelected ? "bg-emerald-200" : "bg-emerald-500"
                    )}
                  />
                ) : null}
                {summary.requestedCount > 0 ? (
                  <span
                    aria-label={`${summary.requestedCount} requested booking${summary.requestedCount === 1 ? "" : "s"}`}
                    className={joinClasses(
                      "h-2 w-2 rounded-full",
                      isSelected ? "bg-amber-200" : "bg-amber-500"
                    )}
                  />
                ) : null}
              </div>
            </>
          );

          return isBookable ? (
            <Link
              aria-label={`Open booking page for ${date}`}
              className={cellClassName}
              href={`/vehicles/${vehicleId}/date/${date}`}
              key={date}
              onClick={(event) => handleBookableDateClick(event, date)}
            >
              {cellContent}
            </Link>
          ) : (
            <div aria-disabled="true" className={cellClassName} key={date}>
              {cellContent}
            </div>
          );
        })}
      </div>

      {selectedDate && selectedSummary && selectedDateCopy ? (
        <div className="mt-4 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] p-4 md:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--brand-600)]">
            Selected day
          </p>
          <h3 className="mt-2 text-base font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {selectedDateLabel}
          </h3>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            {selectedDateCopy.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {selectedDateCopy.description}
          </p>

          <p className="mt-3 text-xs font-medium text-[var(--text-secondary)]">
            {selectedSummary.confirmedCount} confirmed · {selectedSummary.requestedCount}{" "}
            requested
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
            {allowBookingFreedom
              ? "New bookings auto-confirm when the chosen time is clear."
              : "New bookings for this day continue to approval."}
          </p>

          <ButtonLink
            className="mt-4 w-full"
            href={`/vehicles/${vehicleId}/date/${selectedDate}`}
            tone="primary"
          >
            Continue booking
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
