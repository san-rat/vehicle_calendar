import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookingWorkspace, type TimelineBooking } from "./BookingWorkspace";

const timeOptions = ["09:00", "09:30", "10:00", "10:30", "11:00"];

const bookings: TimelineBooking[] = [
  {
    colorHex: "#3B82F6",
    endTime: "10:00:00",
    id: "booking-1",
    isAllDay: false,
    reason: "School run",
    startTime: "09:00:00",
    status: "confirmed",
    userId: "user-1",
    userName: "Alex",
  },
];

function renderWorkspace(overrides = {}) {
  return render(
    <BookingWorkspace
      allDayDisabled={false}
      bookingModeLabel="Auto-confirm"
      bookings={bookings}
      cancelAction={vi.fn()}
      currentTimeMinutes={8 * 60}
      currentUserId="user-1"
      currentUserRole="member"
      formAction={vi.fn()}
      formDisabledMessage={null}
      policySummary="30 day booking window"
      reasonRequired={false}
      selectedDate="2026-04-13"
      selectedDateLabel="April 13, 2026"
      submitLabel="Book Trip"
      timeLimitMinutes={120}
      timeOptions={timeOptions}
      today="2026-04-12"
      vehicleLabel="Pool Car"
      {...overrides}
    />
  );
}

describe("BookingWorkspace", () => {
  it("shows existing timeline bookings and booking policy summary", () => {
    renderWorkspace();

    expect(screen.getAllByText("Alex")[0]).toBeInTheDocument();
    expect(screen.getByText("School run")).toBeInTheDocument();
    expect(screen.getByText("Pool Car")).toBeInTheDocument();
    expect(screen.getByText("30 day booking window")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("reports clear, invalid, and conflicting selected time windows", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: "Booking form" }));
    await user.selectOptions(screen.getByLabelText("Start time"), "10:00");
    await user.selectOptions(screen.getByLabelText("End time"), "11:00");
    expect(screen.getByText("This time is currently clear.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("End time"), "09:30");
    expect(screen.getByText("End time must be after start time.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book Trip" })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("Start time"), "09:30");
    await user.selectOptions(screen.getByLabelText("End time"), "10:30");
    expect(screen.getByText("This time overlaps a confirmed booking.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book Trip" })).toBeDisabled();
  });

  it("disables the form when the date cannot be booked", () => {
    renderWorkspace({ formDisabledMessage: "This date is outside the booking window." });

    expect(
      screen.getByText("This date is outside the booking window.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Start time")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Book Trip" })).toBeDisabled();
  });
});
