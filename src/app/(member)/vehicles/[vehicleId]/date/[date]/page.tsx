import { FloatingLogButton } from "@/components/FloatingLogButton";

type BookingPageProps = {
  params: { vehicleId: string; date: string };
};

export default function BookingPage({ params }: BookingPageProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Booking</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Placeholder booking screen for vehicle {params.vehicleId} on {params.date}.
      </p>
      <FloatingLogButton />
    </>
  );
}
