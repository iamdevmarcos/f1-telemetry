"use client";

import type { DriverComparison } from "@/lib/domain/types";
import { metricDelta } from "@/lib/domain/analysis/lap-metrics";
import {
  formatDelta,
  formatLapTime,
  formatSector,
} from "@/lib/format";

function deltaClass(delta: number | null): string {
  if (delta === null || delta === 0) {
    return "delta-neutral";
  }
  return delta < 0 ? "delta-faster" : "delta-slower";
}

function formatSpeed(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(0)} km/h`;
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

function formatMetricDelta(
  delta: number | null,
  unit: "speed" | "percent",
): string {
  if (delta === null || !Number.isFinite(delta)) {
    return "—";
  }

  const sign = delta > 0 ? "+" : "";
  if (unit === "speed") {
    return `${sign}${delta.toFixed(0)} km/h`;
  }

  return `${sign}${delta.toFixed(1)}%`;
}

export function ComparisonPanel({
  comparison,
}: {
  comparison: DriverComparison;
}) {
  const { driverA, driverB, metricsA, metricsB } = comparison;

  const insightRows = [
    {
      label: "Top speed",
      valueA: formatSpeed(metricsA.maxSpeedKph),
      valueB: formatSpeed(metricsB.maxSpeedKph),
      delta: metricDelta(metricsA.maxSpeedKph, metricsB.maxSpeedKph),
      deltaUnit: "speed" as const,
      higherIsBetterForA: true,
    },
    {
      label: "Avg speed",
      valueA: formatSpeed(metricsA.avgSpeedKph),
      valueB: formatSpeed(metricsB.avgSpeedKph),
      delta: metricDelta(metricsA.avgSpeedKph, metricsB.avgSpeedKph),
      deltaUnit: "speed" as const,
      higherIsBetterForA: true,
    },
    {
      label: "Avg throttle",
      valueA: formatPercent(metricsA.avgThrottlePercent),
      valueB: formatPercent(metricsB.avgThrottlePercent),
      delta: metricDelta(metricsA.avgThrottlePercent, metricsB.avgThrottlePercent),
      deltaUnit: "percent" as const,
      higherIsBetterForA: null,
    },
    {
      label: "Full throttle",
      valueA: formatPercent(metricsA.fullThrottlePercent),
      valueB: formatPercent(metricsB.fullThrottlePercent),
      delta: metricDelta(
        metricsA.fullThrottlePercent,
        metricsB.fullThrottlePercent,
      ),
      deltaUnit: "percent" as const,
      higherIsBetterForA: null,
    },
    {
      label: "Braking",
      valueA: formatPercent(metricsA.brakingPercent),
      valueB: formatPercent(metricsB.brakingPercent),
      delta: metricDelta(metricsA.brakingPercent, metricsB.brakingPercent),
      deltaUnit: "percent" as const,
      higherIsBetterForA: false,
    },
  ];

  return (
    <section className="panel animate-rise p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">Head to head</p>
          <h2 className="font-[family-name:var(--font-teko)] text-3xl uppercase leading-none tracking-wide md:text-4xl">
            <span style={{ color: driverA.teamColour }}>{driverA.acronym}</span>
            <span className="mx-2 text-[var(--muted)]">vs</span>
            <span style={{ color: driverB.teamColour }}>{driverB.acronym}</span>
            <span className="ml-3 text-[var(--muted)]">· Lap {comparison.lapNumber}</span>
          </h2>
        </div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          Negative delta = Driver A faster
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TimingTile
          label="Lap"
          valueA={formatLapTime(comparison.lapTimeA)}
          valueB={formatLapTime(comparison.lapTimeB)}
          delta={comparison.lapTimeDelta}
          colourA={driverA.teamColour}
          colourB={driverB.teamColour}
        />
        {comparison.sectors.map((sector) => (
          <TimingTile
            key={sector.sector}
            label={`S${sector.sector}`}
            valueA={formatSector(sector.timeA)}
            valueB={formatSector(sector.timeB)}
            delta={sector.deltaSeconds}
            colourA={driverA.teamColour}
            colourB={driverB.teamColour}
          />
        ))}
      </div>

      <div className="mt-5 border-t border-[var(--border)] pt-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="field-label">Driving profile</p>
            <h3 className="font-[family-name:var(--font-teko)] text-2xl uppercase leading-none tracking-wide">
              Why was one faster?
            </h3>
          </div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            Derived from lap telemetry
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {insightRows.map((row) => (
            <InsightTile
              key={row.label}
              label={row.label}
              valueA={row.valueA}
              valueB={row.valueB}
              delta={row.delta}
              deltaUnit={row.deltaUnit}
              higherIsBetterForA={row.higherIsBetterForA}
              colourA={driverA.teamColour}
              colourB={driverB.teamColour}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TimingTile({
  label,
  valueA,
  valueB,
  delta,
  colourA,
  colourB,
}: {
  label: string;
  valueA: string;
  valueB: string;
  delta: number | null;
  colourA: string;
  colourB: string;
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
      <p className="field-label mb-2">{label}</p>
      <p className="delta-value text-xl" style={{ color: colourA }}>
        {valueA}
      </p>
      <p className="delta-value text-xl" style={{ color: colourB }}>
        {valueB}
      </p>
      <p className={`delta-value mt-2 text-2xl font-medium ${deltaClass(delta)}`}>
        {formatDelta(delta)}
      </p>
    </div>
  );
}

function InsightTile({
  label,
  valueA,
  valueB,
  delta,
  deltaUnit,
  higherIsBetterForA,
  colourA,
  colourB,
}: {
  label: string;
  valueA: string;
  valueB: string;
  delta: number | null;
  deltaUnit: "speed" | "percent";
  higherIsBetterForA: boolean | null;
  colourA: string;
  colourB: string;
}) {
  const insightClass =
    higherIsBetterForA === null || delta === null || delta === 0
      ? "delta-neutral"
      : (delta > 0 && higherIsBetterForA) || (delta < 0 && !higherIsBetterForA)
        ? "delta-faster"
        : "delta-slower";

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
      <p className="field-label mb-2">{label}</p>
      <p className="text-lg" style={{ color: colourA }}>
        {valueA}
      </p>
      <p className="text-lg" style={{ color: colourB }}>
        {valueB}
      </p>
      <p className={`mt-2 text-sm font-medium uppercase tracking-[0.12em] ${insightClass}`}>
        {formatMetricDelta(delta, deltaUnit)}
      </p>
    </div>
  );
}
