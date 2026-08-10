"use client";

import { useMemo } from "react";

import type { ReplayFrame, TrackPoint } from "@/lib/domain/types";

export interface TrackCar {
  frame: ReplayFrame | null;
  trail: TrackPoint[];
  colour: string;
  label: string;
}

function buildViewBox(points: TrackPoint[], padding = 80) {
  if (points.length === 0) {
    return { minX: 0, minY: 0, width: 1000, height: 1000 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return {
    minX: minX - padding,
    minY: minY - padding,
    width: Math.max(maxX - minX + padding * 2, 1),
    height: Math.max(maxY - minY + padding * 2, 1),
  };
}

function flipY(point: TrackPoint): TrackPoint {
  return { x: point.x, y: -point.y };
}

function toPath(points: TrackPoint[]): string {
  if (points.length === 0) {
    return "";
  }

  return points
    .map((point, index) => {
      const flipped = flipY(point);
      return `${index === 0 ? "M" : "L"} ${flipped.x} ${flipped.y}`;
    })
    .join(" ");
}

export function TrackMap({
  trackPath,
  cars,
}: {
  trackPath: TrackPoint[];
  cars: TrackCar[];
}) {
  const bounds = useMemo(() => {
    const points = [
      ...trackPath,
      ...cars.flatMap((car) => [
        ...car.trail,
        ...(car.frame ? [{ x: car.frame.x, y: car.frame.y }] : []),
      ]),
    ].map(flipY);
    return buildViewBox(points);
  }, [trackPath, cars]);

  const trackD = useMemo(() => toPath(trackPath), [trackPath]);
  const strokeBase = Math.max(bounds.width, bounds.height);

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden border border-[var(--border)] bg-[#0a0b0e]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(225,6,0,0.12), transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.04), transparent 40%)",
        }}
      />
      <svg
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={trackD}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={strokeBase * 0.012}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {cars.map((car) => {
          const trailD = toPath(car.trail);
          const carPoint = car.frame
            ? flipY({ x: car.frame.x, y: car.frame.y })
            : null;

          return (
            <g key={car.label}>
              <path
                d={trailD}
                fill="none"
                stroke={car.colour}
                strokeOpacity={0.7}
                strokeWidth={strokeBase * 0.008}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {carPoint ? (
                <g>
                  <circle
                    cx={carPoint.x}
                    cy={carPoint.y}
                    r={strokeBase * 0.028}
                    fill={car.colour}
                    fillOpacity={0.18}
                  />
                  <circle
                    cx={carPoint.x}
                    cy={carPoint.y}
                    r={strokeBase * 0.014}
                    fill={car.colour}
                    stroke="#fff"
                    strokeWidth={strokeBase * 0.004}
                  />
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>

      {cars.length > 1 ? (
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          {cars.map((car) => (
            <span
              key={`legend-${car.label}`}
              className="border border-[var(--border)] bg-black/55 px-2 py-1 text-[0.68rem] uppercase tracking-[0.14em]"
            >
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full"
                style={{ background: car.colour }}
              />
              {car.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
