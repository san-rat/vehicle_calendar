import { requireAdminAppUser } from "@/lib/auth/user";
import {
  Badge,
  BreadcrumbNav,
  Button,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  inputClassName,
} from "@/components/ui";
import { VehicleManagerList } from "@/components/admin/VehicleManagerList";
import { EmptyStateIcon, ManageIcon } from "@/components/ui/icons";
import {
  getVehicleTypeLabel,
  VEHICLE_TYPES,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createVehicle, deleteVehicle, updateVehicle } from "./actions";

type VehicleRecord = {
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
  type: VehicleType;
  updated_at: string;
};

const inputClass = inputClassName();

async function getVehicles() {
  await requireAdminAppUser();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, name, type, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load vehicles.");
  }

  return (data ?? []) as VehicleRecord[];
}

export default async function AdminVehiclesPage() {
  const vehicles = await getVehicles();

  return (
    <div className="space-y-8">
      <BreadcrumbNav
        items={[
          { href: "/admin/settings", label: "Settings" },
          { label: "Vehicles" },
        ]}
      />
      <PageHeader
        eyebrow="Settings"
        title="Admin Vehicles"
      />

      <Panel className="overflow-hidden border-white/70 bg-white/92">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)]">
            <ManageIcon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">Add Vehicle</h2>
        </div>
        <form
          action={createVehicle}
          className="mt-4 grid gap-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end"
        >
          <Field htmlFor="vehicle-create-name" label="Name">
            <input
              className={inputClass}
              id="vehicle-create-name"
              maxLength={80}
              minLength={2}
              name="name"
              placeholder="Pool Car 2"
              required
            />
          </Field>

          <Field htmlFor="vehicle-create-type" label="Type">
            <select
              className={inputClass}
              id="vehicle-create-type"
              name="type"
              required
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getVehicleTypeLabel(type)}
                </option>
              ))}
            </select>
          </Field>

          <Field htmlFor="vehicle-create-active" label="Status">
            <select
              className={inputClass}
              defaultValue="true"
              id="vehicle-create-active"
              name="is_active"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>

          <Button type="submit" tone="primary">
            Add Vehicle
          </Button>
        </form>
      </Panel>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Vehicles</h2>
          <Badge tone="neutral">
            {vehicles.length} total
          </Badge>
        </div>

        {vehicles.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              description="Add the first vehicle to make it available for booking."
              icon={EmptyStateIcon}
              title="No vehicles yet"
            />
          </div>
        ) : (
          <div className="mt-4">
            <VehicleManagerList
              deleteVehicleAction={deleteVehicle}
              updateVehicleAction={updateVehicle}
              vehicles={vehicles}
            />
          </div>
        )}
      </section>
    </div>
  );
}
