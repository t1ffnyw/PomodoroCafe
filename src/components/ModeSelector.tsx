// ModeSelector component to select the mode of the timer
// pomodoro, short break, long break

import type { TimerMode } from "@/types/timer";

type ModeSelectorProps = {
  mode: TimerMode;
  onSelect: (mode: TimerMode) => void;
};

const modes: { id: TimerMode; label: string }[] = [
  { id: "focus", label: "pomodoro" },
  { id: "break", label: "short break" },
  { id: "longBreak", label: "long break" },
];

export function ModeSelector({ mode, onSelect }: ModeSelectorProps) {
  return (
    <div className="flex gap-2">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={`btn btn-tab ${mode === m.id ? "btn--wood" : "btn--cream"}`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
