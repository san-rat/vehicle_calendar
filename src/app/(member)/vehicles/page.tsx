import Link from "next/link";
import { FloatingLogButton } from "@/components/FloatingLogButton";
import {
  getVehicleTypeLabel,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { requireCurrentAppUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type VehicleRecord = {
  id: string;
  is_active: boolean;
  name: string;
  type: VehicleType;
};

async function getActiveVehicles() {
  await requireCurrentAppUser();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, name, type, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load vehicles.");
  }

  return (data ?? []) as VehicleRecord[];
}

export default async function VehiclesPage() {
  const vehicles = await getActiveVehicles();

  return (
    <>
      <div className="space-y-6">
        <header>
          <p className="text-sm font-semibold text-[var(--primary)]">
            Fleet
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Vehicles</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Pick an active vehicle to open its calendar.
          </p>
        </header>

        {vehicles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
            No active vehicles are available yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <Link
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)]"
                href={`/vehicles/${vehicle.id}/calendar`}
                key={vehicle.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      {vehicle.name}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {getVehicleTypeLabel(vehicle.type)}
                    </p>
                  </div>
                  <span className="rounded-md bg-[var(--success)]/10 px-3 py-1 text-xs font-semibold text-green-700">
                    Active
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
                  <span className="rounded-md border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                    {getVehicleTypeLabel(vehicle.type)}
                  </span>
                  <span className="text-sm font-semibold text-[var(--primary)]">
                    Open Calendar
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <FloatingLogButton />
    </>
  );
}
