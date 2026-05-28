import { useEffect } from "react";
import type { TimerMode, TimerState } from "@/types/timer";
import { Timer } from "./Timer";
import { Controls } from "./Controls";

type FocusModeOverlayProps = {
  minutes: number;
  seconds: number;
  mode: TimerMode;
  state: TimerState;
  progress: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onClose: () => void;
};

export function FocusModeOverlay({
  minutes,
  seconds,
  mode,
  state,
  progress,
  onStart,
  onPause,
  onReset,
  onClose,
}: FocusModeOverlayProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cafe-sage-light">
      <button
        type="button"
        onClick={onClose}
        className="btn btn-icon btn--pink absolute top-6 right-6 text-white hover:text-white"
        aria-label="Exit focus mode"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <div className="flex flex-col items-center gap-12">
        <Timer
          minutes={minutes}
          seconds={seconds}
          mode={mode}
          state={state}
          progress={progress}
          showLabel={false}
          size="large"
        />
        <Controls
          variant="focus"
          state={state}
          onStart={onStart}
          onPause={onPause}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
