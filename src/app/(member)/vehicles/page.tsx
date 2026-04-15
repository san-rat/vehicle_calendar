import Link from "next/link";
import {
  Badge,
  EmptyState,
  PageHeader,
  interactiveCardClassName,
} from "@/components/ui";
import { EmptyStateIcon, ManageIcon } from "@/components/ui/icons";
import {
  getVehicleTypeLabel,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { requireCurrentAppUser } from "@/lib/auth/user";
import { getBusinessHour } from "@/lib/booking/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type VehicleRecord = {
  id: string;
  is_active: boolean;
  name: string;
  type: VehicleType;
};

function getGreetingLabel(hour: number, name: string) {
  if (hour < 12) {
    return `Good morning, ${name}`;
  }

  if (hour < 17) {
    return `Good afternoon, ${name}`;
  }

  return `Good evening, ${name}`;
}

async function getActiveVehicles() {
  const currentUser = await requireCurrentAppUser();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, name, type, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load vehicles.");
  }

  return {
    currentUser,
    vehicles: (data ?? []) as VehicleRecord[],
  };
}

export default async function VehiclesPage() {
  const { currentUser, vehicles } = await getActiveVehicles();
  const greetingLabel = getGreetingLabel(getBusinessHour(), currentUser.name);

  return (
    <div className="space-y-6">
      <PageHeader title={greetingLabel} />

      {vehicles.length === 0 ? (
        <EmptyState
          description="No active vehicles are available yet. Ask an admin to add or activate a vehicle."
          icon={EmptyStateIcon}
          title="No vehicles ready"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link
              className={interactiveCardClassName("overflow-hidden")}
              href={`/vehicles/${vehicle.id}/calendar`}
              key={vehicle.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)]">
                    <ManageIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      {vehicle.name}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {getVehicleTypeLabel(vehicle.type)}
                    </p>
                  </div>
                </div>
                <Badge tone="success">Active</Badge>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--border)]/80 pt-4">
                <span className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--primary)]">
                  Open calendar
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
