import { normalizeDbTime, parseTimeToMinutes } from "./bookings";

export const TIMELINE_SLOT_MINUTES = 30;
export const TIMELINE_SLOT_HEIGHT_PX = 48;
export const TIMELINE_TIME_GUTTER_PX = 56;
export const TIMELINE_TRACK_HEIGHT_PX =
  (24 * 60 * TIMELINE_SLOT_HEIGHT_PX) / TIMELINE_SLOT_MINUTES;

export type TimelineBookingWindow = {
  endTime: string;
  isAllDay: boolean;
  startTime: string;
};

export type TimelineBlockMetrics = {
  endMinutes: number;
  heightPx: number;
  startMinutes: number;
  topPx: number;
};

export type TimelineTimedLayout<T> = {
  booking: T;
  column: number;
  heightPx: number;
  topPx: number;
  totalColumns: number;
};

function clampMinutes(value: number) {
  return Math.min(24 * 60, Math.max(0, value));
}

function getPixelsPerMinute(slotHeightPx = TIMELINE_SLOT_HEIGHT_PX) {
  return slotHeightPx / TIMELINE_SLOT_MINUTES;
}

export function splitTimelineBookings<T extends { isAllDay: boolean }>(
  bookings: T[]
) {
  return {
    allDayBookings: bookings.filter((booking) => booking.isAllDay),
    timedBookings: bookings.filter((booking) => !booking.isAllDay),
  };
}

export function getTimelineOffsetPx(
  minutes: number,
  slotHeightPx = TIMELINE_SLOT_HEIGHT_PX
) {
  return clampMinutes(minutes) * getPixelsPerMinute(slotHeightPx);
}

export function getTimelineBlockMetrics(
  booking: TimelineBookingWindow,
  slotHeightPx = TIMELINE_SLOT_HEIGHT_PX
): TimelineBlockMetrics | null {
  if (booking.isAllDay) {
    return null;
  }

  const startMinutes = parseTimeToMinutes(normalizeDbTime(booking.startTime));
  const endMinutes = parseTimeToMinutes(normalizeDbTime(booking.endTime));

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  const clampedStart = clampMinutes(startMinutes);
  const clampedEnd = clampMinutes(endMinutes);
  const pixelsPerMinute = getPixelsPerMinute(slotHeightPx);

  return {
    endMinutes: clampedEnd,
    heightPx: Math.max((clampedEnd - clampedStart) * pixelsPerMinute, 1),
    startMinutes: clampedStart,
    topPx: clampedStart * pixelsPerMinute,
  };
}

export function getTimedTimelineLayout<T extends TimelineBookingWindow>(
  bookings: T[]
): TimelineTimedLayout<T>[] {
  const preparedBookings = bookings
    .map((booking) => {
      const metrics = getTimelineBlockMetrics(booking);

      if (!metrics) {
        return null;
      }

      return {
        booking,
        ...metrics,
      };
    })
    .filter((booking): booking is NonNullable<typeof booking> => booking !== null)
    .sort(
      (first, second) =>
        first.startMinutes - second.startMinutes ||
        second.endMinutes - first.endMinutes
    );

  const layouts: Array<
    TimelineTimedLayout<T> & { endMinutes: number; startMinutes: number }
  > = [];
  let activeLayouts: typeof layouts = [];
  let clusterLayouts: typeof layouts = [];
  let clusterColumnCount = 0;

  const finalizeCluster = () => {
    clusterLayouts.forEach((layout) => {
      layout.totalColumns = Math.max(layout.totalColumns, clusterColumnCount);
    });
    clusterLayouts = [];
    clusterColumnCount = 0;
  };

  preparedBookings.forEach((booking) => {
    activeLayouts = activeLayouts.filter(
      (layout) => layout.endMinutes > booking.startMinutes
    );

    if (activeLayouts.length === 0 && clusterLayouts.length > 0) {
      finalizeCluster();
    }

    const occupiedColumns = new Set(activeLayouts.map((layout) => layout.column));
    let column = 0;

    while (occupiedColumns.has(column)) {
      column += 1;
    }

    const layout = {
      booking: booking.booking,
      column,
      endMinutes: booking.endMinutes,
      heightPx: booking.heightPx,
      startMinutes: booking.startMinutes,
      topPx: booking.topPx,
      totalColumns: 1,
    };

    layouts.push(layout);
    clusterLayouts.push(layout);
    activeLayouts.push(layout);
    clusterColumnCount = Math.max(clusterColumnCount, column + 1);
  });

  if (clusterLayouts.length > 0) {
    finalizeCluster();
  }

  return layouts.map((layout) => ({
    booking: layout.booking,
    column: layout.column,
    heightPx: layout.heightPx,
    topPx: layout.topPx,
    totalColumns: layout.totalColumns,
  }));
}

export function getTimelineNowLineTopPx(
  currentTimeMinutes: number,
  slotHeightPx = TIMELINE_SLOT_HEIGHT_PX
) {
  return getTimelineOffsetPx(currentTimeMinutes, slotHeightPx);
}

export function shouldShowTimelineNowLine(selectedDate: string, today: string) {
  return selectedDate === today;
}
