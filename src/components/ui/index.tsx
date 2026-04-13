import Link from "next/link";
import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from "react";
import type { BookingStatus } from "@/lib/booking/bookings";
import { ChevronRightIcon } from "./icons";

export type UiTone =
  | "danger"
  | "ghost"
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
  eyebrow?: ReactNode;
  title: string;
};

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: ElementType<ComponentPropsWithoutRef<"svg">>;
  title: string;
};

export type BreadcrumbItem = {
  href?: string | null;
  label: string;
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const inputBaseClass =
  "min-h-12 w-full rounded-xl border border-[var(--border)] bg-white/95 px-4 py-3 text-sm text-[var(--text)] outline-none transition duration-200 ease-out placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60";

const buttonSizeClasses: Record<UiSize, string> = {
  md: "min-h-12 px-4 py-3 text-sm",
  sm: "min-h-11 px-3 py-2 text-sm",
};

const buttonToneClasses: Record<UiTone, string> = {
  danger:
    "border border-[var(--danger)]/25 bg-white text-[var(--danger)] shadow-sm shadow-red-100/30 [@media(hover:hover)]:hover:border-[var(--danger)] [@media(hover:hover)]:hover:bg-[var(--danger)]/8",
  ghost:
    "border border-transparent bg-transparent text-[var(--muted)] [@media(hover:hover)]:hover:bg-white/80 [@media(hover:hover)]:hover:text-[var(--text)]",
  info:
    "border border-[var(--info)]/30 bg-[var(--info)]/10 text-[var(--info-text)] [@media(hover:hover)]:hover:border-[var(--info)]",
  neutral:
    "border border-[var(--border)] bg-white/80 text-[var(--muted)] [@media(hover:hover)]:hover:border-[var(--primary)] [@media(hover:hover)]:hover:text-[var(--text)]",
  primary:
    "bg-[var(--primary)] text-white shadow-sm shadow-blue-200/60 [@media(hover:hover)]:hover:bg-[var(--primary-hover)]",
  secondary:
    "border border-[var(--border)] bg-white/90 text-[var(--text)] shadow-sm shadow-slate-200/30 [@media(hover:hover)]:hover:border-[var(--primary)] [@media(hover:hover)]:hover:bg-white [@media(hover:hover)]:hover:text-[var(--primary)]",
  success:
    "border border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success-text)] [@media(hover:hover)]:hover:border-[var(--success)]",
  warning:
    "border border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning-text)] [@media(hover:hover)]:hover:border-[var(--warning)]",
};

const badgeToneClasses: Record<UiTone, string> = {
  danger: "bg-[var(--danger)]/10 text-[var(--danger)]",
  ghost: "bg-transparent text-[var(--muted)]",
  info: "bg-[var(--info)]/10 text-[var(--info-text)]",
  neutral: "border border-[var(--border)] bg-white text-[var(--muted)]",
  primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
  secondary: "border border-[var(--border)] bg-white text-[var(--text)]",
  success: "bg-[var(--success)]/10 text-[var(--success-text)]",
  warning: "bg-[var(--warning)]/10 text-[var(--warning-text)]",
};

const statusBadgeClasses: Record<BookingStatus, string> = {
  cancelled:
    "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20",
  confirmed:
    "bg-green-100/50 text-green-700 ring-1 ring-inset ring-green-600/20",
  overridden:
    "bg-amber-100/50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  rejected: "bg-red-100/50 text-red-700 ring-1 ring-inset ring-red-600/20",
  requested:
    "bg-blue-100/50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
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

export function panelClassName(className?: string) {
  return joinClasses(
    "rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-sm shadow-slate-200/50 backdrop-blur-[1px]",
    className
  );
}

export function interactiveCardClassName(className?: string) {
  return joinClasses(
    "rounded-2xl border border-[var(--border)] bg-[var(--card)]/96 p-5 shadow-sm shadow-slate-200/50 transform-gpu transition-all duration-300 ease-out [@media(hover:hover)]:hover:-translate-y-[2px] [@media(hover:hover)]:hover:border-[var(--primary)] [@media(hover:hover)]:hover:shadow-md [@media(hover:hover)]:hover:shadow-slate-200/70 active:scale-[0.98] active:shadow-sm",
    className
  );
}

export function inputClassName(className?: string) {
  return joinClasses(
    inputBaseClass,
    "focus:border-[var(--primary)] focus:ring-[3px] focus:ring-[var(--primary)]/15",
    className
  );
}

export function warningInputClassName(className?: string) {
  return joinClasses(
    inputBaseClass,
    "focus:border-[var(--warning)] focus:ring-[3px] focus:ring-[var(--warning)]/15",
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
      className={panelClassName(className)}
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
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold",
        badgeToneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({
  className,
  status,
  ...props
}: ComponentPropsWithoutRef<"span"> & {
  status: BookingStatus;
}) {
  return (
    <span
      className={joinClasses(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        statusBadgeClasses[status] ??
          "bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200",
        className
      )}
      {...props}
    >
      {status}
    </span>
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
          <div className="text-sm font-semibold tracking-[0.02em] text-[var(--primary)]">
            {eyebrow}
          </div>
        ) : null}
        <h1
          className={joinClasses(
            "text-3xl font-semibold tracking-[-0.02em] text-[var(--text)] sm:text-[2rem]",
            eyebrow ? "mt-1" : undefined
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function BreadcrumbNav({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="w-full overflow-hidden">
      <ol className="flex flex-wrap items-center gap-y-2 text-sm text-[var(--muted)]">
        {items.map((item, index) => {
          const href = item.href;
          const labelClassName =
            "block max-w-[140px] truncate sm:max-w-[220px] md:max-w-[280px]";

          return (
            <li className="flex min-w-0 items-center" key={`${index}-${item.label}`}>
              {index > 0 ? (
                <ChevronRightIcon className="mx-1 h-4 w-4 shrink-0 text-[var(--muted)]/70" />
              ) : null}
              {index === items.length - 1 || !href ? (
                <span
                  aria-current="page"
                  className={`${labelClassName} font-medium text-[var(--text)]`}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  className={`${labelClassName} transition-colors duration-200 ease-in-out [@media(hover:hover)]:hover:text-[var(--primary)] [@media(hover:hover)]:hover:underline active:scale-[0.98]`}
                  href={href}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function EmptyState({
  action,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/96 px-6 py-12 text-center shadow-sm shadow-slate-200/40 motion-safe:animate-[empty-state-fade_500ms_ease-out]">
      {Icon ? (
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]">
          <Icon
            aria-hidden="true"
            className="h-8 w-8 opacity-80 [stroke-width:1.5]"
          />
        </div>
      ) : null}
      <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
