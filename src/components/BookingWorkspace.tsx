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
  Badge,
  Button,
  EmptyState,
  Field,
  Notice,
  Panel,
  StatusBadge,
  inputClassName,
} from "@/components/ui";
import { CalendarIcon, ClockIcon, EmptyStateIcon, ManageIcon } from "@/components/ui/icons";

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
  bookingModeLabel: string;
  bookings: TimelineBooking[];
  formAction: (formData: FormData) => void | Promise<void>;
  formDisabledMessage: string | null;
  policySummary: string;
  reasonRequired: boolean;
  selectedDate: string;
  selectedDateLabel: string;
  submitLabel: string;
  timeOptions: string[];
  timeLimitMinutes: number | null;
  today: string;
  vehicleLabel: string;
};

const bookingColorClasses: Record<string, string> = {
  "#10B981": "border-[#10B981]/26 bg-[#eaf8f1] text-[#065f46]",
  "#14B8A6": "border-[#14B8A6]/26 bg-[#ebfbfa] text-[#0f766e]",
  "#3B82F6": "border-[#3B82F6]/26 bg-[#eef5ff] text-[#1d4ed8]",
  "#6366F1": "border-[#6366F1]/26 bg-[#eef0ff] text-[#4338ca]",
  "#EC4899": "border-[#EC4899]/26 bg-[#fff0f7] text-[#be185d]",
  "#F97316": "border-[#F97316]/26 bg-[#fff3eb] text-[#c2410c]",
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
    return "border-dashed border-[var(--warning)]/45 bg-[var(--warning-soft)] text-[var(--warning)]";
  }

  return (
    bookingColorClasses[booking.colorHex.toUpperCase()] ??
    "border-[var(--brand-500)]/25 bg-[var(--brand-100)] text-[var(--brand-600)]"
  );
}

function getBookingDotClass(booking: TimelineBooking) {
  if (booking.status === "requested") {
    return "bg-[var(--warning)]";
  }

  return (
    bookingDotClasses[booking.colorHex.toUpperCase()] ?? "bg-[var(--brand-500)]"
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

function TimelineDetailCard({ booking }: { booking: TimelineBooking }) {
  return (
    <article
      className={`rounded-[20px] border px-4 py-4 text-sm shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-[1px] hover:shadow-[0_16px_34px_rgba(15,23,42,0.1)] ${getBookingSurfaceClass(
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
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] opacity-90">
        {getBookingTimeLabel(booking)}
      </p>
      {booking.reason ? (
        <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]/90">
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
  selectedDateLabel,
  timeOptions,
  today,
}: {
  bookings: TimelineBooking[];
  onOpenForm: () => void;
  selectedDate: string;
  selectedDateLabel: string;
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
    <Panel className="h-full" variant="elevated">
      <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-600)]">
                <ClockIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[1.4rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                  Daily timeline
                </h2>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {selectedDateLabel}
                </p>
              </div>
            </div>
          </div>

          <Button
            className="md:hidden"
            onClick={onOpenForm}
            size="sm"
            tone="primary"
            type="button"
          >
            New booking
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="success">
            {timedBookings.length + allDayBookings.length} booking
            {timedBookings.length + allDayBookings.length === 1 ? "" : "s"}
          </Badge>
          <Badge tone="secondary">{allDayBookings.length} all day</Badge>
          <Badge tone="secondary">{timedBookings.length} timed</Badge>
          {showNowLine ? <Badge tone="warning">Live now line</Badge> : null}
        </div>
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
            description="No bookings on this date."
            icon={EmptyStateIcon}
            title="No bookings scheduled"
          />
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {allDayBookings.length > 0 ? (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  All-day bookings
                </h3>
                <Badge tone="secondary">{allDayBookings.length}</Badge>
              </div>
              <div className="space-y-2">
                {allDayBookings.map((booking) => (
                  <TimelineDetailCard booking={booking} key={booking.id} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Timed schedule
              </h3>
              <Badge tone="secondary">{timedBookings.length}</Badge>
            </div>

            {timedBookings.length === 0 ? (
              <Notice tone="info">
                Only all-day bookings are scheduled for this date.
              </Notice>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.07)]">
                <div className="max-h-[680px] overflow-y-auto">
                  <div
                    className="grid min-w-0"
                    style={{
                      gridTemplateColumns: `${TIMELINE_TIME_GUTTER_PX}px minmax(0, 1fr)`,
                    }}
                  >
                    <div
                      className="relative border-r border-[var(--border-subtle)] bg-[var(--bg-surface-tint)]"
                      style={{ height: TIMELINE_TRACK_HEIGHT_PX }}
                    >
                      {Array.from({ length: 24 }, (_, index) => {
                        const label = `${String(index).padStart(2, "0")}:00`;

                        return (
                          <span
                            className="absolute left-2 text-[11px] font-semibold text-[var(--text-muted)]"
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
                              ? "bg-[var(--bg-surface-tint)]"
                              : "bg-white"
                          }`}
                          key={`hour-band-${index}`}
                          style={{
                            height: TIMELINE_SLOT_HEIGHT_PX * 2,
                            top: index * TIMELINE_SLOT_HEIGHT_PX * 2,
                          }}
                        />
                      ))}

                      {Array.from({ length: timeOptions.length + 1 }, (_, index) => (
                        <div
                          className={`absolute inset-x-0 border-t ${
                            index % 2 === 0
                              ? "border-[var(--border-subtle)]"
                              : "border-[var(--border-subtle)]/70"
                          }`}
                          key={`timeline-line-${index}`}
                          style={{ top: index * TIMELINE_SLOT_HEIGHT_PX }}
                        />
                      ))}

                      {showNowLine && currentTimeMinutes !== null ? (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                          style={{
                            top: getTimelineNowLineTopPx(currentTimeMinutes),
                          }}
                        >
                          <div className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-[var(--danger)] shadow-[0_0_8px_rgba(199,59,55,0.5)]" />
                          <div className="h-[2px] w-full bg-[var(--danger)] shadow-[0_0_8px_rgba(199,59,55,0.35)]" />
                        </div>
                      ) : null}

                      {timedLayouts.map((layout) => {
                        const columnWidth = 100 / layout.totalColumns;
                        const showTimeLabel =
                          layout.heightPx >= TIMELINE_SLOT_HEIGHT_PX * 1.25;

                        return (
                          <article
                            className={`absolute z-10 overflow-hidden rounded-[18px] border-l-4 border-t border-r border-b px-3 py-2 text-xs shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition-all hover:z-20 hover:scale-[1.01] hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] ${getBookingSurfaceClass(
                              layout.booking
                            )}`}
                            key={layout.booking.id}
                            style={{
                              height: Math.max(layout.heightPx - 6, 44),
                              left: `calc(${layout.column * columnWidth}% + 8px)`,
                              top: layout.topPx + 3,
                              width: `calc(${columnWidth}% - 12px)`,
                            }}
                          >
                            <p className="truncate text-sm font-semibold">
                              {layout.booking.userName}
                            </p>
                            {showTimeLabel ? (
                              <p className="mt-1 truncate font-medium opacity-90">
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

          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Booking details
              </h3>
              <Badge tone="secondary">{orderedBookings.length}</Badge>
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

function BookingSummary({
  bookingModeLabel,
  policySummary,
  selectedDateLabel,
  vehicleLabel,
}: Pick<
  BookingWorkspaceProps,
  "bookingModeLabel" | "policySummary" | "selectedDateLabel" | "vehicleLabel"
>) {
  return (
    <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-600)]">
          <ManageIcon className="h-[1.125rem] w-[1.125rem]" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Booking summary
          </p>
        </div>
      </div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Vehicle
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            {vehicleLabel}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Date
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            {selectedDateLabel}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Booking mode
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            {bookingModeLabel}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Policy
          </dt>
          <dd className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {policySummary}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function BookingFormPanel({
  allDayDisabled,
  bookingModeLabel,
  formAction,
  formDisabledMessage,
  policySummary,
  reasonRequired,
  selectedDateLabel,
  submitLabel,
  timeOptions,
  timeLimitMinutes,
  vehicleLabel,
}: Omit<BookingWorkspaceProps, "bookings" | "selectedDate" | "today">) {
  const [isAllDay, setIsAllDay] = useState(false);
  const isFormDisabled = formDisabledMessage !== null;
  const isTimeDisabled = isFormDisabled || isAllDay;

  return (
    <Panel className="h-full" variant="elevated">
      <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-600)]">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[1.4rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              New booking
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={bookingModeLabel === "Auto-confirm" ? "success" : "warning"}>
            {bookingModeLabel}
          </Badge>
          <Badge tone="secondary">
            {timeLimitMinutes === null
              ? "All-day bookings enabled"
              : `${timeLimitMinutes} minute limit`}
          </Badge>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <BookingSummary
          bookingModeLabel={bookingModeLabel}
          policySummary={policySummary}
          selectedDateLabel={selectedDateLabel}
          vehicleLabel={vehicleLabel}
        />

        {formDisabledMessage ? (
          <Notice tone="danger">{formDisabledMessage}</Notice>
        ) : null}

        <form action={formAction} className="space-y-4">
          <label className="flex items-start gap-3 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-4 text-sm text-[var(--text-primary)]">
            <input
              checked={isAllDay}
              className="mt-1 h-4 w-4 rounded border-[var(--border-strong)]"
              disabled={allDayDisabled || isFormDisabled}
              name="is_all_day"
              onChange={(event) => setIsAllDay(event.target.checked)}
              type="checkbox"
              value="true"
            />
            <span>
              <span className="block font-semibold">All day booking</span>
              <span className="mt-1 block text-sm leading-6 text-[var(--text-secondary)]">
                {allDayDisabled
                  ? "Disabled while a time limit is active."
                  : "Use this when you do not need start and end times."}
              </span>
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
            description={
              reasonRequired
                ? "Required by policy."
                : undefined
            }
            htmlFor="booking-reason"
            label="Reason"
            optionalLabel={reasonRequired ? null : "Optional"}
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
            size="lg"
            tone="primary"
            type="submit"
          >
            {submitLabel}
          </Button>
        </form>
      </div>
    </Panel>
  );
}

export function BookingWorkspace({
  allDayDisabled,
  bookingModeLabel,
  bookings,
  formAction,
  formDisabledMessage,
  policySummary,
  reasonRequired,
  selectedDate,
  selectedDateLabel,
  submitLabel,
  timeOptions,
  timeLimitMinutes,
  today,
  vehicleLabel,
}: BookingWorkspaceProps) {
  const [activePanel, setActivePanel] = useState<"timeline" | "form">(
    "timeline"
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-[0_12px_28px_rgba(15,23,42,0.05)] md:hidden">
        <button
          className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition ${
            activePanel === "timeline"
              ? "bg-[var(--brand-500)] text-white shadow-[0_12px_24px_rgba(17,122,108,0.22)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          onClick={() => setActivePanel("timeline")}
          type="button"
        >
          Timeline
        </button>
        <button
          className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition ${
            activePanel === "form"
              ? "bg-[var(--brand-500)] text-white shadow-[0_12px_24px_rgba(17,122,108,0.22)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          onClick={() => setActivePanel("form")}
          type="button"
        >
          Booking form
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <div className={activePanel === "timeline" ? "block" : "hidden xl:block"}>
          <TimelinePanel
            bookings={bookings}
            onOpenForm={() => setActivePanel("form")}
            selectedDate={selectedDate}
            selectedDateLabel={selectedDateLabel}
            timeOptions={timeOptions}
            today={today}
          />
        </div>
        <div className={activePanel === "form" ? "block" : "hidden xl:block"}>
          <BookingFormPanel
            allDayDisabled={allDayDisabled}
            bookingModeLabel={bookingModeLabel}
            formAction={formAction}
            formDisabledMessage={formDisabledMessage}
            policySummary={policySummary}
            reasonRequired={reasonRequired}
            selectedDateLabel={selectedDateLabel}
            submitLabel={submitLabel}
            timeLimitMinutes={timeLimitMinutes}
            timeOptions={timeOptions}
            vehicleLabel={vehicleLabel}
          />
        </div>
      </div>
    </div>
  );
}
