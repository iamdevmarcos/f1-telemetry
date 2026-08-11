"use client";

import { useMemo } from "react";

import type {
  ReplayFrame,
  TrackPoint,
  TrackSectorPath,
} from "@/lib/domain/types";

export interface TrackCar {
  frame: ReplayFrame | null;
  trailSegments: TrackPoint[][];
  colour: string;
  label: string;
}

const SECTOR_STYLE: Record<
  1 | 2 | 3,
  { idle: string; active: string; label: string }
> = {
  1: {
    idle: "rgba(245, 209, 0, 0.28)",
    active: "rgba(245, 209, 0, 0.9)",
    label: "#f5d100",
  },
  2: {
    idle: "rgba(67, 176, 42, 0.28)",
    active: "rgba(67, 176, 42, 0.95)",
    label: "#43b02a",
  },
  3: {
    idle: "rgba(160, 32, 240, 0.3)",
    active: "rgba(190, 80, 255, 0.95)",
    label: "#c060ff",
  },
};

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
  if (points.length < 2) {
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
  trackSectors,
  activeSector,
  cars,
  className,
}: {
  trackPath: TrackPoint[];
  trackSectors?: TrackSectorPath[];
  activeSector?: 1 | 2 | 3 | null;
  cars: TrackCar[];
  className?: string;
}) {
  const bounds = useMemo(
    () => buildViewBox(trackPath.map(flipY)),
    [trackPath],
  );

  const trackD = useMemo(() => toPath(trackPath), [trackPath]);
  const sectorPaths = useMemo(
    () =>
      (trackSectors ?? []).map((sector) => ({
        sector: sector.sector,
        d: toPath(sector.points),
      })),
    [trackSectors],
  );
  const strokeBase = Math.max(bounds.width, bounds.height);
  const hasSectors = sectorPaths.some((entry) => entry.d);

  return (
    <div
      className={`relative w-full overflow-hidden border border-[var(--border)] bg-[#0a0b0e] ${
        className ?? "h-[min(42vh,420px)]"
      }`}
    >
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
        {hasSectors ? (
          sectorPaths.map((entry) => {
            if (!entry.d) {
              return null;
            }
            const active = activeSector === entry.sector;
            const style = SECTOR_STYLE[entry.sector];
            return (
              <path
                key={`sector-${entry.sector}`}
                d={entry.d}
                fill="none"
                stroke={active ? style.active : style.idle}
                strokeWidth={strokeBase * (active ? 0.016 : 0.012)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })
        ) : (
          <path
            d={trackD}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={strokeBase * 0.012}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {cars.map((car, carIndex) => {
          const carPoint = car.frame
            ? flipY({ x: car.frame.x, y: car.frame.y })
            : null;

          return (
            <g key={`${car.label}-${carIndex}`}>
              {car.trailSegments.map((segment, segmentIndex) => {
                const trailD = toPath(segment);
                if (!trailD) {
                  return null;
                }

                return (
                  <path
                    key={`${car.label}-trail-${segmentIndex}`}
                    d={trailD}
                    fill="none"
                    stroke={car.colour}
                    strokeOpacity={0.7}
                    strokeWidth={strokeBase * 0.008}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}
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

      {hasSectors ? (
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {([1, 2, 3] as const).map((sector) => {
            const active = activeSector === sector;
            return (
              <span
                key={`sector-legend-${sector}`}
                className="border border-[var(--border)] bg-black/60 px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.14em]"
                style={{
                  color: active ? "#fff" : "var(--muted)",
                  boxShadow: active
                    ? `inset 0 -2px 0 ${SECTOR_STYLE[sector].label}`
                    : undefined,
                }}
              >
                S{sector}
              </span>
            );
          })}
        </div>
      ) : null}

      {cars.length > 1 ? (
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          {cars.map((car, carIndex) => (
            <span
              key={`legend-${car.label}-${carIndex}`}
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
