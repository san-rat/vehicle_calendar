import Link from "next/link";
import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from "react";

export type UiTone =
  | "danger"
  | "info"
  | "neutral"
  | "primary"
  | "secondary"
  | "success"
  | "warning";

export type UiSize = "md" | "sm";

type ButtonStyleInput = {
  className?: string;
  size?: UiSize;
  tone?: UiTone;
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & ButtonStyleInput;

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> &
  ButtonStyleInput;

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: UiTone;
};

type FieldProps = {
  children: ReactNode;
  hint?: string;
  htmlFor?: string;
  label: string;
};

type PageHeaderProps = {
  action?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  title: string;
};

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

const buttonSizeClasses: Record<UiSize, string> = {
  md: "min-h-12 px-4 py-3 text-sm",
  sm: "min-h-11 px-3 py-2 text-sm",
};

const buttonToneClasses: Record<UiTone, string> = {
  danger:
    "border border-[var(--danger)] bg-white text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white",
  info: "border border-[var(--info)]/30 bg-[var(--info)]/10 text-[var(--info-text)] hover:border-[var(--info)]",
  neutral:
    "border border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--text)]",
  primary: "bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)]",
  secondary:
    "border border-[var(--border)] bg-white text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
  success:
    "border border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success-text)] hover:border-[var(--success)]",
  warning:
    "border border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning-text)] hover:border-[var(--warning)]",
};

const badgeToneClasses: Record<UiTone, string> = {
  danger: "bg-[var(--danger)]/10 text-[var(--danger)]",
  info: "bg-[var(--info)]/10 text-[var(--info-text)]",
  neutral: "border border-[var(--border)] bg-white text-[var(--muted)]",
  primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
  secondary: "border border-[var(--border)] bg-white text-[var(--text)]",
  success: "bg-[var(--success)]/10 text-[var(--success-text)]",
  warning: "bg-[var(--warning)]/10 text-[var(--warning-text)]",
};

const noticeToneClasses: Record<Extract<UiTone, "danger" | "info" | "success" | "warning">, string> = {
  danger: "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]",
  info: "border-[var(--info)]/30 bg-[var(--info)]/10 text-[var(--info-text)]",
  success:
    "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success-text)]",
  warning:
    "border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning-text)]",
};

export function buttonClassName({
  className,
  size = "md",
  tone = "secondary",
}: ButtonStyleInput = {}) {
  return joinClasses(
    buttonBaseClass,
    buttonSizeClasses[size],
    buttonToneClasses[tone],
    className
  );
}

export function inputClassName(className?: string) {
  return joinClasses(
    "min-h-12 w-full rounded-md border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60",
    className
  );
}

export function labelClassName(className?: string) {
  return joinClasses("text-sm font-medium text-[var(--text)]", className);
}

export function Button({
  className,
  size = "md",
  tone = "secondary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ className, size, tone })}
      type={type}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  size = "md",
  tone = "secondary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClassName({ className, size, tone })}
      {...props}
    />
  );
}

export function Panel({
  as,
  className,
  ...props
}: ComponentPropsWithoutRef<"section"> & { as?: ElementType }) {
  const Component = as ?? "section";

  return (
    <Component
      className={joinClasses(
        "rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={joinClasses(
        "inline-flex min-h-7 items-center rounded-md px-3 py-1 text-xs font-semibold",
        badgeToneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

export function Field({ children, hint, htmlFor, label }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className={labelClassName()} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function Notice({
  className,
  tone = "info",
  ...props
}: ComponentPropsWithoutRef<"p"> & {
  tone?: "danger" | "info" | "success" | "warning";
}) {
  return (
    <p
      className={joinClasses(
        "rounded-md border px-4 py-3 text-sm font-medium",
        noticeToneClasses[tone],
        className
      )}
      role={tone === "danger" ? "alert" : "status"}
      {...props}
    />
  );
}

export function PageHeader({
  action,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-sm font-semibold text-[var(--primary)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className={joinClasses("text-2xl font-semibold", eyebrow && "mt-1")}>
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function EmptyState({
  action,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] px-5 py-8 text-center">
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
          {icon}
        </div>
      ) : null}
      <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
