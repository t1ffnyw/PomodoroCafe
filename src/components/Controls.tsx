// Start, Pause, Reset buttons for the timer

import type { TimerState } from "@/types/timer";

type ControlsProps = {
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
};

export function Controls({ state, onStart, onPause, onReset }: ControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {state === "running" ? (
        <button
          onClick={onPause}
          className="btn btn-pill btn--sage"
        >
          Pause
        </button>
      ) : (
        <button
          onClick={onStart}
          className="btn btn-pill btn--matcha"
        >
          {state === "idle" ? "Start" : "Resume"}
        </button>
      )}

      <button
        onClick={onReset}
        className="btn btn-pill btn--pink"
      >
        Reset
      </button>
    </div>
  );
}
