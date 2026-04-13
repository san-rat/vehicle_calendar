"use client";

import { useEffect, useState } from "react";
import { getBusinessTimeMinutes } from "@/lib/booking/bookings";
import {
  TIMELINE_SLOT_HEIGHT_PX,
  TIMELINE_TIME_GUTTER_PX,
  TIMELINE_TRACK_HEIGHT_PX,
  getTimedTimelineLayout,
  getTimelineNowLineTopPx,
  shouldShowTimelineNowLine,
  splitTimelineBookings,
} from "@/lib/booking/timeline";
import {
  Button,
  EmptyState,
  Field,
  Notice,
  Panel,
  StatusBadge,
  inputClassName,
} from "@/components/ui";
import { ClockIcon, EmptyStateIcon } from "@/components/ui/icons";

export type TimelineBooking = {
  colorHex: string;
  endTime: string;
  id: string;
  isAllDay: boolean;
  reason: string | null;
  startTime: string;
  status: "confirmed" | "requested";
  userName: string;
};

type BookingWorkspaceProps = {
  allDayDisabled: boolean;
  bookings: TimelineBooking[];
  formAction: (formData: FormData) => void | Promise<void>;
  formDisabledMessage: string | null;
  reasonRequired: boolean;
  selectedDate: string;
  submitLabel: string;
  timeOptions: string[];
  timeLimitMinutes: number | null;
  today: string;
};

const bookingColorClasses: Record<string, string> = {
  "#10B981": "border-[#10B981] bg-[#10B981]/10 text-[#065F46]",
  "#14B8A6": "border-[#14B8A6] bg-[#14B8A6]/10 text-[#0F766E]",
  "#3B82F6": "border-[#3B82F6] bg-[#3B82F6]/10 text-[#1D4ED8]",
  "#6366F1": "border-[#6366F1] bg-[#6366F1]/10 text-[#4338CA]",
  "#EC4899": "border-[#EC4899] bg-[#EC4899]/10 text-[#BE185D]",
  "#F97316": "border-[#F97316] bg-[#F97316]/10 text-[#C2410C]",
};

const bookingDotClasses: Record<string, string> = {
  "#10B981": "bg-[#10B981]",
  "#14B8A6": "bg-[#14B8A6]",
  "#3B82F6": "bg-[#3B82F6]",
  "#6366F1": "bg-[#6366F1]",
  "#EC4899": "bg-[#EC4899]",
  "#F97316": "bg-[#F97316]",
};

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function getBookingSurfaceClass(booking: TimelineBooking) {
  if (booking.status === "requested") {
    return "border-dashed border-[var(--primary)]/60 bg-white text-[var(--text)]";
  }

  return (
    bookingColorClasses[booking.colorHex.toUpperCase()] ??
    "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
  );
}

function getBookingDotClass(booking: TimelineBooking) {
  if (booking.status === "requested") {
    return "bg-[var(--primary)]";
  }

  return (
    bookingDotClasses[booking.colorHex.toUpperCase()] ?? "bg-[var(--primary)]"
  );
}

function getBookingTimeLabel(booking: TimelineBooking) {
  if (booking.isAllDay) {
    return "All day";
  }

  return `${normalizeTime(booking.startTime)} - ${normalizeTime(booking.endTime)}`;
}

function compareBookings(first: TimelineBooking, second: TimelineBooking) {
  if (first.isAllDay !== second.isAllDay) {
    return first.isAllDay ? -1 : 1;
  }

  return (
    normalizeTime(first.startTime).localeCompare(normalizeTime(second.startTime)) ||
    normalizeTime(first.endTime).localeCompare(normalizeTime(second.endTime)) ||
    first.userName.localeCompare(second.userName)
  );
}

function TimelineDetailCard({
  booking,
}: {
  booking: TimelineBooking;
}) {
  return (
    <article
      className={`rounded-lg border px-3 py-3 text-sm shadow-sm ${getBookingSurfaceClass(
        booking
      )}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${getBookingDotClass(
              booking
            )}`}
          />
          <span className="truncate font-semibold">{booking.userName}</span>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <p className="mt-1 text-xs font-medium opacity-90">
        {getBookingTimeLabel(booking)}
      </p>
      {booking.reason ? (
        <p className="mt-2 text-xs leading-5 text-[var(--text)]">
          {booking.reason}
        </p>
      ) : null}
    </article>
  );
}

function TimelinePanel({
  bookings,
  onOpenForm,
  selectedDate,
  timeOptions,
  today,
}: {
  bookings: TimelineBooking[];
  onOpenForm: () => void;
  selectedDate: string;
  timeOptions: string[];
  today: string;
}) {
  const { allDayBookings, timedBookings } = splitTimelineBookings(
    [...bookings].sort(compareBookings)
  );
  const timedLayouts = getTimedTimelineLayout(timedBookings);
  const orderedBookings = [...bookings].sort(compareBookings);
  const showNowLine = shouldShowTimelineNowLine(selectedDate, today);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number | null>(
    showNowLine ? getBusinessTimeMinutes() : null
  );

  useEffect(() => {
    if (!showNowLine) {
      return;
    }

    const updateCurrentTime = () => {
      setCurrentTimeMinutes(getBusinessTimeMinutes());
    };

    updateCurrentTime();
    const intervalId = window.setInterval(updateCurrentTime, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [showNowLine]);

  return (
    <Panel>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
            <ClockIcon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">Timeline</h2>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Confirmed bookings block time. Requested bookings stay visible without
          blocking the calendar.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            action={
              <Button
                className="w-full sm:w-auto md:hidden"
                onClick={onOpenForm}
                tone="primary"
                type="button"
              >
                Open booking form
              </Button>
            }
            description="The calendar is clear. You can move to the form and book this vehicle right now."
            icon={EmptyStateIcon}
            title="No trips scheduled"
          />
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {allDayBookings.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  All-day bookings
                </h3>
                <span className="rounded-md border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                  {allDayBookings.length}
                </span>
              </div>
              <div className="space-y-2">
                {allDayBookings.map((booking) => (
                  <TimelineDetailCard booking={booking} key={booking.id} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  Timed schedule
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  A full-day track keeps overlaps and the current minute visible.
                </p>
              </div>
              <span className="rounded-md border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                {timedBookings.length}
              </span>
            </div>

            {timedBookings.length === 0 ? (
              <Notice tone="info">
                Only all-day bookings are scheduled for this date.
              </Notice>
            ) : (
              <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
                <div className="max-h-[680px] overflow-y-auto">
                  <div
                    className="grid min-w-0"
                    style={{
                      gridTemplateColumns: `${TIMELINE_TIME_GUTTER_PX}px minmax(0, 1fr)`,
                    }}
                  >
                    <div
                      className="relative border-r border-[var(--border)] bg-[var(--surface-muted)]/70"
                      style={{ height: TIMELINE_TRACK_HEIGHT_PX }}
                    >
                      {Array.from({ length: 24 }, (_, index) => {
                        const label = `${String(index).padStart(2, "0")}:00`;

                        return (
                          <span
                            className="absolute left-2 text-[11px] font-semibold text-[var(--muted)]"
                            key={label}
                            style={{ top: index * TIMELINE_SLOT_HEIGHT_PX * 2 }}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>

                    <div
                      className="relative"
                      style={{ height: TIMELINE_TRACK_HEIGHT_PX }}
                    >
                      {Array.from({ length: 24 }, (_, index) => (
                        <div
                          className={`absolute inset-x-0 ${
                            index % 2 === 0
                              ? "bg-[var(--surface-muted)]/45"
                              : "bg-white"
                          }`}
                          key={`hour-band-${index}`}
                          style={{
                            height: TIMELINE_SLOT_HEIGHT_PX * 2,
                            top: index * TIMELINE_SLOT_HEIGHT_PX * 2,
                          }}
                        />
                      ))}

                      {Array.from(
                        { length: timeOptions.length + 1 },
                        (_, index) => (
                          <div
                            className={`absolute inset-x-0 border-t ${
                              index % 2 === 0
                                ? "border-[var(--border)]"
                                : "border-[var(--border)]/60"
                            }`}
                            key={`timeline-line-${index}`}
                            style={{ top: index * TIMELINE_SLOT_HEIGHT_PX }}
                          />
                        )
                      )}

                      {showNowLine && currentTimeMinutes !== null ? (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                          style={{
                            top: getTimelineNowLineTopPx(currentTimeMinutes),
                          }}
                        >
                          <div className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          <div className="h-[2px] w-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.35)]" />
                        </div>
                      ) : null}

                      {timedLayouts.map((layout) => {
                        const columnWidth = 100 / layout.totalColumns;
                        const showTimeLabel =
                          layout.heightPx >= TIMELINE_SLOT_HEIGHT_PX * 1.25;

                        return (
                          <article
                            className={`absolute z-10 overflow-hidden rounded-lg border-l-4 px-3 py-2 text-xs shadow-sm ${getBookingSurfaceClass(
                              layout.booking
                            )}`}
                            key={layout.booking.id}
                            style={{
                              height: Math.max(layout.heightPx - 6, 42),
                              left: `calc(${layout.column * columnWidth}% + 8px)`,
                              top: layout.topPx + 3,
                              width: `calc(${columnWidth}% - 12px)`,
                            }}
                          >
                            <p className="truncate text-sm font-semibold">
                              {layout.booking.userName}
                            </p>
                            {showTimeLabel ? (
                              <p className="mt-1 truncate opacity-90">
                                {normalizeTime(layout.booking.startTime)}
                                {" - "}
                                {normalizeTime(layout.booking.endTime)}
                              </p>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  Booking details
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Full status and reason details stay readable below the live
                  track.
                </p>
              </div>
              <span className="rounded-md border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                {orderedBookings.length}
              </span>
            </div>
            <div className="space-y-2">
              {orderedBookings.map((booking) => (
                <TimelineDetailCard booking={booking} key={`detail-${booking.id}`} />
              ))}
            </div>
          </section>
        </div>
      )}
    </Panel>
  );
}

function BookingFormPanel({
  allDayDisabled,
  formAction,
  formDisabledMessage,
  reasonRequired,
  submitLabel,
  timeOptions,
  timeLimitMinutes,
}: Omit<
  BookingWorkspaceProps,
  "bookings" | "selectedDate" | "today"
>) {
  const [isAllDay, setIsAllDay] = useState(false);
  const isFormDisabled = formDisabledMessage !== null;
  const isTimeDisabled = isFormDisabled || isAllDay;

  return (
    <Panel>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
            <ClockIcon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">New Booking</h2>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {timeLimitMinutes === null
            ? "All-day bookings are available."
            : `Bookings are limited to ${timeLimitMinutes} minutes.`}
        </p>
      </div>

      {formDisabledMessage ? (
        <Notice className="mb-4" tone="danger">
          {formDisabledMessage}
        </Notice>
      ) : null}

      <form action={formAction} className="space-y-4">
        <label className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-white px-3 py-3 text-sm text-[var(--text)]">
          <input
            checked={isAllDay}
            className="h-4 w-4"
            disabled={allDayDisabled || isFormDisabled}
            name="is_all_day"
            onChange={(event) => setIsAllDay(event.target.checked)}
            type="checkbox"
            value="true"
          />
          <span>
            All day
            {allDayDisabled ? (
              <span className="ml-2 text-xs text-[var(--muted)]">
                Disabled by time limit
              </span>
            ) : null}
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="booking-start-time" label="Start time">
            <select
              className={inputClassName()}
              disabled={isTimeDisabled}
              id="booking-start-time"
              name="start_time"
              required={!isAllDay}
            >
              <option value="">Choose start</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </Field>

          <Field htmlFor="booking-end-time" label="End time">
            <select
              className={inputClassName()}
              disabled={isTimeDisabled}
              id="booking-end-time"
              name="end_time"
              required={!isAllDay}
            >
              <option value="">Choose end</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          htmlFor="booking-reason"
          label={`Reason${reasonRequired ? "" : " (optional)"}`}
        >
          <textarea
            className={inputClassName("min-h-28")}
            disabled={isFormDisabled}
            id="booking-reason"
            maxLength={500}
            name="reason"
            required={reasonRequired}
          />
        </Field>

        <Button
          className="w-full"
          disabled={isFormDisabled}
          tone="primary"
          type="submit"
        >
          {submitLabel}
        </Button>
      </form>
    </Panel>
  );
}

export function BookingWorkspace({
  allDayDisabled,
  bookings,
  formAction,
  formDisabledMessage,
  reasonRequired,
  selectedDate,
  submitLabel,
  timeOptions,
  timeLimitMinutes,
  today,
}: BookingWorkspaceProps) {
  const [activePanel, setActivePanel] = useState<"timeline" | "form">(
    "timeline"
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 md:hidden">
        <button
          className={`min-h-11 rounded-md px-4 py-2 text-sm font-semibold transition ${
            activePanel === "timeline"
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
          onClick={() => setActivePanel("timeline")}
          type="button"
        >
          Timeline
        </button>
        <button
          className={`min-h-11 rounded-md px-4 py-2 text-sm font-semibold transition ${
            activePanel === "form"
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
          onClick={() => setActivePanel("form")}
          type="button"
        >
          Form
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className={activePanel === "timeline" ? "block" : "hidden md:block"}>
          <TimelinePanel
            bookings={bookings}
            onOpenForm={() => setActivePanel("form")}
            selectedDate={selectedDate}
            timeOptions={timeOptions}
            today={today}
          />
        </div>
        <div className={activePanel === "form" ? "block" : "hidden md:block"}>
          <BookingFormPanel
            allDayDisabled={allDayDisabled}
            formAction={formAction}
            formDisabledMessage={formDisabledMessage}
            reasonRequired={reasonRequired}
            submitLabel={submitLabel}
            timeLimitMinutes={timeLimitMinutes}
            timeOptions={timeOptions}
          />
        </div>
      </div>
    </div>
  );
}
