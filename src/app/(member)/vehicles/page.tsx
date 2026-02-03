import { FloatingLogButton } from "@/components/FloatingLogButton";

export default function VehiclesPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Vehicles</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Browse vehicles and pick one to schedule.
      </p>
      <FloatingLogButton />
    </>
  );
}
