"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  RaceDashboardHeader,
  RaceLeaderboard,
  RaceLiveTiming,
} from "@/components/RaceDashboard";
import { OnboardHud } from "@/components/OnboardHud";
import { TrackMap } from "@/components/TrackMap";
import { snapshotRaceDashboard } from "@/lib/domain/dashboard";
import { buildCarTrailSegments } from "@/lib/domain/replay-trail";
import { resolveActiveSector } from "@/lib/domain/track-sectors";
import type {
  Driver,
  Lap,
  RaceReplay,
  ReplayFrame,
} from "@/lib/domain/types";

const SPEEDS = [1, 2, 4, 8, 16] as const;

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function findFrameIndex(frames: ReplayFrame[], timeSeconds: number): number {
  if (frames.length === 0) {
    return 0;
  }

  let low = 0;
  let high = frames.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (frames[mid]!.relativeTimeSeconds < timeSeconds) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  if (low > 0) {
    const current = frames[low]!;
    const previous = frames[low - 1]!;
    if (
      Math.abs(previous.relativeTimeSeconds - timeSeconds) <=
      Math.abs(current.relativeTimeSeconds - timeSeconds)
    ) {
      return low - 1;
    }
  }

  return low;
}

function resolveDriverColour(driver: Driver, fallback: string): string {
  return driver.teamColour || fallback;
}

function frameAtTime(frames: ReplayFrame[] | undefined, timeSeconds: number) {
  if (!frames || frames.length === 0) {
    return { frame: null as ReplayFrame | null, index: 0 };
  }

  const index = findFrameIndex(frames, timeSeconds);
  const frame = frames[index] ?? null;
  if (frame && frame.relativeTimeSeconds > timeSeconds + 2) {
    return { frame: null, index };
  }
  return { frame, index };
}

export function RaceReplayPlayer({
  replay,
  cinemaMode = false,
  racePlaceLabel,
}: {
  replay: RaceReplay;
  cinemaMode?: boolean;
  racePlaceLabel?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(4);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastStampRef = useRef<number | null>(null);

  const hasBattle = Boolean(replay.driverB && replay.framesB?.length);

  const primary = useMemo(
    () => frameAtTime(replay.frames, timeSeconds),
    [replay.frames, timeSeconds],
  );
  const secondary = useMemo(
    () => frameAtTime(replay.framesB, timeSeconds),
    [replay.framesB, timeSeconds],
  );

  const colourA = resolveDriverColour(replay.driver, "#ffffff");
  const colourB = resolveDriverColour(
    replay.driverB ?? replay.driver,
    "#e10600",
  );
  const distinctColourB =
    hasBattle && colourB.toLowerCase() === colourA.toLowerCase()
      ? "#f5f5f5"
      : colourB;

  const cars = useMemo(() => {
    const list = [
      {
        frame: primary.frame,
        trailSegments: buildCarTrailSegments(
          replay.frames,
          primary.index,
          replay.trackPath,
        ),
        colour: colourA,
        label: replay.driver.acronym,
      },
    ];

    if (hasBattle && replay.framesB) {
      list.push({
        frame: secondary.frame,
        trailSegments: buildCarTrailSegments(
          replay.framesB,
          secondary.index,
          replay.trackPath,
        ),
        colour: distinctColourB,
        label: replay.driverB!.acronym,
      });
    }

    return list;
  }, [
    primary,
    secondary,
    replay.frames,
    replay.framesB,
    replay.trackPath,
    replay.driver,
    replay.driverB,
    colourA,
    distinctColourB,
    hasBattle,
  ]);

  const currentLapA = findLap(replay.laps, primary.frame?.lapNumber);
  const currentLapB = findLap(replay.lapsB, secondary.frame?.lapNumber);
  const activeSector = resolveActiveSector({
    lap: currentLapA,
    frameTimestamp: primary.frame?.timestamp,
  });
  const lapDelta =
    primary.frame && secondary.frame
      ? primary.frame.lapNumber - secondary.frame.lapNumber
      : null;

  const dashboardSnapshot = useMemo(() => {
    if (!replay.dashboard) {
      return null;
    }

    return snapshotRaceDashboard({
      dashboard: replay.dashboard,
      timeSeconds,
      focusedDriver: replay.driver,
      focusedLaps: replay.laps,
      focusedFrames: replay.frames,
      focusedFrame: primary.frame,
      focusedDriverB: replay.driverB,
      focusedLapsB: replay.lapsB,
      focusedFramesB: replay.framesB,
      focusedFrameB: secondary.frame,
    });
  }, [replay, timeSeconds, primary.frame, secondary.frame]);

  const fastestDriverAcronym = useMemo(() => {
    if (!dashboardSnapshot?.fastestLap || !replay.dashboard) {
      return null;
    }
    return (
      replay.dashboard.drivers.find(
        (driver) => driver.id === dashboardSnapshot.fastestLap?.driverId,
      )?.acronym ?? null
    );
  }, [dashboardSnapshot, replay.dashboard]);

  useEffect(() => {
    if (!playing) {
      lastStampRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = (now: number) => {
      if (lastStampRef.current === null) {
        lastStampRef.current = now;
      }

      const delta = ((now - lastStampRef.current) / 1000) * speed;
      lastStampRef.current = now;

      setTimeSeconds((current) => {
        const next = current + delta;
        if (next >= replay.durationSeconds) {
          setPlaying(false);
          return replay.durationSeconds;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [playing, speed, replay.durationSeconds]);

  const mapStageClass = `replay-map-stage min-h-0${
    cinemaMode ? " replay-map-stage--cinema" : ""
  }`;

  const highlightDriverIds = [
    replay.driver.id,
    ...(replay.driverB ? [replay.driverB.id] : []),
  ];

  return (
    <section
      className={`panel replay-panel space-y-3 p-3 md:space-y-4 md:p-4${
        cinemaMode ? " replay-panel--cinema" : ""
      }`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="field-label">
            {cinemaMode ? "Race replay · cinema" : "Race replay"}
          </p>
          <h2 className="font-[family-name:var(--font-teko)] text-2xl uppercase leading-none tracking-wide md:text-3xl xl:text-4xl">
            <span style={{ color: colourA }}>{replay.driver.acronym}</span>
            {hasBattle ? (
              <>
                <span className="mx-2 text-[var(--muted)]">vs</span>
                <span style={{ color: distinctColourB }}>
                  {replay.driverB!.acronym}
                </span>
              </>
            ) : null}
            <span className="ml-2 text-[var(--muted)]">
              · Lap {primary.frame?.lapNumber ?? "—"}/{replay.totalLaps}
            </span>
          </h2>
          {hasBattle && lapDelta !== null ? (
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              {lapDelta === 0
                ? "Same lap"
                : lapDelta > 0
                  ? `${replay.driver.acronym} +${lapDelta} lap${lapDelta === 1 ? "" : "s"}`
                  : `${replay.driverB!.acronym} +${Math.abs(lapDelta)} lap${
                      Math.abs(lapDelta) === 1 ? "" : "s"
                    }`}
            </p>
          ) : null}
        </div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          {formatClock(timeSeconds)} / {formatClock(replay.durationSeconds)}
        </p>
      </div>

      {dashboardSnapshot ? (
        <div className="space-y-3 md:space-y-4">
          <RaceDashboardHeader
            circuitLabel={
              racePlaceLabel ||
              replay.session.countryName ||
              replay.session.circuitShortName
            }
            lapLabel={`L${primary.frame?.lapNumber ?? "—"}/${replay.totalLaps}`}
            fastestLap={dashboardSnapshot.fastestLap}
            fastestDriverAcronym={fastestDriverAcronym}
            weather={dashboardSnapshot.weather}
          />

          <div className="hidden lg:grid lg:grid-cols-[minmax(220px,248px)_minmax(0,1fr)_minmax(168px,200px)] lg:gap-3">
            <div className={mapStageClass}>
              <RaceLeaderboard
                variant="overlay"
                fillHeight
                rows={dashboardSnapshot.leaderboard}
                highlightDriverIds={highlightDriverIds}
              />
            </div>

            <TrackMap
              trackPath={replay.trackPath}
              trackSectors={replay.trackSectors}
              activeSector={activeSector}
              cars={cars}
              className={mapStageClass}
            />

            <div className={`${mapStageClass} overflow-hidden`}>
              <RaceLiveTiming
                variant="overlay"
                fillHeight
                dense={hasBattle}
                snapshot={dashboardSnapshot}
                colourA={colourA}
                colourB={hasBattle ? distinctColourB : undefined}
                labelA={replay.driver.acronym}
                labelB={hasBattle ? replay.driverB!.acronym : undefined}
              />
            </div>
          </div>

          <div className="lg:hidden">
            <TrackMap
              trackPath={replay.trackPath}
              trackSectors={replay.trackSectors}
              activeSector={activeSector}
              cars={cars}
              className={mapStageClass}
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <TrackMap
            trackPath={replay.trackPath}
            trackSectors={replay.trackSectors}
            activeSector={activeSector}
            cars={cars}
            className={mapStageClass}
          />
        </div>
      )}

      {dashboardSnapshot ? (
        <div className="grid gap-3 lg:hidden">
          <RaceLeaderboard
            rows={dashboardSnapshot.leaderboard}
            highlightDriverIds={highlightDriverIds}
          />
          <RaceLiveTiming
            snapshot={dashboardSnapshot}
            colourA={colourA}
            colourB={hasBattle ? distinctColourB : undefined}
            labelA={replay.driver.acronym}
            labelB={hasBattle ? replay.driverB!.acronym : undefined}
          />
        </div>
      ) : null}

      {hasBattle ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <OnboardHud
            driver={replay.driver}
            colour={colourA}
            frame={primary.frame}
            lap={currentLapA}
          />
          <OnboardHud
            driver={replay.driverB!}
            colour={distinctColourB}
            frame={secondary.frame}
            lap={currentLapB}
          />
        </div>
      ) : (
        <OnboardHud
          driver={replay.driver}
          colour={colourA}
          frame={primary.frame}
          lap={currentLapA}
        />
      )}

      <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
        <input
          type="range"
          min={0}
          max={replay.durationSeconds}
          step={0.1}
          value={timeSeconds}
          onChange={(event) => {
            setPlaying(false);
            setTimeSeconds(Number(event.target.value));
          }}
          className="w-full accent-[var(--accent)]"
          aria-label="Replay timeline"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="cta-button !w-auto px-5"
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            className="select-control !w-auto cursor-pointer"
            onClick={() => {
              setPlaying(false);
              setTimeSeconds(0);
            }}
          >
            Reset
          </button>
          <div className="ml-auto flex flex-wrap gap-1">
            {SPEEDS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSpeed(value)}
                className="select-control !w-auto cursor-pointer px-3"
                style={
                  speed === value
                    ? {
                        borderColor: "var(--accent)",
                        background: "var(--accent-soft)",
                      }
                    : undefined
                }
              >
                {value}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function findLap(laps: Lap[] | undefined, lapNumber: number | undefined) {
  if (!laps || lapNumber === undefined) {
    return undefined;
  }
  return laps.find((lap) => lap.lapNumber === lapNumber);
}
