import { isDateWithinBookingWindow, parseIsoDate } from "./dates";

export const ALL_DAY_START_TIME = "00:00";
export const ALL_DAY_END_TIME = "23:59";
export const BOOKING_REASON_MAX_LENGTH = 500;

export type BookingStatus =
  | "cancelled"
  | "confirmed"
  | "overridden"
  | "rejected"
  | "requested";

export type BookingTimeWindow = {
  end_time: string;
  is_all_day: boolean;
  start_time: string;
};

export type ValidBookingInput = {
  date: string;
  end_time: string;
  is_all_day: boolean;
  reason: string | null;
  start_time: string;
};

export type BookingValidationResult =
  | { ok: true; value: ValidBookingInput }
  | { error: string; ok: false };

export type BookingDecisionNoteValidationResult =
  | { ok: true; value: string | null }
  | { error: string; ok: false };

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function normalizeDbTime(value: string) {
  return value.slice(0, 5);
}

export function getThirtyMinuteTimeOptions() {
  return Array.from({ length: 48 }, (_, index) => {
    const totalMinutes = index * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    return `${pad2(hour)}:${pad2(minute)}`;
  });
}

export function parseTimeToMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

export function isThirtyMinuteTime(value: string) {
  const minutes = parseTimeToMinutes(value);

  return minutes !== null && minutes % 30 === 0;
}

export function parseAllDayValue(value: string | null) {
  if (value === null || value === "" || value === "false") {
    return false;
  }

  if (value === "on" || value === "true") {
    return true;
  }

  return null;
}

export function getBookingStatusForFreedom(allowBookingFreedom: boolean) {
  return allowBookingFreedom ? "confirmed" : "requested";
}

export function getBusinessTimeMinutes(
  now = new Date(),
  timeZone = "Asia/Colombo"
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone,
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const hour = values.get("hour");
  const minute = values.get("minute");

  if (!hour || !minute) {
    throw new Error("Unable to resolve the business time.");
  }

  return Number(hour) * 60 + Number(minute);
}

export function hasConfirmedBookingConflict(
  proposed: BookingTimeWindow,
  confirmedBookings: BookingTimeWindow[]
) {
  return getConfirmedBookingConflicts(proposed, confirmedBookings).length > 0;
}

export function getConfirmedBookingConflicts<T extends BookingTimeWindow>(
  proposed: BookingTimeWindow,
  confirmedBookings: T[]
) {
  const proposedStart = parseTimeToMinutes(normalizeDbTime(proposed.start_time));
  const proposedEnd = parseTimeToMinutes(normalizeDbTime(proposed.end_time));

  if (proposedStart === null || proposedEnd === null) {
    return confirmedBookings;
  }

  return confirmedBookings.filter((booking) => {
    const bookingStart = parseTimeToMinutes(normalizeDbTime(booking.start_time));
    const bookingEnd = parseTimeToMinutes(normalizeDbTime(booking.end_time));

    if (bookingStart === null || bookingEnd === null) {
      return true;
    }

    return proposedStart < bookingEnd && proposedEnd > bookingStart;
  });
}

function validateBookingDecisionNote(
  note: string,
  label: string
): BookingDecisionNoteValidationResult {
  const trimmedNote = note.trim();

  if (trimmedNote.length > BOOKING_REASON_MAX_LENGTH) {
    return {
      error: `${label} must be ${BOOKING_REASON_MAX_LENGTH} characters or fewer.`,
      ok: false,
    };
  }

  return {
    ok: true,
    value: trimmedNote || null,
  };
}

export function validateRejectionReason(reason: string) {
  return validateBookingDecisionNote(reason, "Rejection reason");
}

export function validateOverrideNote(note: string) {
  return validateBookingDecisionNote(note, "Override note");
}

export function validateOverrideConfirmation(value: string | null) {
  if (value === "on" || value === "true" || value === "override") {
    return { ok: true } as const;
  }

  return {
    error: "Confirm the override before approving this conflicting request.",
    ok: false,
  } as const;
}

export function getApprovalTimingProblem(input: {
  currentTimeMinutes: number;
  date: string;
  startTime: string;
  today: string;
}) {
  if (!parseIsoDate(input.date) || !parseIsoDate(input.today)) {
    return "This request has an invalid date.";
  }

  if (input.date < input.today) {
    return "This request date has already passed.";
  }

  const startMinutes = parseTimeToMinutes(normalizeDbTime(input.startTime));

  if (startMinutes === null) {
    return "This request has an invalid start time.";
  }

  if (input.date === input.today && startMinutes < input.currentTimeMinutes) {
    return "This request has already started.";
  }

  return null;
}

export function validateBookingInput(input: {
  allDay: string | null;
  confirmedBookings: BookingTimeWindow[];
  currentTimeMinutes?: number;
  date: string;
  endTime: string;
  maxDaysInFuture: number;
  reason: string;
  requireReason: boolean;
  startTime: string;
  timeLimitMinutes: number | null;
  today: string;
}): BookingValidationResult {
  const date = input.date.trim();
  const reason = input.reason.trim();
  const isAllDay = parseAllDayValue(input.allDay);

  if (!parseIsoDate(date)) {
    return { error: "Choose a valid booking date.", ok: false };
  }

  if (
    !isDateWithinBookingWindow({
      date,
      maxDaysInFuture: input.maxDaysInFuture,
      today: input.today,
    })
  ) {
    return {
      error: "Choose a date inside the allowed booking window.",
      ok: false,
    };
  }

  if (isAllDay === null) {
    return { error: "Choose a valid all-day value.", ok: false };
  }

  if (reason.length > BOOKING_REASON_MAX_LENGTH) {
    return {
      error: `Reason must be ${BOOKING_REASON_MAX_LENGTH} characters or fewer.`,
      ok: false,
    };
  }

  if (input.requireReason && reason.length === 0) {
    return { error: "Reason is required for this booking.", ok: false };
  }

  if (isAllDay) {
    if (input.timeLimitMinutes !== null) {
      return {
        error: "All-day bookings are not available when a time limit is set.",
        ok: false,
      };
    }

    const proposed = {
      end_time: ALL_DAY_END_TIME,
      is_all_day: true,
      start_time: ALL_DAY_START_TIME,
    };

    if (hasConfirmedBookingConflict(proposed, input.confirmedBookings)) {
      return {
        error: "This vehicle already has a confirmed booking during that time.",
        ok: false,
      };
    }

    return {
      ok: true,
      value: {
        date,
        end_time: ALL_DAY_END_TIME,
        is_all_day: true,
        reason: reason || null,
        start_time: ALL_DAY_START_TIME,
      },
    };
  }

  const startTime = input.startTime.trim();
  const endTime = input.endTime.trim();
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (!isThirtyMinuteTime(startTime) || !isThirtyMinuteTime(endTime)) {
    return {
      error: "Choose start and end times in 30-minute steps.",
      ok: false,
    };
  }

  if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
    return { error: "End time must be after start time.", ok: false };
  }

  if (
    date === input.today &&
    input.currentTimeMinutes !== undefined &&
    startMinutes < input.currentTimeMinutes
  ) {
    return { error: "Start time has already passed.", ok: false };
  }

  const durationMinutes = endMinutes - startMinutes;

  if (
    input.timeLimitMinutes !== null &&
    durationMinutes > input.timeLimitMinutes
  ) {
    return {
      error: `Booking duration must be ${input.timeLimitMinutes} minutes or fewer.`,
      ok: false,
    };
  }

  const proposed = {
    end_time: endTime,
    is_all_day: false,
    start_time: startTime,
  };

  if (hasConfirmedBookingConflict(proposed, input.confirmedBookings)) {
    return {
      error: "This vehicle already has a confirmed booking during that time.",
      ok: false,
    };
  }

  return {
    ok: true,
    value: {
      date,
      end_time: endTime,
      is_all_day: false,
      reason: reason || null,
      start_time: startTime,
    },
  };
}
