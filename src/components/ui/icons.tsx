import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, className, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}



export function LogIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 5.5h10" />
      <path d="M7 9.5h10" />
      <path d="M7 13.5h6" />
      <path d="M5 3.5h14v17H5z" />
    </IconBase>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19 12a7.7 7.7 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7.1 7.1 0 0 0-1.9-1.1L14.3 3h-4.6l-.4 2.9A7.1 7.1 0 0 0 7.5 7L5.1 6 3 9.4l2.1 1.5A7.7 7.7 0 0 0 5 12c0 .4 0 .8.1 1.1L3 14.6 5.1 18l2.4-1a7.1 7.1 0 0 0 1.8 1.1l.4 2.9h4.6l.4-2.9a7.1 7.1 0 0 0 1.9-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1.1Z" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </IconBase>
  );
}

export function EmptyStateIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 6.5h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <path d="M8 4.5v4" />
      <path d="M16 4.5v4" />
      <path d="M5 10.5h14" />
      <path d="M9 14h1.5" />
      <path d="M13.5 14H15" />
    </IconBase>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6.5 4.5v3" />
      <path d="M17.5 4.5v3" />
      <path d="M4.5 8.5h15" />
      <path d="M6.5 6h11a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      <path d="M8 12h2" />
      <path d="M12 12h2" />
      <path d="M16 12h.5" />
      <path d="M8 15.5h2" />
      <path d="M12 15.5h2" />
    </IconBase>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M12 7.5V12l3 2" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 5 7 7-7 7" />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 7h15" />
      <path d="M4.5 12h15" />
      <path d="M4.5 17h15" />
    </IconBase>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </IconBase>
  );
}

export function ManageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 7.5h15" />
      <path d="M4.5 16.5h15" />
      <path d="M8 5v5" />
      <path d="M16 14v5" />
      <circle cx="8" cy="7.5" r="2" />
      <circle cx="16" cy="16.5" r="2" />
    </IconBase>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="m8.5 12 2.3 2.3 4.7-4.8" />
    </IconBase>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4.5 20 18.5H4L12 4.5Z" />
      <path d="M12 9v4.5" />
      <path d="M12 16.5h.01" />
    </IconBase>
  );
}
