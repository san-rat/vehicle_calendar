import { FloatingLogButton } from "@/components/FloatingLogButton";

type CalendarPageProps = {
  params: { vehicleId: string };
};

export default function VehicleCalendarPage({ params }: CalendarPageProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Vehicle Calendar</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Placeholder calendar for vehicle: {params.vehicleId}.
      </p>
      <FloatingLogButton />
    </>
  );
}
