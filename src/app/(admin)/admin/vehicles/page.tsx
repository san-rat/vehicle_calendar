import { requireAdminAppUser } from "@/lib/auth/user";
import {
  Badge,
  BreadcrumbNav,
  Button,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  Panel,
  inputClassName,
} from "@/components/ui";
import { EmptyStateIcon, FleetIcon } from "@/components/ui/icons";
import {
  getVehicleTypeLabel,
  VEHICLE_TYPES,
  type VehicleType,
} from "@/lib/admin/vehicles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createVehicle, deleteVehicle, updateVehicle } from "./actions";

type AdminVehiclesPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

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

export default async function AdminVehiclesPage({
  searchParams,
}: AdminVehiclesPageProps) {
  const vehicles = await getVehicles();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusMessage =
    resolvedSearchParams.success ?? resolvedSearchParams.error ?? null;
  const statusTone = resolvedSearchParams.error ? "error" : "success";

  return (
    <div className="space-y-8">
      <BreadcrumbNav
        items={[
          { href: "/admin/settings", label: "Settings" },
          { label: "Vehicles" },
        ]}
      />
      <PageHeader
        description="Add vehicles, edit their type, and mark them inactive when they should not appear in booking flows. Hard delete is blocked once bookings exist."
        eyebrow="Settings"
        title="Admin Vehicles"
      />

      {statusMessage ? (
        <Notice tone={statusTone === "error" ? "danger" : "success"}>
          {statusMessage}
        </Notice>
      ) : null}

      <Panel>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
            <FleetIcon className="h-5 w-5" />
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
          <div>
            <h2 className="text-lg font-semibold">Vehicles</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Showing active and inactive vehicles.
            </p>
          </div>
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
          <div className="mt-4 space-y-4">
            {vehicles.map((vehicle) => (
              <Panel as="article" key={vehicle.id}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{vehicle.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {getVehicleTypeLabel(vehicle.type)}
                    </p>
                  </div>
                  <Badge tone={vehicle.is_active ? "success" : "neutral"}>
                    {vehicle.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <form
                  action={updateVehicle}
                  className="grid gap-4 md:grid-cols-[1fr_180px_160px_auto] md:items-end"
                >
                  <input name="id" type="hidden" value={vehicle.id} />
                  <Field htmlFor={`vehicle-name-${vehicle.id}`} label="Name">
                    <input
                      className={inputClass}
                      defaultValue={vehicle.name}
                      id={`vehicle-name-${vehicle.id}`}
                      maxLength={80}
                      minLength={2}
                      name="name"
                      required
                    />
                  </Field>

                  <Field htmlFor={`vehicle-type-${vehicle.id}`} label="Type">
                    <select
                      className={inputClass}
                      defaultValue={vehicle.type}
                      id={`vehicle-type-${vehicle.id}`}
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

                  <Field htmlFor={`vehicle-active-${vehicle.id}`} label="Status">
                    <select
                      className={inputClass}
                      defaultValue={String(vehicle.is_active)}
                      id={`vehicle-active-${vehicle.id}`}
                      name="is_active"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </Field>

                  <Button type="submit" tone="secondary">
                    Save
                  </Button>
                </form>

                <form
                  action={deleteVehicle}
                  className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-[1fr_auto] md:items-end"
                >
                  <input name="id" type="hidden" value={vehicle.id} />
                  <Field
                    htmlFor={`vehicle-delete-${vehicle.id}`}
                    label="Type vehicle name to hard delete"
                  >
                    <input
                      className={inputClass}
                      id={`vehicle-delete-${vehicle.id}`}
                      name="confirmation"
                      placeholder={vehicle.name}
                    />
                  </Field>
                  <Button type="submit" tone="danger">
                    Delete
                  </Button>
                </form>
              </Panel>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
