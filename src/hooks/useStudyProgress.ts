import { useState, useCallback, useEffect } from "react";
import type {
  DayProgress,
  ProgressMetric,
  ProgressRange,
  ProgressStore,
  ProgressViewData,
  ChartDataPoint,
} from "@/types/progress";
import { createEmptyDayProgress, getLocalDateKey } from "@/types/progress";

const STORAGE_KEY = "cafe-pomodoro-progress";

const DEFAULT_STORE: ProgressStore = {
  version: 1,
  days: {},
};

function normalizeDay(day?: Partial<DayProgress>): DayProgress {
  const empty = createEmptyDayProgress();
  if (!day) return empty;
  return {
    focusMinutes:
      typeof day.focusMinutes === "number" && !Number.isNaN(day.focusMinutes)
        ? day.focusMinutes
        : 0,
    completedSessions:
      typeof day.completedSessions === "number" && !Number.isNaN(day.completedSessions)
        ? day.completedSessions
        : 0,
    hourlyMinutes:
      Array.isArray(day.hourlyMinutes) && day.hourlyMinutes.length === 24
        ? [...day.hourlyMinutes]
        : empty.hourlyMinutes,
    hourlyCompletions:
      Array.isArray(day.hourlyCompletions) && day.hourlyCompletions.length === 24
        ? [...day.hourlyCompletions]
        : empty.hourlyCompletions,
  };
}

function loadStore(): ProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.days) {
      const normalizedDays: Record<string, DayProgress> = {};
      for (const [key, value] of Object.entries(parsed.days)) {
        normalizedDays[key] = normalizeDay(value as Partial<DayProgress>);
      }
      return {
        version: 1,
        days: normalizedDays,
      };
    }
    return DEFAULT_STORE;
  } catch {
    return DEFAULT_STORE;
  }
}

function saveStore(store: ProgressStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn("Failed to save study progress to localStorage", err);
  }
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  return hour < 12 ? `${hour}a` : `${hour - 12}p`;
}

export function useStudyProgress() {
  const [store, setStore] = useState<ProgressStore>(loadStore);

  useEffect(() => {
    saveStore(store);
  }, [store]);

  const recordFocusMs = useCallback((ms: number, timestamp = Date.now()) => {
    if (ms < 1000) return; // ignore sub-second noise
    const addedMinutes = Math.round((ms / 60000) * 10) / 10;
    if (addedMinutes <= 0) return;

    const date = new Date(timestamp);
    const dateKey = getLocalDateKey(date);
    const hour = date.getHours();

    setStore((prev) => {
      const currentDay = normalizeDay(prev.days[dateKey]);
      const updatedHourlyMinutes = [...currentDay.hourlyMinutes];
      const prevHourMins = updatedHourlyMinutes[hour] ?? 0;
      updatedHourlyMinutes[hour] =
        Math.round((prevHourMins + addedMinutes) * 10) / 10;

      const updatedDay: DayProgress = {
        ...currentDay,
        focusMinutes: Math.round((currentDay.focusMinutes + addedMinutes) * 10) / 10,
        hourlyMinutes: updatedHourlyMinutes,
      };

      return {
        ...prev,
        days: {
          ...prev.days,
          [dateKey]: updatedDay,
        },
      };
    });
  }, []);

  const recordCompletedSession = useCallback((timestamp = Date.now()) => {
    const date = new Date(timestamp);
    const dateKey = getLocalDateKey(date);
    const hour = date.getHours();

    setStore((prev) => {
      const currentDay = normalizeDay(prev.days[dateKey]);
      const updatedHourlyCompletions = [...currentDay.hourlyCompletions];
      const prevHourCompletions = updatedHourlyCompletions[hour] ?? 0;
      updatedHourlyCompletions[hour] = prevHourCompletions + 1;

      const updatedDay: DayProgress = {
        ...currentDay,
        completedSessions: currentDay.completedSessions + 1,
        hourlyCompletions: updatedHourlyCompletions,
      };

      return {
        ...prev,
        days: {
          ...prev.days,
          [dateKey]: updatedDay,
        },
      };
    });
  }, []);

  const getView = useCallback(
    (range: ProgressRange, metric: ProgressMetric): ProgressViewData => {
      const now = new Date();
      const unit = metric === "minutes" ? "min" : "sessions";

      if (range === "day") {
        const todayKey = getLocalDateKey(now);
        const dayData = normalizeDay(store.days[todayKey]);

        const points: ChartDataPoint[] = [];
        for (let h = 0; h < 24; h++) {
          points.push({
            key: `hour-${h}`,
            label: formatHourLabel(h),
            value:
              metric === "minutes"
                ? (dayData.hourlyMinutes[h] ?? 0)
                : (dayData.hourlyCompletions[h] ?? 0),
          });
        }

        return {
          range,
          metric,
          unit,
          summary: {
            totalMinutes: dayData.focusMinutes,
            totalSessions: dayData.completedSessions,
          },
          points,
        };
      }

      if (range === "week") {
        // Last 7 days including today
        const points: ChartDataPoint[] = [];
        let totalMinutes = 0;
        let totalSessions = 0;

        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = getLocalDateKey(d);
          const dayData = normalizeDay(store.days[key]);

          totalMinutes += dayData.focusMinutes;
          totalSessions += dayData.completedSessions;

          const label = d.toLocaleDateString(undefined, { weekday: "short" });
          points.push({
            key,
            label,
            value: metric === "minutes" ? dayData.focusMinutes : dayData.completedSessions,
          });
        }

        const avgMinutes = Math.round((totalMinutes / 7) * 10) / 10;
        const avgSessions = Math.round((totalSessions / 7) * 10) / 10;

        return {
          range,
          metric,
          unit,
          summary: {
            totalMinutes: Math.round(totalMinutes * 10) / 10,
            totalSessions,
            averageMinutesPerDay: avgMinutes,
            averageSessionsPerDay: avgSessions,
          },
          points,
        };
      }

      // Month: all days in current calendar month
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const points: ChartDataPoint[] = [];
      let totalMinutes = 0;
      let totalSessions = 0;

      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const d = new Date(year, month, dayNum);
        const key = getLocalDateKey(d);
        const dayData = normalizeDay(store.days[key]);

        totalMinutes += dayData.focusMinutes;
        totalSessions += dayData.completedSessions;

        points.push({
          key,
          label: String(dayNum),
          value: metric === "minutes" ? dayData.focusMinutes : dayData.completedSessions,
        });
      }

      const avgMinutes = Math.round((totalMinutes / daysInMonth) * 10) / 10;
      const avgSessions = Math.round((totalSessions / daysInMonth) * 10) / 10;

      return {
        range,
        metric,
        unit,
        summary: {
          totalMinutes: Math.round(totalMinutes * 10) / 10,
          totalSessions,
          averageMinutesPerDay: avgMinutes,
          averageSessionsPerDay: avgSessions,
        },
        points,
      };
    },
    [store],
  );

  return {
    store,
    recordFocusMs,
    recordCompletedSession,
    getView,
  };
}
