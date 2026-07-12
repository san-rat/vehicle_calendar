import { describe, expect, it } from "vitest";
import { getLoginErrorMessage, getPostLoginPath } from "./user";

describe("auth user helpers", () => {
  it("routes both supported roles to the vehicle selection page", () => {
    expect(getPostLoginPath("member")).toBe("/vehicles");
    expect(getPostLoginPath("super_admin")).toBe("/vehicles");
  });

  it("maps login error codes to user-facing messages", () => {
    expect(getLoginErrorMessage("missing-credentials")).toBe(
      "Enter both your name and password."
    );
    expect(getLoginErrorMessage("invalid-credentials")).toBe(
      "Invalid name or password."
    );
    expect(getLoginErrorMessage("inactive-user")).toBe(
      "Your account is inactive. Contact an admin."
    );
    expect(getLoginErrorMessage("profile-missing")).toBe(
      "Your account profile is missing."
    );
    expect(getLoginErrorMessage("unknown")).toBeNull();
    expect(getLoginErrorMessage()).toBeNull();
  });
});
