// Start, Pause, Reset buttons for the timer

import type { TimerState } from "@/types/timer";

type ControlsProps = {
  variant?: "default" | "focus";
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
};

export function Controls({
  variant = "default",
  state,
  onStart,
  onPause,
  onReset,
}: ControlsProps) {
  const isLarge = variant === "focus";
  const pillClass = isLarge
    ? "btn rounded-full px-10 py-3.5 text-lg font-semibold"
    : "btn btn-pill";

  return (
    <div className={`flex items-center ${isLarge ? "gap-5" : "gap-3"}`}>
      {state === "running" ? (
        <button onClick={onPause} className={`${pillClass} btn--sage`}>
          Pause
        </button>
      ) : (
        <button onClick={onStart} className={`${pillClass} btn--matcha`}>
          {state === "idle" ? "Start" : "Resume"}
        </button>
      )}

      <button onClick={onReset} className={`${pillClass} btn--pink`}>
        Reset
      </button>
    </div>
  );
}
