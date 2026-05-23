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
          className={`rounded-lg px-4 py-2 font-body text-sm font-semibold transition-colors ${
            mode === m.id
              ? "bg-cafe-wood text-white shadow-sm"
              : "bg-cafe-cream text-cafe-text hover:bg-cafe-sage-light"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
