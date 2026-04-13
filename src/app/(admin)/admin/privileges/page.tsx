import { requireAdminAppUser } from "@/lib/auth/user";
import {
  Badge,
  Button,
  Field,
  Notice,
  PageHeader,
  Panel,
  inputClassName,
} from "@/components/ui";
import { SettingsIcon } from "@/components/ui/icons";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updatePrivileges } from "./actions";

type AdminPrivilegesPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

type PrivilegeConfigRecord = {
  allow_booking_freedom: boolean;
  created_at: string;
  id: string;
  max_days_in_future: number;
  require_reason: boolean;
  time_limit_minutes: number | null;
  updated_at: string;
};

const inputClass = inputClassName();

async function getPrivilegeConfig() {
  await requireAdminAppUser();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("privilege_config")
    .select(
      "id, time_limit_minutes, allow_booking_freedom, max_days_in_future, require_reason, created_at, updated_at"
    )
    .maybeSingle<PrivilegeConfigRecord>();

  if (error || !data) {
    throw new Error("Privilege configuration is missing. Run the seed file.");
  }

  return data;
}

function getTimeLimitSummary(minutes: number | null) {
  return minutes === null ? "No time limit" : `${minutes} minutes`;
}

export default async function AdminPrivilegesPage({
  searchParams,
}: AdminPrivilegesPageProps) {
  const config = await getPrivilegeConfig();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusMessage =
    resolvedSearchParams.success ?? resolvedSearchParams.error ?? null;
  const statusTone = resolvedSearchParams.error ? "error" : "success";

  return (
    <div className="space-y-8">
      <PageHeader
        description="Control whether bookings are confirmed immediately, how far ahead members can book, whether reasons are required, and whether a time limit disables all-day bookings."
        eyebrow="Settings"
        title="Admin Privileges"
      />

      {statusMessage ? (
        <Notice tone={statusTone === "error" ? "danger" : "success"}>
          {statusMessage}
        </Notice>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Panel as="div">
          <p className="text-sm font-medium text-[var(--muted)]">
            Booking Freedom
          </p>
          <p className="mt-2 text-lg font-semibold">
            {config.allow_booking_freedom ? "Auto-confirm" : "Requires approval"}
          </p>
        </Panel>
        <Panel as="div">
          <p className="text-sm font-medium text-[var(--muted)]">Time Limit</p>
          <p className="mt-2 text-lg font-semibold">
            {getTimeLimitSummary(config.time_limit_minutes)}
          </p>
        </Panel>
        <Panel as="div">
          <p className="text-sm font-medium text-[var(--muted)]">
            Future Window
          </p>
          <p className="mt-2 text-lg font-semibold">
            {config.max_days_in_future} days
          </p>
        </Panel>
        <Panel as="div">
          <p className="text-sm font-medium text-[var(--muted)]">Reason</p>
          <p className="mt-2 text-lg font-semibold">
            {config.require_reason ? "Required" : "Optional"}
          </p>
        </Panel>
      </section>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <SettingsIcon className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold">Update Privileges</h2>
          </div>
          <Badge tone="neutral">Global</Badge>
        </div>
        <form action={updatePrivileges} className="mt-4 grid gap-4 md:grid-cols-2">
          <input name="id" type="hidden" value={config.id} />

          <Field htmlFor="allow-booking-freedom" label="Booking Freedom">
            <select
              className={inputClass}
              defaultValue={String(config.allow_booking_freedom)}
              id="allow-booking-freedom"
              name="allow_booking_freedom"
            >
              <option value="true">Auto-confirm bookings</option>
              <option value="false">Require admin approval</option>
            </select>
          </Field>

          <Field htmlFor="require-reason" label="Require Reason">
            <select
              className={inputClass}
              defaultValue={String(config.require_reason)}
              id="require-reason"
              name="require_reason"
            >
              <option value="true">Reason required</option>
              <option value="false">Reason optional</option>
            </select>
          </Field>

          <Field
            hint="Leave blank to allow all-day bookings."
            htmlFor="time-limit-minutes"
            label="Time Limit Minutes"
          >
            <input
              className={inputClass}
              defaultValue={config.time_limit_minutes ?? ""}
              id="time-limit-minutes"
              max={1440}
              min={1}
              name="time_limit_minutes"
              placeholder="No limit"
              type="number"
            />
          </Field>

          <Field
            hint="Use 0 to allow bookings only for today."
            htmlFor="max-days-in-future"
            label="Future Booking Window"
          >
            <input
              className={inputClass}
              defaultValue={config.max_days_in_future}
              id="max-days-in-future"
              max={365}
              min={0}
              name="max_days_in_future"
              required
              type="number"
            />
          </Field>

          <div className="md:col-span-2">
            <Button type="submit" tone="primary">
              Save Privileges
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
