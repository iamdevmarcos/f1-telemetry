import { buildTrackPath } from "@/lib/domain/replay";
import type { Lap, TrackPoint, TrackSectorPath } from "@/lib/domain/types";

const MIN_SECTOR_POINTS = 6;
const DEFAULT_MAX_POINTS = 220;

type TimedOutlinePoint = TrackPoint & { timestampMs: number };

function hasSectorTimes(lap: Lap): boolean {
  return (
    lap.sector1Seconds !== null &&
    lap.sector1Seconds > 0 &&
    lap.sector2Seconds !== null &&
    lap.sector2Seconds > 0 &&
    lap.sector3Seconds !== null &&
    lap.sector3Seconds > 0
  );
}

function toTimedPoints(
  locations: Array<{ date: string; x: number; y: number }>,
): TimedOutlinePoint[] {
  return locations
    .map((sample) => ({
      timestampMs: Date.parse(sample.date),
      x: sample.x,
      y: sample.y,
    }))
    .filter((sample) => Number.isFinite(sample.timestampMs))
    .sort((a, b) => a.timestampMs - b.timestampMs);
}

function splitByEqualCount(points: TrackPoint[]): [TrackPoint[], TrackPoint[], TrackPoint[]] {
  const count = points.length;
  const first = Math.max(2, Math.floor(count / 3));
  const second = Math.max(first + 2, Math.floor((count * 2) / 3));

  const s1 = points.slice(0, first + 1);
  const s2 = points.slice(first, second + 1);
  const s3 = points.slice(second);

  return [s1, s2, s3];
}

function splitBySectorTimes(
  points: TimedOutlinePoint[],
  lap: Lap,
): [TimedOutlinePoint[], TimedOutlinePoint[], TimedOutlinePoint[]] | null {
  if (!lap.dateStart || !hasSectorTimes(lap)) {
    return null;
  }

  const lapStartMs = Date.parse(lap.dateStart);
  if (!Number.isFinite(lapStartMs)) {
    return null;
  }

  const s1EndMs = lapStartMs + lap.sector1Seconds! * 1000;
  const s2EndMs = s1EndMs + lap.sector2Seconds! * 1000;

  const s1: TimedOutlinePoint[] = [];
  const s2: TimedOutlinePoint[] = [];
  const s3: TimedOutlinePoint[] = [];

  for (const point of points) {
    if (point.timestampMs <= s1EndMs) {
      s1.push(point);
    } else if (point.timestampMs <= s2EndMs) {
      s2.push(point);
    } else {
      s3.push(point);
    }
  }

  if (s1.length < 2 || s2.length < 2 || s3.length < 2) {
    return null;
  }

  // Keep path continuity at sector boundaries.
  if (s1.length > 0 && s2[0] !== s1[s1.length - 1]) {
    s2.unshift(s1[s1.length - 1]!);
  }
  if (s2.length > 0 && s3[0] !== s2[s2.length - 1]) {
    s3.unshift(s2[s2.length - 1]!);
  }

  return [s1, s2, s3];
}

function downsampleSector(
  points: TrackPoint[],
  budget: number,
): TrackPoint[] {
  return buildTrackPath(points, Math.max(MIN_SECTOR_POINTS, budget));
}

export function buildTrackSectorPaths(input: {
  outlineLocations: Array<{ date: string; x: number; y: number }>;
  lap: Lap | null;
  maxPoints?: number;
}): TrackSectorPath[] | null {
  const timed = toTimedPoints(input.outlineLocations);
  if (timed.length < 12) {
    return null;
  }

  const maxPoints = input.maxPoints ?? DEFAULT_MAX_POINTS;
  const timedSplit = input.lap ? splitBySectorTimes(timed, input.lap) : null;
  const rawSplit =
    timedSplit ??
    splitByEqualCount(timed.map(({ x, y }) => ({ x, y })));

  const sizes = rawSplit.map((sector) => sector.length);
  const total = sizes.reduce((sum, value) => sum + value, 0) || 1;

  const budgets = sizes.map((size) =>
    Math.max(
      MIN_SECTOR_POINTS,
      Math.round((size / total) * maxPoints),
    ),
  );

  const sectors = ([1, 2, 3] as const).map((sector, index) => {
    const points = downsampleSector(
      rawSplit[index]!.map(({ x, y }) => ({ x, y })),
      budgets[index]!,
    );
    return { sector, points };
  });

  if (sectors.some((entry) => entry.points.length < 2)) {
    return null;
  }

  return sectors;
}

export function resolveActiveSector(input: {
  lap: Lap | undefined;
  frameTimestamp: string | null | undefined;
}): 1 | 2 | 3 | null {
  const { lap, frameTimestamp } = input;
  if (!lap?.dateStart || !frameTimestamp || !hasSectorTimes(lap)) {
    return null;
  }

  const lapStartMs = Date.parse(lap.dateStart);
  const frameMs = Date.parse(frameTimestamp);
  if (!Number.isFinite(lapStartMs) || !Number.isFinite(frameMs)) {
    return null;
  }

  const elapsedSeconds = (frameMs - lapStartMs) / 1000;
  if (elapsedSeconds < 0) {
    return 1;
  }

  const s1 = lap.sector1Seconds!;
  const s2 = s1 + lap.sector2Seconds!;

  if (elapsedSeconds <= s1) {
    return 1;
  }
  if (elapsedSeconds <= s2) {
    return 2;
  }
  return 3;
}
