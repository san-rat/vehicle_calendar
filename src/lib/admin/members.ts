export const MEMBER_ROLES = ["member", "super_admin"] as const;

export const USER_COLOR_PALETTE = [
  "#3B82F6",
  "#10B981",
  "#6366F1",
  "#F97316",
  "#EC4899",
  "#14B8A6",
] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export type ValidMemberCreateInput = {
  color_hex: string;
  is_active: boolean;
  name: string;
  password: string;
  role: MemberRole;
};

export type ValidMemberUpdateInput = {
  is_active: boolean;
  name: string;
  role: MemberRole;
};

export type ValidPasswordResetInput = {
  password: string;
};

export type MemberValidationResult<T> =
  | { ok: true; value: T }
  | { error: string; ok: false };

const memberRoleLabels: Record<MemberRole, string> = {
  member: "Member",
  super_admin: "Super Admin",
};

function normalizeHiddenEmailPart(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "member";
}

export function isMemberRole(value: string): value is MemberRole {
  return MEMBER_ROLES.includes(value as MemberRole);
}

export function getMemberRoleLabel(role: MemberRole) {
  return memberRoleLabels[role];
}

export function parseMemberActiveState(value: string | boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

export function buildInternalMemberEmail(name: string, uniqueSuffix: string) {
  const localName = normalizeHiddenEmailPart(name);
  const suffix = normalizeHiddenEmailPart(uniqueSuffix).slice(0, 48);

  return `${localName}--${suffix}@auth.fleettime.local`;
}

export function getNextUserColor(existingColors: string[]) {
  const usageByColor = new Map<string, number>();

  USER_COLOR_PALETTE.forEach((color) => {
    usageByColor.set(color, 0);
  });

  existingColors.forEach((color) => {
    if (usageByColor.has(color)) {
      usageByColor.set(color, (usageByColor.get(color) ?? 0) + 1);
    }
  });

  return USER_COLOR_PALETTE.reduce((bestColor, color) => {
    const bestCount = usageByColor.get(bestColor) ?? 0;
    const colorCount = usageByColor.get(color) ?? 0;

    return colorCount < bestCount ? color : bestColor;
  }, USER_COLOR_PALETTE[0]);
}

function validateMemberName(name: string) {
  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { error: "Member name must be at least 2 characters.", ok: false } as const;
  }

  if (trimmedName.length > 60) {
    return { error: "Member name must be 60 characters or fewer.", ok: false } as const;
  }

  if (!/^[A-Za-z0-9 _-]+$/.test(trimmedName)) {
    return {
      error: "Member name can use letters, numbers, spaces, hyphens, and underscores.",
      ok: false,
    } as const;
  }

  return { ok: true, value: trimmedName } as const;
}

function validateMemberPassword(password: string, confirmation: string) {
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", ok: false } as const;
  }

  if (password !== confirmation) {
    return { error: "Password confirmation does not match.", ok: false } as const;
  }

  return { ok: true, value: password } as const;
}

export function validateMemberCreateInput(input: {
  existingColors: string[];
  isActive: string | boolean;
  name: string;
  password: string;
  passwordConfirmation: string;
  role: string;
}): MemberValidationResult<ValidMemberCreateInput> {
  const name = validateMemberName(input.name);
  const password = validateMemberPassword(
    input.password,
    input.passwordConfirmation
  );
  const isActive = parseMemberActiveState(input.isActive);
  const role = input.role.trim();

  if (!name.ok) {
    return name;
  }

  if (!password.ok) {
    return password;
  }

  if (!isMemberRole(role)) {
    return { error: "Choose a valid member role.", ok: false };
  }

  if (isActive === null) {
    return { error: "Choose a valid active state.", ok: false };
  }

  return {
    ok: true,
    value: {
      color_hex: getNextUserColor(input.existingColors),
      is_active: isActive,
      name: name.value,
      password: password.value,
      role,
    },
  };
}

export function validateMemberUpdateInput(input: {
  isActive: string | boolean;
  name: string;
  role: string;
}): MemberValidationResult<ValidMemberUpdateInput> {
  const name = validateMemberName(input.name);
  const isActive = parseMemberActiveState(input.isActive);
  const role = input.role.trim();

  if (!name.ok) {
    return name;
  }

  if (!isMemberRole(role)) {
    return { error: "Choose a valid member role.", ok: false };
  }

  if (isActive === null) {
    return { error: "Choose a valid active state.", ok: false };
  }

  return {
    ok: true,
    value: {
      is_active: isActive,
      name: name.value,
      role,
    },
  };
}

export function validatePasswordResetInput(input: {
  password: string;
  passwordConfirmation: string;
}): MemberValidationResult<ValidPasswordResetInput> {
  const password = validateMemberPassword(
    input.password,
    input.passwordConfirmation
  );

  if (!password.ok) {
    return password;
  }

  return {
    ok: true,
    value: {
      password: password.value,
    },
  };
}

export function getSelfMemberEditProblem(input: {
  currentUserId: string;
  isDelete?: boolean;
  nextIsActive?: boolean;
  nextRole?: MemberRole;
  targetUserId: string;
}) {
  const isSelf = input.currentUserId === input.targetUserId;

  if (!isSelf) {
    return null;
  }

  if (input.isDelete) {
    return "You cannot delete your own admin account.";
  }

  if (input.nextIsActive === false) {
    return "You cannot deactivate your own admin account.";
  }

  if (input.nextRole && input.nextRole !== "super_admin") {
    return "You cannot demote your own admin account.";
  }

  return null;
}
