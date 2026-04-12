"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Notice,
  Panel,
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
  submitLabel: string;
  timeOptions: string[];
  timeLimitMinutes: number | null;
};

const bookingColorClasses: Record<string, string> = {
  "#10B981": "border-[#10B981] bg-[#10B981]/10 text-[#065F46]",
  "#14B8A6": "border-[#14B8A6] bg-[#14B8A6]/10 text-[#0F766E]",
  "#3B82F6": "border-[#3B82F6] bg-[#3B82F6]/10 text-[#1D4ED8]",
  "#6366F1": "border-[#6366F1] bg-[#6366F1]/10 text-[#4338CA]",
  "#EC4899": "border-[#EC4899] bg-[#EC4899]/10 text-[#BE185D]",
  "#F97316": "border-[#F97316] bg-[#F97316]/10 text-[#C2410C]",
};

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function getBookingClass(booking: TimelineBooking) {
  if (booking.status === "requested") {
    return "border-dashed border-[var(--primary)] bg-white text-[var(--text)]";
  }

  return (
    bookingColorClasses[booking.colorHex.toUpperCase()] ??
    "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
  );
}

function getBookingsForSlot(bookings: TimelineBooking[], slot: string) {
  return bookings.filter((booking) => normalizeTime(booking.startTime) === slot);
}

function TimelinePanel({
  bookings,
  timeOptions,
}: {
  bookings: TimelineBooking[];
  timeOptions: string[];
}) {
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
          Confirmed bookings block time. Requested bookings do not block time.
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          description="This day is open. Switch to the form when you are ready to book."
          icon={<EmptyStateIcon className="h-6 w-6" />}
          title="No trips scheduled"
        />
      ) : null}

      <div className="mt-4 max-h-[680px] space-y-1 overflow-y-auto pr-1">
        {timeOptions.map((slot) => {
          const slotBookings = getBookingsForSlot(bookings, slot);

          return (
            <div
              className="grid min-h-12 grid-cols-[56px_1fr] gap-3 border-t border-[var(--border)] py-2"
              key={slot}
            >
              <div className="text-xs font-semibold text-[var(--muted)]">
                {slot}
              </div>
              <div className="space-y-2">
                {slotBookings.map((booking) => (
                  <div
                    className={`rounded-md border-l-4 px-3 py-3 text-sm shadow-sm ${getBookingClass(
                      booking
                    )}`}
                    key={booking.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">
                        {booking.userName}
                      </span>
                      <Badge
                        tone={booking.status === "confirmed" ? "success" : "info"}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs">
                      {booking.isAllDay
                        ? "All day"
                        : `${normalizeTime(booking.startTime)} - ${normalizeTime(
                            booking.endTime
                          )}`}
                    </p>
                    {booking.reason ? (
                      <p className="mt-1 text-xs">{booking.reason}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
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
}: Omit<BookingWorkspaceProps, "bookings">) {
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
  submitLabel,
  timeOptions,
  timeLimitMinutes,
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
          <TimelinePanel bookings={bookings} timeOptions={timeOptions} />
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
