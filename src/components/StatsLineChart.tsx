import { useState } from "react";
import type { ChartDataPoint } from "@/types/progress";

type StatsLineChartProps = {
  points: ChartDataPoint[];
  unit: string;
};

export function StatsLineChart({ points, unit }: StatsLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const rawMax = Math.max(...points.map((p) => p.value), 0);
  const maxVal = rawMax > 0 ? rawMax : 10;

  const width = 320;
  const height = 130;
  const padLeft = 24;
  const padRight = 20;
  const padTop = 22;
  const padBottom = 26;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const baselineY = padTop + plotHeight;

  const count = points.length;

  const coords = points.map((p, i) => {
    const x = padLeft + (i / Math.max(1, count - 1)) * plotWidth;
    const y = baselineY - (p.value / maxVal) * plotHeight;
    return { x, y, point: p, index: i };
  });

  const linePath = coords.reduce(
    (acc, curr, i) => (i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
    "",
  );

  const first = coords[0];
  const last = coords[coords.length - 1];
  const areaPath =
    first && last
      ? `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`
      : "";

  const hoveredCoord = hoveredIdx !== null ? coords[hoveredIdx] : null;

  return (
    <div className="relative flex flex-col items-center">
      {/* Tooltip display */}
      <div className="flex h-5 items-center justify-between w-full px-1 mb-1 font-body text-xs text-cafe-text-light">
        <span>
          {hoveredCoord ? (
            <span className="font-medium text-cafe-text">
              Day {hoveredCoord.point.label}: {hoveredCoord.point.value} {unit}
            </span>
          ) : rawMax === 0 ? (
            <span className="italic">No focus recorded this month</span>
          ) : (
            <span>Hover line for daily values</span>
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
        <defs>
          <linearGradient id="monthAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-cafe-matcha, #8ba878)"
              stopOpacity="0.35"
            />
            <stop
              offset="100%"
              stopColor="var(--color-cafe-matcha, #8ba878)"
              stopOpacity="0.0"
            />
          </linearGradient>
        </defs>

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

        {/* Area fill */}
        {rawMax > 0 && areaPath && (
          <path d={areaPath} fill="url(#monthAreaGrad)" />
        )}

        {/* Line stroke */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-cafe-matcha, #8ba878)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={rawMax > 0 ? 1 : 0.4}
        />

        {/* Hover vertical indicator */}
        {hoveredCoord && (
          <line
            x1={hoveredCoord.x}
            y1={padTop}
            x2={hoveredCoord.x}
            y2={baselineY}
            stroke="var(--color-cafe-text-light, #8a7e74)"
            strokeOpacity="0.4"
            strokeDasharray="2 2"
          />
        )}

        {/* Interactive points & hover regions */}
        {coords.map((c) => {
          const dayNum = parseInt(c.point.label, 10);
          const isKeyLabel =
            dayNum === 1 ||
            dayNum === 5 ||
            dayNum === 10 ||
            dayNum === 15 ||
            dayNum === 20 ||
            dayNum === 25 ||
            dayNum === count;
          const isHovered = hoveredIdx === c.index;
          const hasValue = c.point.value > 0;

          // Slot width for hit detection
          const hitWidth = plotWidth / (count || 1);

          return (
            <g
              key={c.point.key}
              onMouseEnter={() => setHoveredIdx(c.index)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Invisible vertical hit strip */}
              <rect
                x={c.x - hitWidth / 2}
                y={padTop}
                width={hitWidth}
                height={plotHeight + padBottom}
                fill="transparent"
              />

              {/* Point circle */}
              {(hasValue || isHovered) && (
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 4.5 : 2.5}
                  fill="var(--color-cafe-cream, #fdf6ee)"
                  stroke={
                    isHovered
                      ? "var(--color-cafe-wood, #c4956a)"
                      : "var(--color-cafe-matcha, #8ba878)"
                  }
                  strokeWidth="2"
                  className="transition-transform duration-100"
                />
              )}

              {/* X Axis sparse labels */}
              {isKeyLabel && (
                <text
                  x={c.x}
                  y={baselineY + 16}
                  textAnchor="middle"
                  className="font-body text-[10px] fill-cafe-text-light select-none"
                >
                  {c.point.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
