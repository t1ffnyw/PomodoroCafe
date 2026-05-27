// Cycle tracker for the timer to show the current cycle and the total cycles

type CycleTrackerProps = {
  current: number;
  total: number;
};

export function CycleTracker({ current, total }: CycleTrackerProps) {
  const currentCycle = Math.min(current + 1, total);

  return (
    <div className="chip flex items-center gap-3">
      <span className="font-body text-sm font-semibold text-cafe-text">
        cycle: {currentCycle}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`text-lg transition-opacity ${
              i < current ? "opacity-100" : "opacity-30"
            }`}
          >
            🍵
          </span>
        ))}
      </div>
    </div>
  );
}
