import type { AppUserRole } from "@/lib/auth/user";

export function canAccessSystemLog(role: AppUserRole) {
  return role === "super_admin";
}
