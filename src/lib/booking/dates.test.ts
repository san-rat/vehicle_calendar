import { describe, expect, it } from "vitest";
import {
  addDays,
  getBusinessToday,
  getCalendarMonth,
  isDateWithinBookingWindow,
  parseIsoDate,
  parseMonthValue,
  resolveCalendarMonth,
} from "./dates";

describe("booking date helpers", () => {
  it("resolves the business date in Asia/Colombo", () => {
    expect(getBusinessToday(new Date("2026-04-11T19:00:00.000Z"))).toBe(
      "2026-04-12"
    );
  });

  it("parses and rejects ISO dates strictly", () => {
    expect(parseIsoDate("2026-04-12")).toEqual({
      day: 12,
      month: 4,
      year: 2026,
    });
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("2026-4-12")).toBeNull();
  });

  it("parses and rejects calendar month values strictly", () => {
    expect(parseMonthValue("2026-04")).toEqual({ month: 4, year: 2026 });
    expect(parseMonthValue("2026-13")).toBeNull();
    expect(parseMonthValue("26-04")).toBeNull();
  });

  it("builds month ranges, navigation values, and grid offsets", () => {
    const month = getCalendarMonth("2026-04");

    expect(month).toMatchObject({
      endDate: "2026-04-30",
      firstWeekday: 3,
      label: "April 2026",
      nextMonth: "2026-05",
      prevMonth: "2026-03",
      startDate: "2026-04-01",
      value: "2026-04",
    });
    expect(month?.days).toHaveLength(30);
  });

  it("handles leap year month lengths", () => {
    expect(getCalendarMonth("2024-02")?.endDate).toBe("2024-02-29");
    expect(getCalendarMonth("2026-02")?.endDate).toBe("2026-02-28");
  });

  it("defaults missing month params to the current business month", () => {
    expect(resolveCalendarMonth(undefined, "2026-04-12")?.value).toBe(
      "2026-04"
    );
    expect(resolveCalendarMonth(" ", "2026-04-12")?.value).toBe("2026-04");
    expect(resolveCalendarMonth("bad-month", "2026-04-12")).toBeNull();
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-04-30", 1)).toBe("2026-05-01");
    expect(addDays("2026-04-01", -1)).toBe("2026-03-31");
  });

  it("enforces inclusive future booking windows", () => {
    expect(
      isDateWithinBookingWindow({
        date: "2026-04-12",
        maxDaysInFuture: 0,
        today: "2026-04-12",
      })
    ).toBe(true);
    expect(
      isDateWithinBookingWindow({
        date: "2026-04-13",
        maxDaysInFuture: 0,
        today: "2026-04-12",
      })
    ).toBe(false);
    expect(
      isDateWithinBookingWindow({
        date: "2026-05-12",
        maxDaysInFuture: 30,
        today: "2026-04-12",
      })
    ).toBe(true);
    expect(
      isDateWithinBookingWindow({
        date: "2026-05-13",
        maxDaysInFuture: 30,
        today: "2026-04-12",
      })
    ).toBe(false);
    expect(
      isDateWithinBookingWindow({
        date: "2026-04-11",
        maxDaysInFuture: 30,
        today: "2026-04-12",
      })
    ).toBe(false);
  });
});
