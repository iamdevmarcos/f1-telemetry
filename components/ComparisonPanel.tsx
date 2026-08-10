"use client";

import type { DriverComparison } from "@/lib/domain/types";
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

export function ComparisonPanel({
  comparison,
}: {
  comparison: DriverComparison;
}) {
  const { driverA, driverB } = comparison;

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
