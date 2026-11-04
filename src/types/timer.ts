export type TimerMode = "focus" | "break" | "longBreak";

export type TimerState = "idle" | "running" | "paused";

export type TimerSnapshot = {
  mode: TimerMode;
  state: TimerState;
  remainingMs: number;
  totalMs: number;
};

export type TimerConfig = {
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
};

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
};
