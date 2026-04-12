import { describe, expect, it } from "vitest";
import {
  buildInternalMemberEmail,
  getMemberRoleLabel,
  getSelfMemberEditProblem,
  isMemberRole,
  parseMemberActiveState,
  validateMemberCreateInput,
  validateMemberUpdateInput,
  validatePasswordResetInput,
  USER_COLOR_PALETTE,
} from "./members";

describe("member admin helpers", () => {
  it("validates member creation and auto-assigns the least-used palette color", () => {
    const result = validateMemberCreateInput({
      existingColors: [
        USER_COLOR_PALETTE[0],
        USER_COLOR_PALETTE[0],
        USER_COLOR_PALETTE[1],
      ],
      isActive: "true",
      name: "  Test Member_1  ",
      password: "Password1",
      passwordConfirmation: "Password1",
      role: "member",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        color_hex: USER_COLOR_PALETTE[2],
        is_active: true,
        name: "Test Member_1",
        password: "Password1",
        role: "member",
      },
    });
  });

  it("rejects invalid names and roles", () => {
    expect(
      validateMemberUpdateInput({
        isActive: true,
        name: "A",
        role: "member",
      })
    ).toEqual({
      error: "Member name must be at least 2 characters.",
      ok: false,
    });

    expect(
      validateMemberUpdateInput({
        isActive: true,
        name: "Test Member!",
        role: "member",
      })
    ).toEqual({
      error: "Member name can use letters, numbers, spaces, hyphens, and underscores.",
      ok: false,
    });

    expect(isMemberRole("admin")).toBe(false);
    expect(getMemberRoleLabel("super_admin")).toBe("Super Admin");
  });

  it("validates password reset inputs", () => {
    expect(
      validatePasswordResetInput({
        password: "short",
        passwordConfirmation: "short",
      })
    ).toEqual({
      error: "Password must be at least 8 characters.",
      ok: false,
    });

    expect(
      validatePasswordResetInput({
        password: "Password1",
        passwordConfirmation: "Password2",
      })
    ).toEqual({
      error: "Password confirmation does not match.",
      ok: false,
    });

    expect(
      validatePasswordResetInput({
        password: "Password1",
        passwordConfirmation: "Password1",
      })
    ).toEqual({
      ok: true,
      value: {
        password: "Password1",
      },
    });
  });

  it("builds hidden internal emails with unique suffixes", () => {
    expect(buildInternalMemberEmail("Super Admin", "ABC-123")).toBe(
      "super-admin--abc-123@auth.fleettime.local"
    );
    expect(buildInternalMemberEmail("Super Admin", "XYZ-789")).not.toBe(
      buildInternalMemberEmail("Super Admin", "ABC-123")
    );
  });

  it("guards self-admin lockout actions", () => {
    expect(
      getSelfMemberEditProblem({
        currentUserId: "user-1",
        isDelete: true,
        targetUserId: "user-1",
      })
    ).toBe("You cannot delete your own admin account.");

    expect(
      getSelfMemberEditProblem({
        currentUserId: "user-1",
        nextIsActive: false,
        targetUserId: "user-1",
      })
    ).toBe("You cannot deactivate your own admin account.");

    expect(
      getSelfMemberEditProblem({
        currentUserId: "user-1",
        nextRole: "member",
        targetUserId: "user-1",
      })
    ).toBe("You cannot demote your own admin account.");

    expect(
      getSelfMemberEditProblem({
        currentUserId: "user-1",
        isDelete: true,
        targetUserId: "user-2",
      })
    ).toBeNull();
  });

  it("parses active state explicitly", () => {
    expect(parseMemberActiveState(true)).toBe(true);
    expect(parseMemberActiveState(false)).toBe(false);
    expect(parseMemberActiveState("true")).toBe(true);
    expect(parseMemberActiveState("false")).toBe(false);
    expect(parseMemberActiveState("active")).toBeNull();
  });
});
