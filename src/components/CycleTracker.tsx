type CycleTrackerProps = {
  current: number;
  total: number;
};

export function CycleTracker({ current, total }: CycleTrackerProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/60 px-5 py-2.5">
      <span className="font-body text-sm font-semibold text-cafe-text">
        cycle: {Math.min(current, total)}
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
