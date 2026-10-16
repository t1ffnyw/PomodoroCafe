import { useState } from "react";
import { motion } from "framer-motion";
import type { ProgressMetric, ProgressRange, ProgressViewData } from "@/types/progress";
import { StatsBarChart } from "./StatsBarChart";
import { StatsLineChart } from "./StatsLineChart";

type StatsPopupProps = {
  getView: (range: ProgressRange, metric: ProgressMetric) => ProgressViewData;
  onClose: () => void;
};

export function StatsPopup({ getView, onClose }: StatsPopupProps) {
  const [range, setRange] = useState<ProgressRange>("day");
  const [metric, setMetric] = useState<ProgressMetric>("minutes");

  const data = getView(range, metric);
  const { summary } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="popup w-96 max-w-[calc(100vw-2rem)] flex flex-col gap-3.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-cafe-text">
          Study Progress
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-cafe-text-light hover:text-cafe-text transition-colors p-1"
          aria-label="Close study progress"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Range toggle (Day / Week / Month) */}
      <div className="flex rounded-lg bg-cafe-sage-light/60 p-0.5">
        {(["day", "week", "month"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`flex-1 rounded-md py-1 text-xs font-body font-medium transition-all ${
              range === r
                ? "bg-white text-cafe-text shadow-sm"
                : "text-cafe-text-light hover:text-cafe-text"
            }`}
          >
            {r === "day" ? "Day" : r === "week" ? "Week" : "Month"}
          </button>
        ))}
      </div>

      {/* Summary stats display */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-cafe-pink-light/40 p-2.5">
        {range === "day" ? (
          <>
            <div className="flex flex-col">
              <span className="font-body text-[11px] text-cafe-text-light">
                Today&apos;s Focus
              </span>
              <span className="font-display text-lg font-bold text-cafe-text">
                {summary.totalMinutes}{" "}
                <span className="font-body text-xs font-normal">min</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-body text-[11px] text-cafe-text-light">
                Completed Sessions
              </span>
              <span className="font-display text-lg font-bold text-cafe-text">
                {summary.totalSessions}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="font-body text-[11px] text-cafe-text-light">
                Daily Avg Time
              </span>
              <span className="font-display text-lg font-bold text-cafe-text">
                {summary.averageMinutesPerDay ?? 0}{" "}
                <span className="font-body text-xs font-normal">min/day</span>
              </span>
              <span className="font-body text-[10px] text-cafe-text-light opacity-75">
                Total: {summary.totalMinutes} min
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-body text-[11px] text-cafe-text-light">
                Daily Avg Sessions
              </span>
              <span className="font-display text-lg font-bold text-cafe-text">
                {summary.averageSessionsPerDay ?? 0}{" "}
                <span className="font-body text-xs font-normal">/day</span>
              </span>
              <span className="font-body text-[10px] text-cafe-text-light opacity-75">
                Total: {summary.totalSessions} sessions
              </span>
            </div>
          </>
        )}
      </div>

      {/* Metric toggle (Minutes | Sessions) */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="font-body text-xs text-cafe-text-light">
          Graph Metric
        </span>
        <div className="flex gap-1">
          {(["minutes", "sessions"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`rounded-md px-2.5 py-0.5 text-xs font-body transition-colors ${
                metric === m
                  ? "bg-cafe-matcha text-white font-medium"
                  : "bg-white/60 text-cafe-text-light hover:text-cafe-text"
              }`}
            >
              {m === "minutes" ? "Minutes" : "Sessions"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart visualization */}
      <div className="rounded-lg bg-white/70 p-2 border border-cafe-sage-light/50">
        {range === "month" ? (
          <StatsLineChart points={data.points} unit={data.unit} />
        ) : (
          <StatsBarChart
            points={data.points}
            unit={data.unit}
            isDayView={range === "day"}
          />
        )}
      </div>
    </motion.div>
  );
}
