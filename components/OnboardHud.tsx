"use client";

import { formatDrsStatus } from "@/lib/domain/drs";
import type { Driver, DrsStatus, Lap, ReplayFrame } from "@/lib/domain/types";
import { formatLapTime } from "@/lib/format";

const RPM_MAX = 15000;

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function rpmTone(rpm: number): string {
  const ratio = rpm / RPM_MAX;
  if (ratio >= 0.92) {
    return "var(--accent)";
  }
  if (ratio >= 0.8) {
    return "#f5d100";
  }
  return "#43b02a";
}

function drsClasses(status: DrsStatus): string {
  switch (status) {
    case "on":
      return "border-emerald-400/70 bg-emerald-500/20 text-emerald-300";
    case "eligible":
      return "border-[#f5d100]/70 bg-[#f5d100]/15 text-[#f5d100]";
    case "off":
      return "border-white/15 bg-white/5 text-[var(--muted)]";
    default:
      return "border-white/10 bg-black/30 text-[var(--muted)]";
  }
}

function MeterBar({
  label,
  value,
  display,
  color,
}: {
  label: string;
  value: number;
  display: string;
  color: string;
}) {
  const width = clampPercent(value);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-[0.62rem] uppercase tracking-[0.14em]">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="tabular-nums text-white">{display}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm border border-white/10 bg-black/50">
        <div
          className="h-full transition-[width] duration-100 ease-out"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function OnboardHud({
  driver,
  colour,
  frame,
  lap,
}: {
  driver: Driver;
  colour: string;
  frame: ReplayFrame | null;
  lap: Lap | undefined;
}) {
  const speed = Math.round(frame?.speed ?? 0);
  const gear = frame?.gear ?? 0;
  const throttle = clampPercent(frame?.throttle ?? 0);
  const brake = clampPercent(frame?.brake ?? 0);
  const rpm = Math.max(0, Math.round(frame?.rpm ?? 0));
  const rpmPercent = clampPercent((rpm / RPM_MAX) * 100);
  const drs = frame?.drs ?? "unknown";

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p
          className="font-[family-name:var(--font-teko)] text-2xl uppercase leading-none"
          style={{ color: colour }}
        >
          {driver.acronym}
        </p>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          Lap {frame?.lapNumber ?? "—"} ·{" "}
          {formatLapTime(lap?.lapTimeSeconds ?? null)}
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <p className="field-label mb-0.5">Speed</p>
          <p className="font-[family-name:var(--font-teko)] text-4xl leading-none tracking-wide">
            {speed}
            <span className="ml-1 text-sm text-[var(--muted)]">km/h</span>
          </p>
        </div>
        <div className="text-right">
          <p className="field-label mb-0.5">Gear</p>
          <p className="font-[family-name:var(--font-teko)] text-5xl leading-none">
            {gear}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        <MeterBar
          label="Rpm"
          value={rpmPercent}
          display={`${(rpm / 1000).toFixed(1)}k`}
          color={rpmTone(rpm)}
        />
        <MeterBar
          label="Throttle"
          value={throttle}
          display={`${Math.round(throttle)}%`}
          color="#43b02a"
        />
        <MeterBar
          label="Brake"
          value={brake}
          display={`${Math.round(brake)}%`}
          color="var(--accent)"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5">
        <span className="text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]">
          Drs
        </span>
        <span
          className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-sm border px-2 py-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] ${drsClasses(drs)}`}
        >
          {formatDrsStatus(drs)}
        </span>
      </div>
    </div>
  );
}
