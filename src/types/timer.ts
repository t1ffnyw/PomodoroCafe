export type TimerMode = "focus" | "break";

export type TimerState = "idle" | "running" | "paused";

export type TimerConfig = {
  focusMinutes: number;
  breakMinutes: number;
};

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  focusMinutes: 25,
  breakMinutes: 5,
};
