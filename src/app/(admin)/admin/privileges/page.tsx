import { requireAdminAppUser } from "@/lib/auth/user";
import {
  Badge,
  BreadcrumbNav,
  Button,
  Field,
  PageHeader,
  Panel,
  StatCard,
  inputClassName,
} from "@/components/ui";
import { SettingsIcon } from "@/components/ui/icons";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updatePrivileges } from "./actions";

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

function getPrivilegePreview(config: PrivilegeConfigRecord) {
  const approval = config.allow_booking_freedom
    ? "Bookings auto-confirm."
    : "Bookings require approval.";
  const windowLabel = `Members can book up to ${config.max_days_in_future} days ahead.`;
  const reason = config.require_reason
    ? "Reason required."
    : "Reason optional.";
  const duration =
    config.time_limit_minutes === null
      ? "All-day allowed."
      : `${config.time_limit_minutes}-minute limit.`;

  return `${approval} ${windowLabel} ${reason} ${duration}`;
}

export default async function AdminPrivilegesPage() {
  const config = await getPrivilegeConfig();

  return (
    <div className="page-stack">
      <BreadcrumbNav
        items={[
          { href: "/admin/settings", label: "Settings" },
          { label: "Privileges" },
        ]}
      />

      <PageHeader
        action={<Badge tone="primary">Global policy</Badge>}
        eyebrow="Settings"
        meta={
          <>
            <Badge tone={config.allow_booking_freedom ? "success" : "warning"}>
              {config.allow_booking_freedom ? "Auto-confirm" : "Approval required"}
            </Badge>
            <Badge tone="neutral">
              Window: {config.max_days_in_future} days
            </Badge>
          </>
        }
        title="Booking Privileges"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={SettingsIcon}
          label="Booking freedom"
          tone={config.allow_booking_freedom ? "success" : "warning"}
          value={config.allow_booking_freedom ? "Auto-confirm" : "Approval"}
        />
        <StatCard
          icon={SettingsIcon}
          label="Time limit"
          tone="info"
          value={getTimeLimitSummary(config.time_limit_minutes)}
        />
        <StatCard
          icon={SettingsIcon}
          label="Future window"
          tone="primary"
          value={`${config.max_days_in_future} days`}
        />
        <StatCard
          icon={SettingsIcon}
          label="Reason"
          tone="neutral"
          value={config.require_reason ? "Required" : "Optional"}
        />
      </section>

      <Panel className="overflow-hidden" variant="elevated">
        <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-600)]">
                <SettingsIcon className="h-5 w-5" />
              </span>
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                Update privileges
              </h2>
            </div>
          </div>
          <Badge tone="secondary">Global scope</Badge>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <form action={updatePrivileges} className="grid gap-4 md:grid-cols-2">
            <input name="id" type="hidden" value={config.id} />

            <Field htmlFor="allow-booking-freedom" label="Booking freedom">
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

            <Field htmlFor="require-reason" label="Reason requirement">
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

            <Field htmlFor="time-limit-minutes" label="Time limit">
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

            <Field htmlFor="max-days-in-future" label="Future booking window">
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
              <Button size="lg" type="submit" tone="primary">
                Save privileges
              </Button>
            </div>
          </form>

          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-600)]">
              Live preview
            </p>
            <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              Policy preview
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              {getPrivilegePreview(config)}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
