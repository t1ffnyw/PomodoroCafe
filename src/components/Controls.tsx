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
          className="cafe-button-shadow rounded-full bg-cafe-sage px-6 py-2 font-body font-semibold text-cafe-text [--cafe-button-shadow-color:var(--color-cafe-sage-dark)] hover:bg-cafe-sage-dark"
        >
          Pause
        </button>
      ) : (
        <button
          onClick={onStart}
          className="cafe-button-shadow rounded-full bg-cafe-matcha px-6 py-2 font-body font-semibold text-white [--cafe-button-shadow-color:var(--color-cafe-sage-dark)] hover:bg-cafe-sage-dark"
        >
          {state === "idle" ? "Start" : "Resume"}
        </button>
      )}

      <button
        onClick={onReset}
        className="cafe-button-shadow rounded-full bg-cafe-pink px-6 py-2 font-body font-semibold text-cafe-text [--cafe-button-shadow-color:var(--color-cafe-pink-dark)] hover:bg-cafe-pink-dark"
      >
        Reset
      </button>
    </div>
  );
}
