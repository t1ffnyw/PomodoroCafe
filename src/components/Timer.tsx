import type { TimerMode, TimerState } from "@/types/timer";

type TimerProps = {
  minutes: number;
  seconds: number;
  mode: TimerMode;
  state: TimerState;
  progress: number;
};

const RING_SIZE = 200;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function Timer({ minutes, seconds, mode, progress }: TimerProps) {
  const offset = CIRCUMFERENCE * (1 - progress);
  const modeLabels: Record<typeof mode, string> = {
    focus: "Focus Time",
    break: "Short Break",
    longBreak: "Long Break",
  };
  const modeLabel = modeLabels[mode];
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="font-display text-xl text-cafe-text-light tracking-wide">
        {modeLabel}
      </h2>

      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="rotate-[-90deg]"
        >
          {/* Background ring */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            className="text-cafe-sage/30"
          />
          {/* Progress ring */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
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
          <span className="font-body text-4xl font-bold text-cafe-text tabular-nums">
            {timeDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}
