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

export type UiSize = "lg" | "md" | "sm";

type ButtonStyleInput = {
  className?: string;
  loading?: boolean;
  size?: UiSize;
  tone?: UiTone;
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & ButtonStyleInput;

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> &
  Omit<ButtonStyleInput, "loading">;

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: UiTone;
};

type FieldProps = {
  children: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  label: string;
  optionalLabel?: ReactNode;
};

type PageHeaderProps = {
  action?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  title: string;
  toolbar?: ReactNode;
};

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: ElementType<ComponentPropsWithoutRef<"svg">>;
  supportingCopy?: ReactNode;
  title: string;
};

type PanelVariant = "base" | "danger" | "elevated" | "interactive" | "inset";

export type BreadcrumbItem = {
  href?: string | null;
  label: string;
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-500)]/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55";

const inputBaseClass =
  "min-h-12 w-full rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition duration-200 ease-out placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:bg-[var(--bg-surface-inset)] disabled:text-[var(--text-muted)]";

const buttonSizeClasses: Record<UiSize, string> = {
  lg: "min-h-14 px-5 py-3.5 text-[15px]",
  md: "min-h-12 px-4 py-3 text-sm",
  sm: "min-h-11 px-3.5 py-2.5 text-sm",
};

const buttonToneClasses: Record<UiTone, string> = {
  danger:
    "border border-[var(--danger)]/25 bg-[var(--danger-soft)] text-[var(--danger)] hover:border-[var(--danger)]/45 hover:bg-[var(--danger)] hover:text-white hover:shadow-[0_10px_24px_rgba(199,59,55,0.2)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]",
  info:
    "border border-[var(--info)]/20 bg-[var(--info-soft)] text-[var(--info)] hover:border-[var(--info)]/35 hover:bg-[var(--info)] hover:text-white hover:shadow-[0_10px_24px_rgba(42,111,170,0.18)]",
  neutral:
    "border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]",
  primary:
    "border border-[var(--brand-500)] bg-[var(--brand-500)] text-white shadow-[0_14px_32px_rgba(17,122,108,0.22)] hover:border-[var(--brand-600)] hover:bg-[var(--brand-600)] hover:shadow-[0_18px_36px_rgba(17,122,108,0.28)]",
  secondary:
    "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.09)]",
  success:
    "border border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)] hover:border-[var(--success)]/35 hover:bg-[var(--success)] hover:text-white hover:shadow-[0_10px_24px_rgba(25,135,84,0.18)]",
  warning:
    "border border-[var(--warning)]/25 bg-[var(--warning-soft)] text-[var(--warning)] hover:border-[var(--warning)]/45 hover:bg-[var(--warning)] hover:text-white hover:shadow-[0_10px_24px_rgba(180,116,46,0.18)]",
};

const badgeToneClasses: Record<UiTone, string> = {
  danger:
    "border border-[var(--danger)]/16 bg-[var(--danger-soft)] text-[var(--danger)]",
  ghost: "border border-transparent bg-transparent text-[var(--text-muted)]",
  info: "border border-[var(--info)]/16 bg-[var(--info-soft)] text-[var(--info)]",
  neutral:
    "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]",
  primary:
    "border border-[var(--brand-500)]/14 bg-[var(--brand-100)] text-[var(--brand-600)]",
  secondary:
    "border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]",
  success:
    "border border-[var(--success)]/16 bg-[var(--success-soft)] text-[var(--success)]",
  warning:
    "border border-[var(--warning)]/16 bg-[var(--warning-soft)] text-[var(--warning)]",
};

const statusBadgeClasses: Record<BookingStatus, string> = {
  cancelled:
    "border border-slate-300/70 bg-slate-100 text-slate-600",
  confirmed:
    "border border-emerald-200 bg-emerald-50 text-emerald-700",
  overridden:
    "border border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border border-rose-200 bg-rose-50 text-rose-700",
  requested:
    "border border-sky-200 bg-sky-50 text-sky-700",
};

const noticeToneClasses: Record<
  Extract<UiTone, "danger" | "info" | "success" | "warning">,
  string
> = {
  danger:
    "border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]",
  info: "border-[var(--info)]/20 bg-[var(--info-soft)] text-[var(--info)]",
  success:
    "border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]",
  warning:
    "border-[var(--warning)]/20 bg-[var(--warning-soft)] text-[var(--warning)]",
};

const panelVariantClasses: Record<PanelVariant, string> = {
  base:
    "border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] shadow-[0_10px_24px_rgba(15,23,42,0.05)] md:shadow-[0_12px_32px_rgba(15,23,42,0.06)]",
  danger:
    "border border-[var(--danger)]/16 bg-[var(--danger-soft)] shadow-[0_10px_24px_rgba(199,59,55,0.07)] md:shadow-[0_12px_30px_rgba(199,59,55,0.08)]",
  elevated:
    "border border-white/75 bg-[var(--bg-surface)] shadow-[0_14px_30px_rgba(15,23,42,0.08)] md:shadow-[0_20px_48px_rgba(15,23,42,0.1)]",
  interactive:
    "border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[0_12px_26px_rgba(15,23,42,0.07)] md:shadow-[0_14px_32px_rgba(15,23,42,0.08)]",
  inset:
    "border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
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

export function panelClassName(
  className?: string,
  variant: PanelVariant = "base"
) {
  return joinClasses(
    "rounded-[20px] p-4 backdrop-blur-lg transition duration-300 sm:p-5 md:rounded-[22px] md:p-6 md:backdrop-blur-xl",
    panelVariantClasses[variant],
    className
  );
}

export function interactiveCardClassName(className?: string) {
  return joinClasses(
    panelClassName(undefined, "interactive"),
    "transform-gpu transition-all duration-200 ease-out [@media(hover:hover)]:hover:-translate-y-[2px] [@media(hover:hover)]:hover:border-[var(--brand-500)]/25 [@media(hover:hover)]:hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)] active:scale-[0.99]",
    className
  );
}

export function inputClassName(className?: string) {
  return joinClasses(
    inputBaseClass,
    "hover:border-[var(--border-strong)] focus:border-[var(--brand-500)] focus:bg-white focus:ring-4 focus:ring-[var(--brand-500)]/12",
    className
  );
}

export function warningInputClassName(className?: string) {
  return joinClasses(
    inputBaseClass,
    "hover:border-[var(--warning)]/40 focus:border-[var(--warning)] focus:ring-4 focus:ring-[var(--warning)]/12",
    className
  );
}

export function labelClassName(className?: string) {
  return joinClasses(
    "text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]",
    className
  );
}

function ButtonSpinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

export function Button({
  children,
  className,
  disabled,
  loading = false,
  size = "md",
  tone = "secondary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ className, size, tone })}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <ButtonSpinner /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  className,
  size = "md",
  tone = "secondary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClassName({ className, size, tone })} {...props} />
  );
}

export function Panel({
  as,
  className,
  variant = "base",
  ...props
}: ComponentPropsWithoutRef<"section"> & {
  as?: ElementType;
  variant?: PanelVariant;
}) {
  const Component = as ?? "section";

  return <Component className={panelClassName(className, variant)} {...props} />;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={joinClasses(
        "inline-flex min-h-6 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] md:min-h-7 md:px-3 md:text-[11px]",
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
        "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold capitalize md:px-2.5 md:text-xs",
        statusBadgeClasses[status] ??
          "border border-slate-200 bg-slate-100 text-slate-600",
        className
      )}
      {...props}
    >
      {status}
    </span>
  );
}

export function Field({
  children,
  description,
  error,
  hint,
  htmlFor,
  label,
  optionalLabel,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className={labelClassName()} htmlFor={htmlFor}>
          {label}
        </label>
        {optionalLabel ? (
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {optionalLabel}
          </span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : description || hint ? (
        <p className="text-xs leading-5 text-[var(--text-muted)]">
          {description ?? hint}
        </p>
      ) : null}
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
        "rounded-[16px] border px-3.5 py-3 text-sm font-medium leading-6 shadow-[0_8px_18px_rgba(15,23,42,0.04)] md:rounded-[18px] md:px-4 md:shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
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
  meta,
  title,
  toolbar,
}: PageHeaderProps) {
  return (
    <header className={toolbar ? "space-y-4" : "space-y-0"}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand-600)]">
              {eyebrow}
            </div>
          ) : null}
          <div className={description ? "space-y-2" : "space-y-0"}>
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.035em] text-[var(--text-primary)] md:text-[2.5rem]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-[15px] leading-6 text-[var(--text-secondary)]">
                {description}
              </p>
            ) : null}
          </div>
          {meta ? <div className="flex flex-wrap gap-2">{meta}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {toolbar ? <div className="flex flex-wrap gap-3">{toolbar}</div> : null}
    </header>
  );
}

export function BreadcrumbNav({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="w-full overflow-hidden">
      <ol className="flex flex-wrap items-center gap-y-2 text-sm text-[var(--text-muted)]">
        {items.map((item, index) => {
          const href = item.href;
          const labelClassName =
            "block max-w-[140px] truncate sm:max-w-[220px] md:max-w-[280px]";

          return (
            <li className="flex min-w-0 items-center" key={`${index}-${item.label}`}>
              {index > 0 ? (
                <ChevronRightIcon className="mx-1 h-4 w-4 shrink-0 text-[var(--text-muted)]/70" />
              ) : null}
              {index === items.length - 1 || !href ? (
                <span
                  aria-current="page"
                  className={`${labelClassName} font-semibold text-[var(--text-primary)]`}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  className={`${labelClassName} font-medium transition-colors duration-200 ease-in-out [@media(hover:hover)]:hover:text-[var(--brand-600)] active:scale-[0.98]`}
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
  supportingCopy,
  title,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border-strong)]/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,248,250,0.92))] px-5 py-8 text-center shadow-[0_14px_30px_rgba(15,23,42,0.05)] motion-safe:animate-[empty-state-fade_500ms_ease-out] md:min-h-[240px] md:rounded-[28px] md:px-6 md:py-10 md:shadow-[0_20px_46px_rgba(15,23,42,0.05)]">
      {Icon ? (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white text-[var(--brand-500)] shadow-[0_12px_24px_rgba(15,23,42,0.08)] md:h-[4.25rem] md:w-[4.25rem] md:shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
          <Icon
            aria-hidden="true"
            className="h-7 w-7 opacity-90 [stroke-width:1.5] md:h-8 md:w-8"
          />
        </div>
      ) : null}
      <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
      {supportingCopy ? (
        <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-[var(--text-muted)]">
          {supportingCopy}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  detail,
  icon: Icon,
  label,
  tone = "neutral",
  value,
}: {
  detail?: ReactNode;
  icon?: ElementType<ComponentPropsWithoutRef<"svg">>;
  label: string;
  tone?: Extract<UiTone, "info" | "neutral" | "primary" | "success" | "warning">;
  value: ReactNode;
}) {
  const accentClass = {
    info: "bg-[var(--info-soft)] text-[var(--info)]",
    neutral: "bg-[var(--bg-surface-inset)] text-[var(--text-secondary)]",
    primary: "bg-[var(--brand-100)] text-[var(--brand-600)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
  }[tone];

  return (
    <Panel className="h-full p-4 sm:p-5" variant="elevated">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {label}
          </p>
          <p className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:mt-2.5 md:text-2xl">
            {value}
          </p>
        </div>
        {Icon ? (
          <span
            className={joinClasses(
              "flex h-9 w-9 items-center justify-center rounded-[18px] md:h-10 md:w-10 md:rounded-2xl",
              accentClass
            )}
          >
            <Icon className="h-[1.125rem] w-[1.125rem] md:h-5 md:w-5" />
          </span>
        ) : null}
      </div>
      {detail ? (
        <p className="mt-2.5 text-sm leading-6 text-[var(--text-secondary)]">
          {detail}
        </p>
      ) : null}
    </Panel>
  );
}
