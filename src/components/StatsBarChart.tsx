import { useState } from "react";
import type { ChartDataPoint } from "@/types/progress";

type StatsBarChartProps = {
  points: ChartDataPoint[];
  unit: string;
  isDayView?: boolean;
};

export function StatsBarChart({
  points,
  unit,
  isDayView = false,
}: StatsBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const rawMax = Math.max(...points.map((p) => p.value), 0);
  const maxVal = rawMax > 0 ? rawMax : 10;

  const width = 320;
  const height = 130;
  const padLeft = 28;
  const padRight = 16;
  const padTop = 22;
  const padBottom = 26;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const baselineY = padTop + plotHeight;

  const count = points.length;
  const slotWidth = plotWidth / (count || 1);
  const barWidth = isDayView ? Math.max(5, slotWidth * 0.6) : Math.min(22, slotWidth * 0.55);

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative flex flex-col items-center">
      {/* Tooltip display */}
      <div className="flex h-5 items-center justify-between w-full px-1 mb-1 font-body text-xs text-cafe-text-light">
        <span>
          {hoveredPoint ? (
            <span className="font-medium text-cafe-text">
              {hoveredPoint.label}: {hoveredPoint.value} {unit}
            </span>
          ) : rawMax === 0 ? (
            <span className="italic">No focus recorded yet</span>
          ) : (
            <span>Hover bars for details</span>
          )}
        </span>
        <span className="text-[10px] opacity-70">
          Max: {rawMax} {unit}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
      >
        {/* Top dashed guideline */}
        <line
          x1={padLeft}
          y1={padTop}
          x2={width - padRight}
          y2={padTop}
          stroke="var(--color-cafe-text-light, #8a7e74)"
          strokeOpacity="0.2"
          strokeDasharray="3 3"
        />

        {/* Baseline */}
        <line
          x1={padLeft}
          y1={baselineY}
          x2={width - padRight}
          y2={baselineY}
          stroke="var(--color-cafe-text-light, #8a7e74)"
          strokeOpacity="0.3"
          strokeWidth="1"
        />

        {/* Bars */}
        {points.map((p, idx) => {
          const barX = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
          const hasValue = p.value > 0;
          const barHeight = hasValue
            ? Math.max(4, (p.value / maxVal) * plotHeight)
            : 2;
          const barY = baselineY - barHeight;
          const isHovered = hoveredIdx === idx;

          // For day view, label selectively (12a, 6a, 12p, 6p, 11p)
          const showLabel = isDayView
            ? idx === 0 || idx === 6 || idx === 12 || idx === 18 || idx === 23
            : true;

          return (
            <g
              key={p.key}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Hit area */}
              <rect
                x={padLeft + idx * slotWidth}
                y={padTop}
                width={slotWidth}
                height={plotHeight + padBottom}
                fill="transparent"
              />

              {/* Bar */}
              <rect
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx={isDayView ? 2 : 3}
                fill={
                  hasValue
                    ? isHovered
                      ? "var(--color-cafe-wood, #c4956a)"
                      : "var(--color-cafe-matcha, #8ba878)"
                    : "var(--color-cafe-text-light, #8a7e74)"
                }
                opacity={hasValue ? (isHovered ? 1 : 0.85) : 0.25}
                className="transition-colors duration-150"
              />

              {/* X Axis Label */}
              {showLabel && (
                <text
                  x={padLeft + idx * slotWidth + slotWidth / 2}
                  y={baselineY + 16}
                  textAnchor="middle"
                  className="font-body text-[10px] fill-cafe-text-light select-none"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
