import {
  getMemberRoleLabel,
  MEMBER_ROLES,
  type MemberRole,
} from "@/lib/admin/members";
import { requireAdminAppUser } from "@/lib/auth/user";
import {
  Badge,
  BreadcrumbNav,
  Button,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatCard,
  inputClassName,
} from "@/components/ui";
import { MemberManagerList } from "@/components/admin/MemberManagerList";
import { EmptyStateIcon, UserIcon } from "@/components/ui/icons";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createMember,
  deleteMember,
  resetMemberPassword,
  updateMember,
} from "./actions";

type MemberRecord = {
  color_hex: string;
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
  role: MemberRole;
  updated_at: string;
};

const inputClass = inputClassName();

async function getMembers() {
  const currentUser = await requireAdminAppUser();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, color_hex, is_active, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load members.");
  }

  return {
    currentUser,
    members: (data ?? []) as MemberRecord[],
  };
}

export default async function AdminMembersPage() {
  const { currentUser, members } = await getMembers();
  const activeMembers = members.filter((member) => member.is_active).length;
  const superAdmins = members.filter(
    (member) => member.role === "super_admin"
  ).length;

  return (
    <div className="page-stack">
      <BreadcrumbNav
        items={[
          { href: "/admin/settings", label: "Settings" },
          { label: "Members" },
        ]}
      />
      <PageHeader
        action={<Badge tone="primary">Access management</Badge>}
        eyebrow="Settings"
        title="Admin Members"
      />

      <section className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UserIcon}
          label="Active members"
          tone="primary"
          value={activeMembers}
        />
        <StatCard
          icon={UserIcon}
          label="Total members"
          tone="neutral"
          value={members.length}
        />
        <StatCard
          icon={UserIcon}
          label="Super admins"
          tone="info"
          value={superAdmins}
        />
        <StatCard
          icon={UserIcon}
          label="Current user"
          tone="success"
          value={currentUser.name}
        />
      </section>

      <Panel className="overflow-hidden" variant="elevated">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4 md:pb-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-600)]">
            <UserIcon className="h-5 w-5" />
          </span>
          <h2 className="text-[1.4rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Add member
          </h2>
        </div>
        <form
          action={createMember}
          className="mt-4 grid gap-3 md:mt-5 md:gap-4 md:grid-cols-2 xl:grid-cols-[1fr_170px_150px_1fr_1fr_auto] xl:items-end"
        >
          <Field htmlFor="member-create-name" label="Name">
            <input
              className={inputClass}
              id="member-create-name"
              maxLength={60}
              minLength={2}
              name="name"
              placeholder="New Member"
              required
            />
          </Field>

          <Field htmlFor="member-create-role" label="Role">
            <select
              className={inputClass}
              id="member-create-role"
              name="role"
              required
            >
              {MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {getMemberRoleLabel(role)}
                </option>
              ))}
            </select>
          </Field>

          <Field htmlFor="member-create-active" label="Status">
            <select
              className={inputClass}
              defaultValue="true"
              id="member-create-active"
              name="is_active"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>

          <Field htmlFor="member-create-password" label="Password">
            <input
              className={inputClass}
              id="member-create-password"
              minLength={8}
              name="password"
              placeholder="Min 8 characters"
              required
              type="password"
            />
          </Field>

          <Field
            htmlFor="member-create-password-confirmation"
            label="Confirm password"
          >
            <input
              className={inputClass}
              id="member-create-password-confirmation"
              minLength={8}
              name="password_confirmation"
              placeholder="Repeat password"
              required
              type="password"
            />
          </Field>

          <Button className="w-full md:w-auto" type="submit" tone="primary">
            Add member
          </Button>
        </form>
      </Panel>

      <section className="page-section">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Member directory
          </h2>
          <Badge tone="neutral">{members.length} total</Badge>
        </div>

        {members.length === 0 ? (
          <EmptyState
            description="Add the first member to give someone access to FleetTime."
            icon={EmptyStateIcon}
            title="No members yet"
          />
        ) : (
          <MemberManagerList
            currentUserId={currentUser.id}
            deleteMemberAction={deleteMember}
            members={members}
            resetMemberPasswordAction={resetMemberPassword}
            updateMemberAction={updateMember}
          />
        )}
      </section>
    </div>
  );
}
