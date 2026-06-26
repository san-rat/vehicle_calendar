import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CalendarWorkspace, type CalendarDaySummary } from "./CalendarWorkspace";

const days: CalendarDaySummary[] = [
  {
    bookings: [],
    date: "2026-04-11",
    isBookable: false,
    isToday: false,
  },
  {
    bookings: [
      {
        colorHex: "#3B82F6",
        date: "2026-04-12",
        endTime: "10:00:00",
        id: "booking-1",
        isAllDay: false,
        startTime: "09:00:00",
        status: "confirmed",
        userName: "Alex",
      },
      {
        colorHex: "#10B981",
        date: "2026-04-12",
        endTime: "23:59:00",
        id: "booking-2",
        isAllDay: true,
        startTime: "00:00:00",
        status: "requested",
        userName: "Bea",
      },
    ],
    date: "2026-04-12",
    isBookable: true,
    isToday: true,
  },
  {
    bookings: [],
    date: "2026-04-13",
    isBookable: true,
    isToday: false,
  },
];

describe("CalendarWorkspace", () => {
  it("selects today by default and disables non-bookable dates", () => {
    render(
      <CalendarWorkspace
        days={days}
        firstWeekday={0}
        monthLabel="April 2026"
        nextMonthHref="/next"
        prevMonthHref="/prev"
        vehicleId="vehicle-1"
      />
    );

    expect(
      screen.getByRole("button", { name: "Show bookings for 2026-04-11" })
    ).toBeDisabled();
    expect(screen.getByText("April 12, 2026")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("09:00 - 10:00")).toBeInTheDocument();
    expect(screen.getByText("Bea")).toBeInTheDocument();
    expect(screen.getByText("All day")).toBeInTheDocument();
  });

  it("updates the detail panel when a bookable date is selected", async () => {
    const user = userEvent.setup();
    render(
      <CalendarWorkspace
        days={days}
        firstWeekday={0}
        monthLabel="April 2026"
        nextMonthHref="/next"
        prevMonthHref="/prev"
        vehicleId="vehicle-1"
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Show bookings for 2026-04-13" })
    );

    expect(screen.getByText("April 13, 2026")).toBeInTheDocument();
    expect(screen.getByText("Apr 13 is open for booking.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New booking" })).toHaveAttribute(
      "href",
      "/vehicles/vehicle-1/date/2026-04-13"
    );
  });
});
