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

  return (
    <div className="space-y-8">
      <BreadcrumbNav
        items={[
          { href: "/admin/settings", label: "Settings" },
          { label: "Members" },
        ]}
      />
      <PageHeader
        eyebrow="Settings"
        title="Admin Members"
      />

      <Panel className="overflow-hidden border-white/70 bg-white/92">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)]">
            <UserIcon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold">Add Member</h2>
        </div>
        <form
          action={createMember}
          className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_170px_150px_1fr_1fr_auto] lg:items-end"
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
              placeholder="Minimum 8 characters"
              required
              type="password"
            />
          </Field>

          <Field
            htmlFor="member-create-password-confirmation"
            label="Confirm Password"
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

          <Button type="submit" tone="primary">
            Add Member
          </Button>
        </form>
      </Panel>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Members</h2>
          <Badge tone="neutral">
            {members.length} total
          </Badge>
        </div>

        {members.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              description="Add the first member to give someone access to FleetTime."
              icon={EmptyStateIcon}
              title="No members yet"
            />
          </div>
        ) : (
          <div className="mt-4">
            <MemberManagerList
              currentUserId={currentUser.id}
              deleteMemberAction={deleteMember}
              members={members}
              resetMemberPasswordAction={resetMemberPassword}
              updateMemberAction={updateMember}
            />
          </div>
        )}
      </section>
    </div>
  );
}
