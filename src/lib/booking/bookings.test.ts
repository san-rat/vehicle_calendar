import { describe, expect, it } from "vitest";
import {
  ALL_DAY_END_TIME,
  ALL_DAY_START_TIME,
  getBookingStatusForFreedom,
  getBusinessTimeMinutes,
  getThirtyMinuteTimeOptions,
  hasConfirmedBookingConflict,
  normalizeDbTime,
  parseAllDayValue,
  parseTimeToMinutes,
  validateBookingInput,
} from "./bookings";

const baseInput = {
  allDay: null,
  confirmedBookings: [],
  currentTimeMinutes: 8 * 60,
  date: "2026-04-13",
  endTime: "10:00",
  maxDaysInFuture: 30,
  reason: "",
  requireReason: false,
  startTime: "09:00",
  timeLimitMinutes: null,
  today: "2026-04-12",
};

describe("booking helpers", () => {
  it("builds 30-minute time slot options", () => {
    const options = getThirtyMinuteTimeOptions();

    expect(options).toHaveLength(48);
    expect(options[0]).toBe("00:00");
    expect(options[1]).toBe("00:30");
    expect(options.at(-1)).toBe("23:30");
  });

  it("parses and normalizes time values", () => {
    expect(parseTimeToMinutes("09:30")).toBe(570);
    expect(parseTimeToMinutes("24:00")).toBeNull();
    expect(parseTimeToMinutes("09:15")).toBe(555);
    expect(normalizeDbTime("09:30:00")).toBe("09:30");
  });

  it("parses all-day form values explicitly", () => {
    expect(parseAllDayValue(null)).toBe(false);
    expect(parseAllDayValue("")).toBe(false);
    expect(parseAllDayValue("false")).toBe(false);
    expect(parseAllDayValue("on")).toBe(true);
    expect(parseAllDayValue("true")).toBe(true);
    expect(parseAllDayValue("yes")).toBeNull();
  });

  it("uses booking freedom to pick the created status", () => {
    expect(getBookingStatusForFreedom(true)).toBe("confirmed");
    expect(getBookingStatusForFreedom(false)).toBe("requested");
  });

  it("resolves the business time in Asia/Colombo", () => {
    expect(getBusinessTimeMinutes(new Date("2026-04-12T03:30:00.000Z"))).toBe(
      9 * 60
    );
  });

  it("accepts a valid normal booking", () => {
    expect(validateBookingInput(baseInput)).toEqual({
      ok: true,
      value: {
        date: "2026-04-13",
        end_time: "10:00",
        is_all_day: false,
        reason: null,
        start_time: "09:00",
      },
    });
  });

  it("enforces 30-minute slots and start-before-end", () => {
    expect(
      validateBookingInput({
        ...baseInput,
        startTime: "09:15",
      })
    ).toEqual({
      error: "Choose start and end times in 30-minute steps.",
      ok: false,
    });

    expect(
      validateBookingInput({
        ...baseInput,
        endTime: "09:00",
      })
    ).toEqual({
      error: "End time must be after start time.",
      ok: false,
    });
  });

  it("rejects dates outside the inclusive booking window", () => {
    expect(
      validateBookingInput({
        ...baseInput,
        date: "2026-04-11",
      })
    ).toEqual({
      error: "Choose a date inside the allowed booking window.",
      ok: false,
    });

    expect(
      validateBookingInput({
        ...baseInput,
        date: "2026-05-13",
      })
    ).toEqual({
      error: "Choose a date inside the allowed booking window.",
      ok: false,
    });
  });

  it("rejects same-day start times that have already passed", () => {
    expect(
      validateBookingInput({
        ...baseInput,
        currentTimeMinutes: 10 * 60,
        date: "2026-04-12",
        startTime: "09:30",
        today: "2026-04-12",
      })
    ).toEqual({
      error: "Start time has already passed.",
      ok: false,
    });
  });

  it("requires and limits booking reasons", () => {
    expect(
      validateBookingInput({
        ...baseInput,
        requireReason: true,
      })
    ).toEqual({
      error: "Reason is required for this booking.",
      ok: false,
    });

    expect(
      validateBookingInput({
        ...baseInput,
        reason: "A".repeat(501),
      })
    ).toEqual({
      error: "Reason must be 500 characters or fewer.",
      ok: false,
    });
  });

  it("normalizes valid all-day bookings and rejects them when a time limit exists", () => {
    expect(
      validateBookingInput({
        ...baseInput,
        allDay: "true",
        endTime: "",
        startTime: "",
      })
    ).toEqual({
      ok: true,
      value: {
        date: "2026-04-13",
        end_time: ALL_DAY_END_TIME,
        is_all_day: true,
        reason: null,
        start_time: ALL_DAY_START_TIME,
      },
    });

    expect(
      validateBookingInput({
        ...baseInput,
        allDay: "true",
        timeLimitMinutes: 120,
      })
    ).toEqual({
      error: "All-day bookings are not available when a time limit is set.",
      ok: false,
    });
  });

  it("enforces maximum booking duration", () => {
    expect(
      validateBookingInput({
        ...baseInput,
        endTime: "12:00",
        timeLimitMinutes: 120,
      })
    ).toEqual({
      error: "Booking duration must be 120 minutes or fewer.",
      ok: false,
    });
  });

  it("allows adjacent confirmed bookings and rejects overlaps", () => {
    const confirmedBookings = [
      {
        end_time: "10:00:00",
        is_all_day: false,
        start_time: "09:00:00",
      },
    ];

    expect(
      hasConfirmedBookingConflict(
        {
          end_time: "11:00",
          is_all_day: false,
          start_time: "10:00",
        },
        confirmedBookings
      )
    ).toBe(false);

    expect(
      hasConfirmedBookingConflict(
        {
          end_time: "10:30",
          is_all_day: false,
          start_time: "09:30",
        },
        confirmedBookings
      )
    ).toBe(true);
  });

  it("does not treat requested bookings as blockers when they are not passed in", () => {
    expect(
      validateBookingInput({
        ...baseInput,
        confirmedBookings: [],
      })
    ).toMatchObject({ ok: true });
  });
});
