"use client";

import { formatRaceGap } from "@/lib/domain/dashboard";
import type {
  DriverLiveTiming,
  FastestLapInfo,
  LeaderboardRow,
  RaceDashboardSnapshot,
  WeatherSample,
} from "@/lib/domain/types";
import { formatLapTime } from "@/lib/format";

function compoundClass(compound: string | null): string {
  switch (compound) {
    case "S":
      return "bg-[#e10600] text-white";
    case "M":
      return "bg-[#f5d100] text-black";
    case "H":
      return "bg-[#f5f5f5] text-black";
    case "I":
      return "bg-[#43b02a] text-black";
    case "W":
      return "bg-[#00a3e0] text-black";
    default:
      return "bg-[var(--border)] text-[var(--muted)]";
  }
}

function formatElapsed(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) {
    return "—";
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds - minutes * 60;
  const whole = Math.floor(remaining);
  const millis = Math.floor((remaining - whole) * 1000)
    .toString()
    .padStart(3, "0");
  return `${minutes.toString().padStart(2, "0")}.${whole
    .toString()
    .padStart(2, "0")}.${millis}`;
}

function deltaTone(delta: number | null): string {
  if (delta === null || delta === 0) {
    return "text-[var(--muted)]";
  }
  return delta < 0 ? "text-emerald-400" : "text-[var(--accent)]";
}

export function RaceDashboardHeader({
  circuitLabel,
  lapLabel,
  fastestLap,
  fastestDriverAcronym,
  weather,
}: {
  circuitLabel: string;
  lapLabel: string;
  fastestLap: FastestLapInfo | null;
  fastestDriverAcronym: string | null;
  weather: WeatherSample | null;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
      <div>
        <p className="field-label">Race control</p>
        <p className="font-[family-name:var(--font-teko)] text-2xl uppercase leading-none tracking-wide text-[var(--accent)] md:text-3xl">
          {circuitLabel}{" "}
          <span className="text-white">{lapLabel}</span>
        </p>
      </div>

      <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
        {fastestLap ? (
          <p>
            Fastest lap{" "}
            <span className="text-white">
              {formatLapTime(fastestLap.lapTimeSeconds)}
            </span>
            {fastestDriverAcronym ? (
              <span className="ml-2 text-[var(--accent)]">
                {fastestDriverAcronym}
              </span>
            ) : null}
          </p>
        ) : (
          <p>Fastest lap —</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
        <span>
          Track{" "}
          <span className="text-white">
            {weather?.trackTempC !== null && weather?.trackTempC !== undefined
              ? `${Math.round(weather.trackTempC)}°C`
              : "—"}
          </span>
        </span>
        <span>
          Air{" "}
          <span className="text-white">
            {weather?.airTempC !== null && weather?.airTempC !== undefined
              ? `${Math.round(weather.airTempC)}°C`
              : "—"}
          </span>
        </span>
        <span>
          Rain{" "}
          <span className="text-white">
            {weather ? (weather.rainfall ? "Yes" : "No") : "—"}
          </span>
        </span>
      </div>
    </div>
  );
}

export function RaceLeaderboard({
  rows,
  highlightDriverIds,
}: {
  rows: LeaderboardRow[];
  highlightDriverIds: string[];
}) {
  if (rows.length === 0) {
    return null;
  }

  const highlight = new Set(highlightDriverIds);

  return (
    <div className="max-h-72 overflow-auto border border-[var(--border)] bg-black/70 backdrop-blur-sm">
      <div className="sticky top-0 grid grid-cols-[28px_minmax(0,1fr)_64px_36px] gap-1 border-b border-[var(--border)] bg-black/80 px-2 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]">
        <span>Pos</span>
        <span>Driver</span>
        <span className="text-right">Gap</span>
        <span className="text-right">Tyre</span>
      </div>
      {rows.map((row) => {
        const active = highlight.has(row.driver.id);
        return (
          <div
            key={row.driver.id}
            className="grid grid-cols-[28px_minmax(0,1fr)_64px_36px] items-center gap-1 px-2 py-1 text-xs"
            style={
              active
                ? {
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.06)",
                  }
                : undefined
            }
          >
            <span className="font-medium text-[var(--muted)]">
              {row.position}
            </span>
            <span className="truncate font-medium" style={{ color: row.driver.teamColour }}>
              {row.driver.acronym}
            </span>
            <span className="text-right tabular-nums text-[var(--muted)]">
              {formatRaceGap(row.interval)}
            </span>
            <span className="flex justify-end">
              {row.compound ? (
                <span
                  className={`inline-flex h-4 min-w-4 items-center justify-center px-1 text-[0.62rem] font-bold ${compoundClass(row.compound)}`}
                  title={
                    row.tyreAgeLaps !== null
                      ? `${row.compound} · ${row.tyreAgeLaps}L`
                      : row.compound
                  }
                >
                  {row.compound}
                </span>
              ) : (
                <span className="text-[var(--muted)]">—</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TimingBlock({
  label,
  timing,
  colour,
}: {
  label: string;
  timing: DriverLiveTiming;
  colour: string;
}) {
  return (
    <div className="border border-[var(--border)] bg-black/70 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="field-label">{label}</p>
        <p
          className="font-[family-name:var(--font-teko)] text-xl uppercase leading-none"
          style={{ color: colour }}
        >
          {timing.position ? `P${timing.position}` : "—"}
        </p>
      </div>

      <div className="space-y-1.5 text-xs uppercase tracking-[0.12em]">
        <TimingRow
          label="Current"
          value={formatElapsed(timing.currentLapElapsedSeconds)}
          valueClass="text-cyan-300"
        />
        <TimingRow
          label="Delta"
          value={
            timing.deltaToBestSeconds === null
              ? "—"
              : `${timing.deltaToBestSeconds > 0 ? "+" : ""}${timing.deltaToBestSeconds.toFixed(3)}`
          }
          valueClass={deltaTone(timing.deltaToBestSeconds)}
        />
        <TimingRow
          label="Last"
          value={formatLapTime(timing.lastLapSeconds)}
        />
        <TimingRow
          label="Best"
          value={formatLapTime(timing.bestLapSeconds)}
          valueClass="text-emerald-400"
        />
        <TimingRow
          label="Gap"
          value={formatRaceGap(timing.gapToLeader)}
        />
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[var(--muted)]">Tyre</span>
          <span className="flex items-center gap-2">
            {timing.compound ? (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center px-1 text-xs font-bold ${compoundClass(timing.compound)}`}
              >
                {timing.compound}
              </span>
            ) : (
              <span>—</span>
            )}
            <span className="tabular-nums text-white">
              {timing.tyreAgeLaps !== null ? `${timing.tyreAgeLaps}L` : "—"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function TimingRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`tabular-nums ${valueClass ?? "text-white"}`}>{value}</span>
    </div>
  );
}

export function RaceLiveTiming({
  snapshot,
  colourA,
  colourB,
  labelA,
  labelB,
}: {
  snapshot: RaceDashboardSnapshot;
  colourA: string;
  colourB?: string;
  labelA: string;
  labelB?: string;
}) {
  if (!snapshot.focused) {
    return null;
  }

  return (
    <div className="space-y-2">
      <TimingBlock
        label={labelA}
        timing={snapshot.focused}
        colour={colourA}
      />
      {snapshot.focusedB && colourB && labelB ? (
        <TimingBlock
          label={labelB}
          timing={snapshot.focusedB}
          colour={colourB}
        />
      ) : null}
    </div>
  );
}
