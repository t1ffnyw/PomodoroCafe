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
