import type {
  Driver,
  DriverLiveTiming,
  FastestLapInfo,
  IntervalSample,
  Lap,
  LeaderboardRow,
  PositionSample,
  RaceDashboard,
  RaceDashboardSnapshot,
  RaceGap,
  ReplayFrame,
  TyreStint,
  WeatherSample,
} from "@/lib/domain/types";

const INTERVAL_MIN_GAP_SECONDS = 5;
const POSITION_MIN_GAP_SECONDS = 2;
const WEATHER_MIN_GAP_SECONDS = 60;

export function parseRaceGap(value: number | string | null | undefined): RaceGap {
  if (value === null || value === undefined) {
    return { type: "leader" };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return { type: "seconds", value };
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toUpperCase();
    const lapMatch = trimmed.match(/^\+(\d+)\s*LAPS?$/);
    if (lapMatch) {
      return { type: "laps", value: Number(lapMatch[1]) };
    }

    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return { type: "seconds", value: asNumber };
    }
  }

  return { type: "leader" };
}

export function formatRaceGap(gap: RaceGap | null | undefined): string {
  if (!gap) {
    return "—";
  }

  if (gap.type === "leader") {
    return "Leader";
  }

  if (gap.type === "laps") {
    return `+${gap.value} LAP${gap.value === 1 ? "" : "S"}`;
  }

  return `+${gap.value.toFixed(3)}`;
}

function downsampleByDriverTime<T extends { driverId: string; relativeTimeSeconds: number }>(
  samples: T[],
  minGapSeconds: number,
): T[] {
  const lastByDriver = new Map<string, number>();
  const result: T[] = [];

  for (const sample of samples) {
    const previous = lastByDriver.get(sample.driverId);
    if (
      previous !== undefined &&
      sample.relativeTimeSeconds - previous < minGapSeconds
    ) {
      continue;
    }
    lastByDriver.set(sample.driverId, sample.relativeTimeSeconds);
    result.push(sample);
  }

  return result;
}

function downsampleWeather(
  samples: WeatherSample[],
  minGapSeconds: number,
): WeatherSample[] {
  if (samples.length === 0) {
    return [];
  }

  const result: WeatherSample[] = [];
  let lastTime = -Infinity;

  for (const sample of samples) {
    if (sample.relativeTimeSeconds - lastTime < minGapSeconds) {
      continue;
    }
    result.push(sample);
    lastTime = sample.relativeTimeSeconds;
  }

  return result;
}

export function findFastestLap(laps: Lap[]): FastestLapInfo | null {
  let best: FastestLapInfo | null = null;

  for (const lap of laps) {
    if (lap.lapTimeSeconds === null || lap.lapTimeSeconds <= 0) {
      continue;
    }
    if (!best || lap.lapTimeSeconds < best.lapTimeSeconds) {
      best = {
        driverId: lap.driverId,
        lapNumber: lap.lapNumber,
        lapTimeSeconds: lap.lapTimeSeconds,
      };
    }
  }

  return best;
}

export function buildRaceDashboard(input: {
  drivers: Driver[];
  raceStartMs: number;
  positions: Array<{
    date: string;
    driver_number: number;
    position: number;
  }>;
  intervals: Array<{
    date: string;
    driver_number: number;
    gap_to_leader: number | string | null;
    interval: number | string | null;
  }>;
  stints: Array<{
    driver_number: number;
    stint_number: number;
    compound: string;
    lap_start: number;
    lap_end: number | null;
    tyre_age_at_start: number;
  }>;
  weather: Array<{
    date: string;
    air_temperature: number | null;
    track_temperature: number | null;
    humidity: number | null;
    rainfall: number | boolean | null;
    wind_speed: number | null;
  }>;
  sessionLaps: Lap[];
}): RaceDashboard {
  const positions: PositionSample[] = input.positions
    .map((sample) => {
      const timestampMs = Date.parse(sample.date);
      return {
        relativeTimeSeconds: (timestampMs - input.raceStartMs) / 1000,
        driverId: String(sample.driver_number),
        position: sample.position,
      };
    })
    .filter((sample) => Number.isFinite(sample.relativeTimeSeconds))
    .sort((a, b) => a.relativeTimeSeconds - b.relativeTimeSeconds);

  const intervals: IntervalSample[] = input.intervals
    .map((sample) => {
      const timestampMs = Date.parse(sample.date);
      return {
        relativeTimeSeconds: (timestampMs - input.raceStartMs) / 1000,
        driverId: String(sample.driver_number),
        gapToLeader: parseRaceGap(sample.gap_to_leader),
        interval: parseRaceGap(sample.interval),
      };
    })
    .filter((sample) => Number.isFinite(sample.relativeTimeSeconds))
    .sort((a, b) => a.relativeTimeSeconds - b.relativeTimeSeconds);

  const stints: TyreStint[] = input.stints
    .map((stint) => ({
      driverId: String(stint.driver_number),
      stintNumber: stint.stint_number,
      compound: (stint.compound || "UNKNOWN").toUpperCase(),
      lapStart: stint.lap_start,
      lapEnd: stint.lap_end,
      tyreAgeAtStart: stint.tyre_age_at_start ?? 0,
    }))
    .sort((a, b) => a.lapStart - b.lapStart || a.stintNumber - b.stintNumber);

  const weather: WeatherSample[] = input.weather
    .map((sample) => {
      const timestampMs = Date.parse(sample.date);
      return {
        relativeTimeSeconds: (timestampMs - input.raceStartMs) / 1000,
        airTempC: sample.air_temperature,
        trackTempC: sample.track_temperature,
        humidityPercent: sample.humidity,
        rainfall: Boolean(sample.rainfall),
        windSpeed: sample.wind_speed,
      };
    })
    .filter((sample) => Number.isFinite(sample.relativeTimeSeconds))
    .sort((a, b) => a.relativeTimeSeconds - b.relativeTimeSeconds);

  return {
    drivers: input.drivers,
    raceStartMs: input.raceStartMs,
    positions: downsampleByDriverTime(positions, POSITION_MIN_GAP_SECONDS),
    intervals: downsampleByDriverTime(intervals, INTERVAL_MIN_GAP_SECONDS),
    stints,
    weather: downsampleWeather(weather, WEATHER_MIN_GAP_SECONDS),
    sessionLaps: input.sessionLaps,
    fastestLap: findFastestLap(input.sessionLaps),
  };
}

function latestAtOrBefore<T extends { relativeTimeSeconds: number }>(
  samples: T[],
  timeSeconds: number,
): T | null {
  if (samples.length === 0) {
    return null;
  }

  let low = 0;
  let high = samples.length - 1;
  let best = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (samples[mid]!.relativeTimeSeconds <= timeSeconds) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best >= 0 ? samples[best]! : null;
}

function latestByDriverAt<T extends { driverId: string; relativeTimeSeconds: number }>(
  samples: T[],
  timeSeconds: number,
): Map<string, T> {
  const latest = new Map<string, T>();

  for (const sample of samples) {
    if (sample.relativeTimeSeconds > timeSeconds) {
      continue;
    }
    const previous = latest.get(sample.driverId);
    if (
      !previous ||
      sample.relativeTimeSeconds >= previous.relativeTimeSeconds
    ) {
      latest.set(sample.driverId, sample);
    }
  }

  return latest;
}

function lapNumberAtTime(
  sessionLaps: Lap[],
  driverId: string,
  absoluteMs: number,
): number | null {
  let lapNumber: number | null = null;

  for (const lap of sessionLaps) {
    if (lap.driverId !== driverId || !lap.dateStart) {
      continue;
    }
    const lapStartMs = Date.parse(lap.dateStart);
    if (!Number.isFinite(lapStartMs) || lapStartMs > absoluteMs) {
      continue;
    }
    if (lapNumber === null || lap.lapNumber > lapNumber) {
      lapNumber = lap.lapNumber;
    }
  }

  return lapNumber;
}

export function resolveStintAtLap(
  stints: TyreStint[],
  driverId: string,
  lapNumber: number | null | undefined,
): TyreStint | null {
  if (!lapNumber) {
    return null;
  }

  const driverStints = stints.filter((stint) => stint.driverId === driverId);
  let current: TyreStint | null = null;

  for (const stint of driverStints) {
    if (stint.lapStart > lapNumber) {
      break;
    }
    if (stint.lapEnd !== null && lapNumber > stint.lapEnd) {
      continue;
    }
    current = stint;
  }

  return current;
}

export function tyreAgeAtLap(
  stint: TyreStint | null,
  lapNumber: number | null | undefined,
): number | null {
  if (!stint || !lapNumber) {
    return null;
  }
  return stint.tyreAgeAtStart + Math.max(0, lapNumber - stint.lapStart);
}

function compoundLabel(compound: string | null): string | null {
  if (!compound) {
    return null;
  }
  if (compound.startsWith("SOFT")) return "S";
  if (compound.startsWith("MEDIUM")) return "M";
  if (compound.startsWith("HARD")) return "H";
  if (compound.startsWith("INTER")) return "I";
  if (compound.startsWith("WET")) return "W";
  return compound.slice(0, 1);
}

export function resolveCompoundCode(compound: string | null): string | null {
  return compoundLabel(compound);
}

function buildLiveTiming(input: {
  driver: Driver;
  laps: Lap[];
  frames: ReplayFrame[];
  frame: ReplayFrame | null;
  timeSeconds: number;
  dashboard: RaceDashboard;
}): DriverLiveTiming {
  const lapNumber = input.frame?.lapNumber ?? null;
  const completedLaps = input.laps.filter(
    (lap) =>
      lap.lapTimeSeconds !== null &&
      lapNumber !== null &&
      lap.lapNumber < lapNumber,
  );

  const lastLap = completedLaps[completedLaps.length - 1] ?? null;
  let bestLapSeconds: number | null = null;
  for (const lap of completedLaps) {
    if (lap.lapTimeSeconds === null) {
      continue;
    }
    if (bestLapSeconds === null || lap.lapTimeSeconds < bestLapSeconds) {
      bestLapSeconds = lap.lapTimeSeconds;
    }
  }

  const currentLap = input.laps.find((lap) => lap.lapNumber === lapNumber);
  let currentLapElapsedSeconds: number | null = null;
  if (currentLap?.dateStart && input.frame) {
    const lapStartMs = Date.parse(currentLap.dateStart);
    const frameMs = Date.parse(input.frame.timestamp);
    if (Number.isFinite(lapStartMs) && Number.isFinite(frameMs)) {
      currentLapElapsedSeconds = Math.max(0, (frameMs - lapStartMs) / 1000);
    }
  }

  const stint = resolveStintAtLap(
    input.dashboard.stints,
    input.driver.id,
    lapNumber,
  );

  const positionSample = latestAtOrBefore(
    input.dashboard.positions.filter(
      (sample) => sample.driverId === input.driver.id,
    ),
    input.timeSeconds,
  );

  const intervalSample = latestAtOrBefore(
    input.dashboard.intervals.filter(
      (sample) => sample.driverId === input.driver.id,
    ),
    input.timeSeconds,
  );

  const deltaToBestSeconds =
    currentLapElapsedSeconds !== null && bestLapSeconds !== null
      ? Number((currentLapElapsedSeconds - bestLapSeconds).toFixed(3))
      : null;

  return {
    driverId: input.driver.id,
    currentLapNumber: lapNumber,
    currentLapElapsedSeconds,
    lastLapSeconds: lastLap?.lapTimeSeconds ?? null,
    bestLapSeconds,
    deltaToBestSeconds,
    compound: resolveCompoundCode(stint?.compound ?? null),
    tyreAgeLaps: tyreAgeAtLap(stint, lapNumber),
    position: positionSample?.position ?? null,
    gapToLeader: intervalSample?.gapToLeader ?? null,
    interval: intervalSample?.interval ?? null,
  };
}

export function snapshotRaceDashboard(input: {
  dashboard: RaceDashboard;
  timeSeconds: number;
  focusedDriver: Driver;
  focusedLaps: Lap[];
  focusedFrames: ReplayFrame[];
  focusedFrame: ReplayFrame | null;
  focusedDriverB?: Driver;
  focusedLapsB?: Lap[];
  focusedFramesB?: ReplayFrame[];
  focusedFrameB?: ReplayFrame | null;
}): RaceDashboardSnapshot {
  const driversById = new Map(
    input.dashboard.drivers.map((driver) => [driver.id, driver]),
  );

  const latestPositions = latestByDriverAt(
    input.dashboard.positions,
    input.timeSeconds,
  );

  const latestIntervals = latestByDriverAt(
    input.dashboard.intervals,
    input.timeSeconds,
  );

  const absoluteMs =
    input.dashboard.raceStartMs + input.timeSeconds * 1000;

  const leaderboard: LeaderboardRow[] = Array.from(latestPositions.values())
    .map((sample) => {
      const driver = driversById.get(sample.driverId);
      if (!driver) {
        return null;
      }

      const interval = latestIntervals.get(sample.driverId);
      const driverLapNumber = lapNumberAtTime(
        input.dashboard.sessionLaps,
        sample.driverId,
        absoluteMs,
      );
      const activeStint = resolveStintAtLap(
        input.dashboard.stints,
        sample.driverId,
        driverLapNumber,
      );

      return {
        position: sample.position,
        driver,
        gapToLeader: interval?.gapToLeader ?? { type: "leader" as const },
        interval: interval?.interval ?? { type: "leader" as const },
        compound: resolveCompoundCode(activeStint?.compound ?? null),
        tyreAgeLaps: tyreAgeAtLap(activeStint, driverLapNumber),
      } satisfies LeaderboardRow;
    })
    .filter((row): row is LeaderboardRow => row !== null)
    .sort((a, b) => a.position - b.position);

  const weather =
    latestAtOrBefore(input.dashboard.weather, input.timeSeconds) ?? null;

  const focused = buildLiveTiming({
    driver: input.focusedDriver,
    laps: input.focusedLaps,
    frames: input.focusedFrames,
    frame: input.focusedFrame,
    timeSeconds: input.timeSeconds,
    dashboard: input.dashboard,
  });

  const focusedB =
    input.focusedDriverB && input.focusedLapsB && input.focusedFramesB
      ? buildLiveTiming({
          driver: input.focusedDriverB,
          laps: input.focusedLapsB,
          frames: input.focusedFramesB,
          frame: input.focusedFrameB ?? null,
          timeSeconds: input.timeSeconds,
          dashboard: input.dashboard,
        })
      : null;

  return {
    leaderboard,
    weather,
    fastestLap: input.dashboard.fastestLap,
    focused,
    focusedB,
  };
}
