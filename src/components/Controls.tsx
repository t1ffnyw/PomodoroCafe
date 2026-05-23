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
          className="rounded-full bg-cafe-sage px-6 py-2 font-body font-semibold text-cafe-text transition-colors hover:bg-cafe-sage-dark"
        >
          Pause
        </button>
      ) : (
        <button
          onClick={onStart}
          className="rounded-full bg-cafe-matcha px-6 py-2 font-body font-semibold text-white transition-colors hover:bg-cafe-sage-dark"
        >
          {state === "idle" ? "Start" : "Resume"}
        </button>
      )}

      <button
        onClick={onReset}
        className="rounded-full bg-cafe-pink px-6 py-2 font-body font-semibold text-cafe-text transition-colors hover:bg-cafe-pink-dark"
      >
        Reset
      </button>
    </div>
  );
}
