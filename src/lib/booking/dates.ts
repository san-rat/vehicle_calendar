export const BUSINESS_TIME_ZONE = "Asia/Colombo";

export type CalendarMonth = {
  days: string[];
  endDate: string;
  firstWeekday: number;
  label: string;
  month: number;
  nextMonth: string;
  prevMonth: string;
  startDate: string;
  value: string;
  year: number;
};

type DateParts = {
  day: number;
  month: number;
  year: number;
};

type MonthParts = {
  month: number;
  year: number;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatIsoDate(parts: DateParts) {
  return `${String(parts.year).padStart(4, "0")}-${pad2(parts.month)}-${pad2(
    parts.day
  )}`;
}

export function formatMonthValue(parts: MonthParts) {
  return `${String(parts.year).padStart(4, "0")}-${pad2(parts.month)}`;
}

export function parseIsoDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
}

export function parseMonthValue(value: string): MonthParts | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (year < 1000 || month < 1 || month > 12) {
    return null;
  }

  return { month, year };
}

export function getBusinessToday(
  now = new Date(),
  timeZone = BUSINESS_TIME_ZONE
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");

  if (!year || !month || !day) {
    throw new Error("Unable to resolve the business date.");
  }

  return `${year}-${month}-${day}`;
}

export function getBusinessHour(
  now = new Date(),
  timeZone = BUSINESS_TIME_ZONE
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(now);
  const hour = parts.find((part) => part.type === "hour")?.value;

  if (!hour) {
    throw new Error("Unable to resolve the business hour.");
  }

  return Number(hour);
}

export function addDays(isoDate: string, days: number) {
  const parts = parseIsoDate(isoDate);

  if (!parts) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  date.setUTCDate(date.getUTCDate() + days);

  return formatIsoDate({
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  });
}

export function getCalendarMonth(monthValue: string): CalendarMonth | null {
  const parts = parseMonthValue(monthValue);

  if (!parts) {
    return null;
  }

  const startDate = formatIsoDate({
    day: 1,
    month: parts.month,
    year: parts.year,
  });
  const lastDay = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
  const endDate = formatIsoDate({
    day: lastDay,
    month: parts.month,
    year: parts.year,
  });
  const firstDate = new Date(Date.UTC(parts.year, parts.month - 1, 1));
  const previousDate = new Date(Date.UTC(parts.year, parts.month - 2, 1));
  const nextDate = new Date(Date.UTC(parts.year, parts.month, 1));
  const days = Array.from({ length: lastDay }, (_, index) =>
    formatIsoDate({
      day: index + 1,
      month: parts.month,
      year: parts.year,
    })
  );

  return {
    days,
    endDate,
    firstWeekday: firstDate.getUTCDay(),
    label: new Intl.DateTimeFormat("en-US", {
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    }).format(firstDate),
    month: parts.month,
    nextMonth: formatMonthValue({
      month: nextDate.getUTCMonth() + 1,
      year: nextDate.getUTCFullYear(),
    }),
    prevMonth: formatMonthValue({
      month: previousDate.getUTCMonth() + 1,
      year: previousDate.getUTCFullYear(),
    }),
    startDate,
    value: formatMonthValue(parts),
    year: parts.year,
  };
}

export function resolveCalendarMonth(
  monthValue: string | undefined,
  today = getBusinessToday()
) {
  const trimmedMonth = monthValue?.trim();
  const resolvedMonth = trimmedMonth || today.slice(0, 7);

  return getCalendarMonth(resolvedMonth);
}

export function isDateWithinBookingWindow(input: {
  date: string;
  maxDaysInFuture: number;
  today: string;
}) {
  if (
    !parseIsoDate(input.date) ||
    !parseIsoDate(input.today) ||
    input.maxDaysInFuture < 0
  ) {
    return false;
  }

  const latestDate = addDays(input.today, input.maxDaysInFuture);

  return input.date >= input.today && input.date <= latestDate;
}
