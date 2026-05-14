import { describe, expect, it } from "vitest";
import { canAccessSystemLog } from "./access";

describe("access helpers", () => {
  it("restricts the system log to super admins", () => {
    expect(canAccessSystemLog("super_admin")).toBe(true);
    expect(canAccessSystemLog("member")).toBe(false);
  });
});
