import "server-only";

import {
  buildReplayFrames,
  buildTrackPath,
  downsampleReplayFrames,
  pickOutlineLap,
  toTimedCarSamples,
  toTimedLocations,
} from "@/lib/domain/replay";
import { resolveLapWindow } from "@/lib/domain/compare";
import { isRaceAvailable } from "@/lib/domain/session";
import type { Driver, Lap, RaceReplay, ReplayFrame } from "@/lib/domain/types";
import type {
  OpenF1CarData,
  OpenF1Driver,
  OpenF1Location,
} from "@/lib/infrastructure/openf1/types";
import {
  fetchCarDataForWindow,
  fetchDrivers,
  fetchLaps,
  fetchLocationForWindow,
  fetchSession,
  OpenF1Error,
} from "@/lib/infrastructure/openf1/client";
import {
  mapDriver,
  mapLap,
  mapSession,
} from "@/lib/infrastructure/openf1/mappers";

const CHUNK_SIZE = 6;
const CONCURRENCY = 3;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function run(): Promise<void> {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]!);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  );

  return results;
}

function chunkLaps(laps: Lap[]): Lap[][] {
  const chunks: Lap[][] = [];
  for (let index = 0; index < laps.length; index += CHUNK_SIZE) {
    chunks.push(laps.slice(index, index + CHUNK_SIZE));
  }
  return chunks;
}

function chunkWindow(laps: Lap[]): { start: string; end: string } | null {
  const first = laps[0];
  const last = laps[laps.length - 1];
  if (!first || !last) {
    return null;
  }

  const startWindow = resolveLapWindow(first.dateStart, first.lapTimeSeconds);
  const endWindow = resolveLapWindow(last.dateStart, last.lapTimeSeconds);
  if (!startWindow || !endWindow) {
    return null;
  }

  return { start: startWindow.start, end: endWindow.end };
}

async function loadTimedLaps(
  sessionKey: number,
  driverNumber: number,
): Promise<Lap[]> {
  const rawLaps = await fetchLaps(sessionKey, driverNumber);
  return rawLaps
    .map(mapLap)
    .filter((lap) => lap.dateStart !== null && lap.lapTimeSeconds !== null)
    .sort((a, b) => a.lapNumber - b.lapNumber);
}

async function loadDriverTelemetry(
  sessionKey: number,
  driverNumber: number,
  laps: Lap[],
): Promise<{ locations: OpenF1Location[]; carData: OpenF1CarData[] }> {
  const chunks = chunkLaps(laps);
  const chunkPayloads = await mapPool(chunks, CONCURRENCY, async (chunk) => {
    const window = chunkWindow(chunk);
    if (!window) {
      return { locations: [], carData: [] };
    }

    const [locations, carData] = await Promise.all([
      fetchLocationForWindow(sessionKey, driverNumber, window.start, window.end),
      fetchCarDataForWindow(sessionKey, driverNumber, window.start, window.end),
    ]);

    return { locations, carData };
  });

  return {
    locations: chunkPayloads.flatMap((payload) => payload.locations),
    carData: chunkPayloads.flatMap((payload) => payload.carData),
  };
}

function buildFramesForDriver(input: {
  locations: OpenF1Location[];
  carData: OpenF1CarData[];
  laps: Lap[];
  raceStartMs: number;
}): ReplayFrame[] {
  return downsampleReplayFrames(
    buildReplayFrames({
      locations: toTimedLocations(input.locations),
      carSamples: toTimedCarSamples(input.carData),
      laps: input.laps,
      raceStartMs: input.raceStartMs,
    }),
  );
}

function resolveDriver(
  rawDrivers: OpenF1Driver[],
  driverNumber: number,
): Driver {
  const rawDriver = rawDrivers.find(
    (driver) => driver.driver_number === driverNumber,
  );
  if (!rawDriver) {
    throw new OpenF1Error("Driver not found", 404);
  }
  return mapDriver(rawDriver);
}

export async function getRaceReplay(input: {
  sessionId: string;
  driverId: string;
  driverBId?: string;
}): Promise<RaceReplay> {
  const sessionKey = Number(input.sessionId);
  const driverNumber = Number(input.driverId);
  const driverBNumber =
    input.driverBId !== undefined && input.driverBId !== ""
      ? Number(input.driverBId)
      : null;

  if (!Number.isFinite(sessionKey) || !Number.isFinite(driverNumber)) {
    throw new OpenF1Error("Invalid replay parameters", 400);
  }

  if (
    driverBNumber !== null &&
    (!Number.isFinite(driverBNumber) || driverBNumber === driverNumber)
  ) {
    throw new OpenF1Error("Optional driver B must be a different driver", 400);
  }

  const [rawSession, rawDrivers, lapsA] = await Promise.all([
    fetchSession(sessionKey),
    fetchDrivers(sessionKey),
    loadTimedLaps(sessionKey, driverNumber),
  ]);

  if (!rawSession) {
    throw new OpenF1Error("Session not found", 404);
  }

  const session = mapSession(rawSession);
  if (!isRaceAvailable(session)) {
    throw new OpenF1Error("Race has not happened yet", 400);
  }

  const driver = resolveDriver(rawDrivers, driverNumber);

  if (lapsA.length === 0) {
    throw new OpenF1Error("No timed laps available for replay", 404);
  }

  let lapsB: Lap[] | null = null;
  let driverB: Driver | null = null;

  if (driverBNumber !== null) {
    lapsB = await loadTimedLaps(sessionKey, driverBNumber);
    if (lapsB.length === 0) {
      throw new OpenF1Error("No timed laps available for driver B", 404);
    }
    driverB = resolveDriver(rawDrivers, driverBNumber);
  }

  const raceStartCandidates = [Date.parse(lapsA[0]!.dateStart!)];
  if (lapsB?.[0]?.dateStart) {
    raceStartCandidates.push(Date.parse(lapsB[0].dateStart));
  }
  const raceStartMs = Math.min(...raceStartCandidates);

  const telemetryAPromise = loadDriverTelemetry(sessionKey, driverNumber, lapsA);
  const telemetryBPromise =
    driverBNumber !== null && lapsB
      ? loadDriverTelemetry(sessionKey, driverBNumber, lapsB)
      : Promise.resolve(null);

  const [telemetryA, telemetryB] = await Promise.all([
    telemetryAPromise,
    telemetryBPromise,
  ]);

  if (telemetryA.locations.length === 0) {
    throw new OpenF1Error("Location data unavailable for this race", 404);
  }

  if (telemetryB && telemetryB.locations.length === 0) {
    throw new OpenF1Error("Location data unavailable for driver B", 404);
  }

  const outlineLap = pickOutlineLap(lapsA);
  const outlineWindow = outlineLap
    ? resolveLapWindow(outlineLap.dateStart, outlineLap.lapTimeSeconds)
    : null;

  let outlineLocations = telemetryA.locations;
  if (outlineWindow) {
    const outlineStartMs = Date.parse(outlineWindow.start);
    const outlineEndMs = Date.parse(outlineWindow.end);
    const filtered = telemetryA.locations.filter((sample) => {
      const timestampMs = Date.parse(sample.date);
      return timestampMs >= outlineStartMs && timestampMs <= outlineEndMs;
    });
    if (filtered.length > 40) {
      outlineLocations = filtered;
    }
  }

  const frames = buildFramesForDriver({
    locations: telemetryA.locations,
    carData: telemetryA.carData,
    laps: lapsA,
    raceStartMs,
  });

  if (frames.length === 0) {
    throw new OpenF1Error("Could not build replay frames", 404);
  }

  const framesB =
    telemetryB && lapsB
      ? buildFramesForDriver({
          locations: telemetryB.locations,
          carData: telemetryB.carData,
          laps: lapsB,
          raceStartMs,
        })
      : undefined;

  if (framesB && framesB.length === 0) {
    throw new OpenF1Error("Could not build replay frames for driver B", 404);
  }

  const durationSeconds = Math.max(
    frames[frames.length - 1]!.relativeTimeSeconds,
    framesB?.[framesB.length - 1]?.relativeTimeSeconds ?? 0,
  );

  const totalLaps = Math.max(
    lapsA[lapsA.length - 1]!.lapNumber,
    lapsB?.[lapsB.length - 1]?.lapNumber ?? 0,
  );

  return {
    session,
    driver,
    driverB: driverB ?? undefined,
    laps: lapsA,
    lapsB: lapsB ?? undefined,
    trackPath: buildTrackPath(
      outlineLocations.map((sample) => ({ x: sample.x, y: sample.y })),
    ),
    frames,
    framesB,
    durationSeconds,
    totalLaps,
  };
}
