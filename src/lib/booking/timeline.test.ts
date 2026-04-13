import { describe, expect, it } from "vitest";
import {
  TIMELINE_SLOT_HEIGHT_PX,
  getTimedTimelineLayout,
  getTimelineBlockMetrics,
  getTimelineNowLineTopPx,
  shouldShowTimelineNowLine,
  splitTimelineBookings,
} from "./timeline";

describe("booking timeline helpers", () => {
  it("separates all-day and timed bookings", () => {
    const bookings = [
      { endTime: "23:59", id: "all-day", isAllDay: true, startTime: "00:00" },
      { endTime: "10:00", id: "timed", isAllDay: false, startTime: "09:00" },
    ];

    expect(splitTimelineBookings(bookings)).toEqual({
      allDayBookings: [bookings[0]],
      timedBookings: [bookings[1]],
    });
  });

  it("calculates top and height for time-scaled booking blocks", () => {
    expect(
      getTimelineBlockMetrics({
        endTime: "10:30",
        isAllDay: false,
        startTime: "09:00",
      })
    ).toEqual({
      endMinutes: 10 * 60 + 30,
      heightPx: TIMELINE_SLOT_HEIGHT_PX * 3,
      startMinutes: 9 * 60,
      topPx: TIMELINE_SLOT_HEIGHT_PX * 18,
    });
  });

  it("lays out overlapping bookings into side-by-side columns", () => {
    const layouts = getTimedTimelineLayout([
      { endTime: "10:00", id: "first", isAllDay: false, startTime: "09:00" },
      { endTime: "10:30", id: "second", isAllDay: false, startTime: "09:30" },
      { endTime: "11:00", id: "third", isAllDay: false, startTime: "10:00" },
    ]);

    expect(
      layouts.map((layout) => ({
        column: layout.column,
        id: layout.booking.id,
        totalColumns: layout.totalColumns,
      }))
    ).toEqual([
      { column: 0, id: "first", totalColumns: 2 },
      { column: 1, id: "second", totalColumns: 2 },
      { column: 0, id: "third", totalColumns: 2 },
    ]);
  });

  it("calculates the live now-line offset from the current minute", () => {
    expect(getTimelineNowLineTopPx(12 * 60 + 15)).toBe(1176);
  });

  it("shows the live now line only for today", () => {
    expect(shouldShowTimelineNowLine("2026-04-13", "2026-04-13")).toBe(true);
    expect(shouldShowTimelineNowLine("2026-04-14", "2026-04-13")).toBe(false);
  });
});
