export type ProgressRange = "day" | "week" | "month";
export type ProgressMetric = "minutes" | "sessions";

export type DayProgress = {
  focusMinutes: number;
  completedSessions: number;
  hourlyMinutes: number[]; // 24 entries, 0..23
  hourlyCompletions: number[]; // 24 entries, 0..23
};

export type ProgressStore = {
  version: 1;
  days: Record<string, DayProgress>; // key: YYYY-MM-DD local date
};

export type ChartDataPoint = {
  key: string;
  label: string;
  value: number;
};

export type ProgressSummary = {
  totalMinutes: number;
  totalSessions: number;
  averageMinutesPerDay?: number;
  averageSessionsPerDay?: number;
};

export type ProgressViewData = {
  range: ProgressRange;
  metric: ProgressMetric;
  summary: ProgressSummary;
  points: ChartDataPoint[];
  unit: "min" | "sessions";
};

export type TimeDisplayUnit = "min" | "hr";

export function createEmptyDayProgress(): DayProgress {
  return {
    focusMinutes: 0,
    completedSessions: 0,
    hourlyMinutes: Array(24).fill(0),
    hourlyCompletions: Array(24).fill(0),
  };
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Day always uses minutes; week/month switch to hours when daily avg ≥ 60 min. */
export function resolveTimeUnit(
  range: ProgressRange,
  averageMinutesPerDay: number,
): TimeDisplayUnit {
  if (range === "day") return "min";
  return averageMinutesPerDay >= 60 ? "hr" : "min";
}

function formatNumber(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Format a focus duration stored in minutes for display. */
export function formatFocusDuration(
  minutes: number,
  unit: TimeDisplayUnit,
): { amount: string; unitLabel: string } {
  if (unit === "hr") {
    return {
      amount: formatNumber(minutes / 60),
      unitLabel: "hr",
    };
  }
  return {
    amount: formatNumber(minutes),
    unitLabel: "min",
  };
}

/** Convert chart point values from minutes to the chosen display unit. */
export function scalePointsForTimeUnit(
  points: ChartDataPoint[],
  unit: TimeDisplayUnit,
): ChartDataPoint[] {
  if (unit === "min") return points;
  return points.map((p) => ({
    ...p,
    value: Math.round((p.value / 60) * 100) / 100,
  }));
}
