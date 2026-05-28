// Cycle tracker for the timer to show the current cycle and the total cycles

type CycleTrackerProps = {
  current: number;
  total: number;
  cycleIcon: string;
};

export function CycleTracker({ current, total, cycleIcon }: CycleTrackerProps) {
  const currentCycle = Math.min(current + 1, total);

  return (
    <div className="chip flex items-center gap-3">
      <span className="font-body text-sm font-semibold text-cafe-text">
        cycle: {currentCycle}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <img
            key={i}
            src={cycleIcon}
            alt=""
            className={`h-6 w-6 object-contain pixelated transition-opacity ${
              i < current ? "opacity-100" : "opacity-30"
            }`}
            style={{ imageRendering: "pixelated" }}
          />
        ))}
      </div>
    </div>
  );
}
