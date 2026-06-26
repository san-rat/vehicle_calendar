export function reportAuditLogFailure({
  action,
  error,
  targetId,
}: {
  action: string;
  error: unknown;
  targetId?: string;
}) {
  console.error("Audit log write failed.", {
    action,
    error,
    targetId,
  });
}
