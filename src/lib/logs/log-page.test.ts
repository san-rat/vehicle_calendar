import { describe, expect, it } from "vitest";
import {
  formatLogActionTime,
  getLogActionLabel,
  getLogColorDotClass,
  getLogPageNumber,
  getLogPaginationWindow,
  getLogRetentionCutoffIso,
  getLogTargetSummary,
  getSafeLogColor,
} from "./log-page";

describe("log page helpers", () => {
  it("labels known and unknown action types", () => {
    expect(getLogActionLabel("booking_confirmed")).toBe("Booking confirmed");
    expect(getLogActionLabel("member_role_changed")).toBe(
      "Member role changed"
    );
    expect(getLogActionLabel("custom_action")).toBe("Custom Action");
  });

  it("formats action times in Asia/Colombo", () => {
    expect(formatLogActionTime("2026-04-11T18:30:00.000Z")).toBe(
      "Apr 12, 2026, 00:00 Asia/Colombo"
    );
  });

  it("builds the 30-day retention cutoff from created_at", () => {
    expect(
      getLogRetentionCutoffIso(new Date("2026-04-12T00:00:00.000Z"))
    ).toBe("2026-03-13T00:00:00.000Z");
  });

  it("normalizes pagination params and builds Supabase ranges", () => {
    expect(getLogPageNumber(undefined)).toBe(1);
    expect(getLogPageNumber("0")).toBe(1);
    expect(getLogPageNumber("2.5")).toBe(1);
    expect(getLogPageNumber(["3"])).toBe(3);
    expect(getLogPaginationWindow(3)).toEqual({
      from: 100,
      page: 3,
      to: 149,
    });
  });

  it("uses safe color fallbacks", () => {
    expect(getSafeLogColor("#10B981")).toBe("#10B981");
    expect(getSafeLogColor("green")).toBe("#3B82F6");
    expect(getSafeLogColor(null)).toBe("#3B82F6");
    expect(getLogColorDotClass("#10B981")).toBe("bg-[#10B981]");
    expect(getLogColorDotClass("green")).toBe("bg-[#3B82F6]");
  });

  it("summarizes targets with readable fallbacks", () => {
    expect(
      getLogTargetSummary({
        actionType: "booking_confirmed",
        bookingId: "12345678-1111-2222-3333-444444444444",
        targetUser: { name: "Mina" },
        targetVehicle: { name: "Pool Car" },
      })
    ).toBe("Member: Mina | Vehicle: Pool Car | Booking: 12345678");

    expect(
      getLogTargetSummary({
        actionType: "vehicle_deleted",
        snapshot: { before: { name: "Old Van" } },
      })
    ).toBe("Vehicle: Old Van");

    expect(getLogTargetSummary({ actionType: "privilege_updated" })).toBe(
      "Booking privileges"
    );
  });
});
