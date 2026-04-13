import { describe, expect, it } from "vitest";
import {
  formatLogActionTime,
  formatRelativeLogTime,
  getLogActionLabel,
  getLogActionTone,
  getLogBookingStatus,
  getLogColorDotClass,
  getLogPageNumber,
  getLogPaginationWindow,
  getLogRetentionCutoffIso,
  getLogSearchPattern,
  getSafeLogColor,
  normalizeLogQuery,
} from "./log-page";

describe("log page helpers", () => {
  it("labels known and unknown action types", () => {
    expect(getLogActionLabel("booking_confirmed")).toBe("Booking confirmed");
    expect(getLogActionLabel("member_role_changed")).toBe(
      "Member role changed"
    );
    expect(getLogActionLabel("custom_action")).toBe("Custom Action");
  });

  it("maps action types to badge tones", () => {
    expect(getLogActionTone("booking_confirmed")).toBe("success");
    expect(getLogActionTone("booking_overridden")).toBe("warning");
    expect(getLogActionTone("booking_rejected")).toBe("danger");
    expect(getLogActionTone("vehicle_updated")).toBe("info");
    expect(getLogActionTone("custom_action")).toBe("primary");
  });

  it("maps booking log actions to booking statuses", () => {
    expect(getLogBookingStatus("booking_confirmed")).toBe("confirmed");
    expect(getLogBookingStatus("booking_requested")).toBe("requested");
    expect(getLogBookingStatus("booking_rejected")).toBe("rejected");
    expect(getLogBookingStatus("booking_overridden")).toBe("overridden");
    expect(getLogBookingStatus("vehicle_updated")).toBeNull();
  });

  it("formats action times in Asia/Colombo", () => {
    expect(formatLogActionTime("2026-04-11T18:30:00.000Z")).toBe(
      "Apr 12, 2026, 00:00 Asia/Colombo"
    );
  });

  it("formats recent actions with relative time labels", () => {
    expect(
      formatRelativeLogTime(
        "2026-04-12T23:59:40.000Z",
        new Date("2026-04-13T00:00:00.000Z")
      )
    ).toBe("Just now");

    expect(
      formatRelativeLogTime(
        "2026-04-12T22:00:00.000Z",
        new Date("2026-04-13T00:00:00.000Z")
      )
    ).toBe("2 hours ago");
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

  it("normalizes log search params and builds ilike patterns", () => {
    expect(normalizeLogQuery("  member   updated  ")).toBe("member updated");
    expect(normalizeLogQuery(undefined)).toBe("");
    expect(getLogSearchPattern("vehicle, deleted")).toBe("%vehicle  deleted%");
    expect(getLogSearchPattern("   ")).toBeNull();
  });

  it("uses safe color fallbacks", () => {
    expect(getSafeLogColor("#10B981")).toBe("#10B981");
    expect(getSafeLogColor("green")).toBe("#3B82F6");
    expect(getSafeLogColor(null)).toBe("#3B82F6");
    expect(getLogColorDotClass("#10B981")).toBe("bg-[#10B981]");
    expect(getLogColorDotClass("green")).toBe("bg-[#3B82F6]");
  });
});
