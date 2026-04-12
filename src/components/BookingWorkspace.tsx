"use client";

import { useState } from "react";

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
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Confirmed bookings block time. Requested bookings do not block time.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">
          No trips are scheduled for this date.
        </div>
      ) : null}

      <div className="max-h-[680px] space-y-1 overflow-y-auto pr-1">
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
                    className={`rounded-md border-l-4 px-3 py-2 text-sm ${getBookingClass(
                      booking
                    )}`}
                    key={booking.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">
                        {booking.userName}
                      </span>
                      <span className="text-xs font-semibold uppercase">
                        {booking.status}
                      </span>
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
    </section>
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
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">New Booking</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {timeLimitMinutes === null
            ? "All-day bookings are available."
            : `Bookings are limited to ${timeLimitMinutes} minutes.`}
        </p>
      </div>

      {formDisabledMessage ? (
        <p className="mb-4 rounded-md border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {formDisabledMessage}
        </p>
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
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">
              Start Time
            </span>
            <select
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] disabled:opacity-60"
              disabled={isTimeDisabled}
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
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">
              End Time
            </span>
            <select
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] disabled:opacity-60"
              disabled={isTimeDisabled}
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
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase text-[var(--muted)]">
            Reason {reasonRequired ? "" : "Optional"}
          </span>
          <textarea
            className="min-h-28 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] disabled:opacity-60"
            disabled={isFormDisabled}
            maxLength={500}
            name="reason"
            required={reasonRequired}
          />
        </label>

        <button
          className="w-full rounded-md bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
          disabled={isFormDisabled}
          type="submit"
        >
          {submitLabel}
        </button>
      </form>
    </section>
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
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            activePanel === "timeline"
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted)]"
          }`}
          onClick={() => setActivePanel("timeline")}
          type="button"
        >
          Timeline
        </button>
        <button
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            activePanel === "form"
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted)]"
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
