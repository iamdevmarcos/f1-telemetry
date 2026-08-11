"use client";

import { formatRaceGap } from "@/lib/domain/dashboard";
import type {
  DriverLiveTiming,
  FastestLapInfo,
  LeaderboardRow,
  RaceDashboardSnapshot,
  SectorTiming,
  SectorTone,
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
    <div className="flex flex-wrap items-end justify-between gap-2 border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 md:gap-3 md:py-2">
      <div>
        <p className="field-label">Race control</p>
        <p className="font-[family-name:var(--font-teko)] text-xl uppercase leading-none tracking-wide text-[var(--accent)] md:text-2xl xl:text-3xl">
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

function sectorToneClass(tone: SectorTone): string {
  switch (tone) {
    case "purple":
      return "bg-[#a020f0] text-white";
    case "green":
      return "bg-[#43b02a] text-black";
    case "yellow":
      return "bg-[#f5d100] text-black";
    default:
      return "bg-[var(--border)] text-[var(--muted)]";
  }
}

function SectorBars({ sectors }: { sectors: SectorTiming[] }) {
  return (
    <div className="flex items-center gap-0.5" title="Last lap sectors">
      {sectors.map((sector, index) => (
        <span
          key={index}
          className={`inline-block h-2.5 w-3 ${sectorToneClass(sector.tone)}`}
          title={
            sector.seconds !== null
              ? `S${index + 1} ${formatLapTime(sector.seconds)}`
              : `S${index + 1}`
          }
        />
      ))}
    </div>
  );
}

export function RaceLeaderboard({
  rows,
  highlightDriverIds,
  variant = "panel",
  embedded = false,
  fillHeight = false,
}: {
  rows: LeaderboardRow[];
  highlightDriverIds: string[];
  variant?: "panel" | "overlay";
  embedded?: boolean;
  fillHeight?: boolean;
}) {
  if (rows.length === 0) {
    return null;
  }

  const highlight = new Set(highlightDriverIds);
  const overlay = variant === "overlay";

  const headerRow = (
    <div
      className={
        overlay
          ? "grid shrink-0 grid-cols-[18px_30px_44px_44px_24px_minmax(40px,1fr)] gap-0.5 border-b border-white/10 bg-black/85 px-1.5 py-1 text-[0.5rem] uppercase tracking-[0.1em] text-[var(--muted)]"
          : "sticky top-0 grid min-w-[420px] grid-cols-[28px_44px_58px_58px_44px_36px_36px_minmax(52px,1fr)] gap-1 border-b border-[var(--border)] bg-black/80 px-2 py-1 text-[0.58rem] uppercase tracking-[0.12em] text-[var(--muted)]"
      }
    >
      <span>Pos</span>
      <span>Drv</span>
      <span className="text-right">Last</span>
      <span className="text-right">Best</span>
      {overlay ? null : <span>Sec</span>}
      <span className="text-right">Tyre</span>
      {overlay ? null : <span className="text-right">Pit</span>}
      <span className="text-right">Gap</span>
    </div>
  );

  const bodyRows = rows.map((row) => {
    const active = highlight.has(row.driver.id);
    return (
      <div
        key={row.driver.id}
        className={
          overlay
            ? "grid grid-cols-[18px_30px_44px_44px_24px_minmax(40px,1fr)] items-center gap-0.5 px-1.5 py-0.5 text-[0.62rem]"
            : "grid min-w-[420px] grid-cols-[28px_44px_58px_58px_44px_36px_36px_minmax(52px,1fr)] items-center gap-1 px-2 py-1 text-[0.7rem]"
        }
        style={
          active
            ? {
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.55)",
                background: "rgba(255,255,255,0.06)",
              }
            : undefined
        }
      >
        <span className="font-medium text-[var(--muted)]">{row.position}</span>
        <span
          className="truncate font-medium"
          style={{ color: row.driver.teamColour }}
        >
          {row.driver.acronym}
        </span>
        <span className="text-right tabular-nums text-white">
          {formatLapTime(row.lastLapSeconds)}
        </span>
        <span className="text-right tabular-nums text-emerald-400">
          {formatLapTime(row.bestLapSeconds)}
        </span>
        {overlay ? null : <SectorBars sectors={row.sectors} />}
        <span className="flex justify-end">
          {row.compound ? (
            <span
              className={`inline-flex h-3.5 min-w-3.5 items-center justify-center px-0.5 text-[0.5rem] font-bold ${compoundClass(row.compound)}`}
              title={
                row.tyreAgeLaps !== null
                  ? `${row.compound} · ${row.tyreAgeLaps}L`
                  : row.compound
              }
            >
              {overlay
                ? row.compound
                : `${row.compound}${row.tyreAgeLaps !== null ? row.tyreAgeLaps : ""}`}
            </span>
          ) : (
            <span className="text-[var(--muted)]">—</span>
          )}
        </span>
        {overlay ? null : (
          <span
            className="text-right tabular-nums text-[var(--muted)]"
            title={
              row.lastPitLap !== null ? `Last pit L${row.lastPitLap}` : undefined
            }
          >
            {row.pitCount > 0 ? row.pitCount : "—"}
          </span>
        )}
        <span className="text-right tabular-nums text-[var(--muted)]">
          {formatRaceGap(row.interval)}
        </span>
      </div>
    );
  });

  if (embedded) {
    return (
      <>
        {headerRow}
        {bodyRows}
      </>
    );
  }

  if (overlay && fillHeight) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-white/10 bg-black/80 shadow-lg backdrop-blur-md">
        {headerRow}
        <div className="standings-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {bodyRows}
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        overlay
          ? "rounded-sm border border-white/10 bg-black/80 shadow-lg backdrop-blur-md"
          : "max-h-56 overflow-auto border border-[var(--border)] bg-black/70 backdrop-blur-sm md:max-h-64 xl:max-h-80"
      }
    >
      {headerRow}
      {bodyRows}
    </div>
  );
}

function TimingBlock({
  label,
  timing,
  colour,
  sectors,
  compact = false,
  dense = false,
  stretch = false,
}: {
  label: string;
  timing: DriverLiveTiming;
  colour: string;
  sectors?: [SectorTiming, SectorTiming, SectorTiming];
  compact?: boolean;
  dense?: boolean;
  stretch?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? dense
            ? `rounded-sm border border-white/10 bg-black/75 p-1.5 shadow-lg backdrop-blur-md${
                stretch ? " flex min-h-0 flex-1 flex-col" : ""
              }`
            : `rounded-sm border border-white/10 bg-black/75 p-2 shadow-lg backdrop-blur-md${
                stretch ? " flex min-h-0 flex-1 flex-col" : ""
              }`
          : "border border-[var(--border)] bg-black/70 p-3 backdrop-blur-sm"
      }
    >
      <div
        className={`flex items-baseline justify-between gap-2 ${dense ? "mb-1" : "mb-2"}`}
      >
        <p className="field-label">{label}</p>
        <p
          className={`font-[family-name:var(--font-teko)] uppercase leading-none ${
            dense ? "text-lg" : "text-xl"
          }`}
          style={{ color: colour }}
        >
          {timing.position ? `P${timing.position}` : "—"}
        </p>
      </div>

      <div
        className={`uppercase tracking-[0.12em] ${
          dense
            ? "space-y-0.5 text-[0.65rem]"
            : "space-y-1.5 text-xs"
        }${stretch ? " flex min-h-0 flex-1 flex-col" : ""}`}
      >
        {dense ? null : (
          <>
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
          </>
        )}
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
        <div className={`flex items-center justify-between gap-2 ${dense ? "pt-0.5" : "pt-1"}`}>
          <span className="text-[var(--muted)]">Tyre</span>
          <span className="flex items-center gap-2">
            {timing.compound ? (
              <span
                className={`inline-flex items-center justify-center font-bold ${
                  dense
                    ? "h-4 min-w-4 px-0.5 text-[0.58rem]"
                    : "h-5 min-w-5 px-1 text-xs"
                } ${compoundClass(timing.compound)}`}
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
        {sectors ? (
          <div
            className={`flex items-center justify-between gap-2 border-t border-[var(--border)] ${
              dense ? "pt-1" : "pt-2"
            }`}
          >
            <span className="text-[var(--muted)]">Sec</span>
            <SectorBars sectors={sectors} />
          </div>
        ) : null}
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
  variant = "panel",
  dense = false,
  fillHeight = false,
}: {
  snapshot: RaceDashboardSnapshot;
  colourA: string;
  colourB?: string;
  labelA: string;
  labelB?: string;
  variant?: "panel" | "overlay";
  dense?: boolean;
  fillHeight?: boolean;
}) {
  if (!snapshot.focused) {
    return null;
  }

  const compact = variant === "overlay";
  const sectorsA = snapshot.leaderboard.find(
    (row) => row.driver.id === snapshot.focused?.driverId,
  )?.sectors;
  const sectorsB = snapshot.focusedB
    ? snapshot.leaderboard.find(
        (row) => row.driver.id === snapshot.focusedB?.driverId,
      )?.sectors
    : undefined;

  const stretch = compact && fillHeight;

  return (
    <div
      className={
        stretch
          ? `flex h-full flex-col ${dense ? "gap-1" : "gap-1.5"}`
          : compact
            ? dense
              ? "space-y-1"
              : "space-y-1.5"
            : "space-y-2"
      }
    >
      <TimingBlock
        label={labelA}
        timing={snapshot.focused}
        colour={colourA}
        sectors={sectorsA}
        compact={compact}
        dense={dense}
        stretch={stretch}
      />
      {snapshot.focusedB && colourB && labelB ? (
        <TimingBlock
          label={labelB}
          timing={snapshot.focusedB}
          colour={colourB}
          sectors={sectorsB}
          compact={compact}
          dense={dense}
          stretch={stretch}
        />
      ) : null}
    </div>
  );
}
