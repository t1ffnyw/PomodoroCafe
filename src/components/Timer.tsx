// Timer component to display the timer
// with a countdown ring and a time display

import type { TimerMode, TimerState } from "@/types/timer";

type TimerProps = {
  minutes: number;
  seconds: number;
  mode: TimerMode;
  state: TimerState;
  progress: number;
  showLabel?: boolean;
  size?: "default" | "large";
};

const TIMER_SIZES = {
  default: { ring: 200, stroke: 16, timeClass: "text-4xl" },
  large: { ring: 320, stroke: 22, timeClass: "text-6xl" },
} as const;

export function Timer({
  minutes,
  seconds,
  mode,
  progress,
  showLabel = true,
  size = "default",
}: TimerProps) {
  const { ring: ringSize, stroke: strokeWidth, timeClass } = TIMER_SIZES[size];
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const modeLabels: Record<typeof mode, string> = {
    focus: "Focus Time",
    break: "Short Break",
    longBreak: "Long Break",
  };
  const modeLabel = modeLabels[mode];
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      {showLabel && (
        <h2 className="font-display text-xl text-cafe-text-light tracking-wide">
          {modeLabel}
        </h2>
      )}

      <div className="relative" style={{ width: ringSize, height: ringSize }}>
        <svg
          width={ringSize}
          height={ringSize}
          className="rotate-[-90deg]"
        >
          {/* Background ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-cafe-sage/30"
          />
          {/* Progress ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={
              mode === "focus"
                ? "text-cafe-matcha"
                : mode === "longBreak"
                  ? "text-cafe-wood"
                  : "text-cafe-pink-dark"
            }
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-body font-bold text-cafe-text tabular-nums ${timeClass}`}
          >
            {timeDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}
