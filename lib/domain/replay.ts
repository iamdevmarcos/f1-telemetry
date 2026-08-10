import type {
  Lap,
  ReplayFrame,
  TrackPoint,
} from "@/lib/domain/types";

interface TimedCarSample {
  timestampMs: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
}

interface TimedLocationSample {
  timestampMs: number;
  timestamp: string;
  x: number;
  y: number;
}

export function buildTrackPath(
  points: TrackPoint[],
  maxPoints = 220,
): TrackPoint[] {
  if (points.length === 0) {
    return [];
  }

  if (points.length <= maxPoints) {
    return points;
  }

  const step = Math.ceil(points.length / maxPoints);
  const path = points.filter((_, index) => index % step === 0);
  const last = points[points.length - 1];
  if (last && path[path.length - 1] !== last) {
    path.push(last);
  }
  return path;
}

export function resolveLapNumber(
  timestampMs: number,
  laps: Lap[],
): number {
  let currentLap = laps[0]?.lapNumber ?? 1;

  for (const lap of laps) {
    if (!lap.dateStart) {
      continue;
    }
    const lapStartMs = Date.parse(lap.dateStart);
    if (!Number.isFinite(lapStartMs)) {
      continue;
    }
    if (timestampMs >= lapStartMs) {
      currentLap = lap.lapNumber;
    } else {
      break;
    }
  }

  return currentLap;
}

function findNearestCarSample(
  timestampMs: number,
  carSamples: TimedCarSample[],
): TimedCarSample | null {
  if (carSamples.length === 0) {
    return null;
  }

  let low = 0;
  let high = carSamples.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (carSamples[mid]!.timestampMs < timestampMs) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  const candidate = carSamples[low]!;
  const previous = carSamples[Math.max(0, low - 1)]!;
  const usePrevious =
    Math.abs(previous.timestampMs - timestampMs) <
    Math.abs(candidate.timestampMs - timestampMs);

  return usePrevious ? previous : candidate;
}

export function buildReplayFrames(input: {
  locations: TimedLocationSample[];
  carSamples: TimedCarSample[];
  laps: Lap[];
  raceStartMs: number;
}): ReplayFrame[] {
  const frames: ReplayFrame[] = [];

  for (const location of input.locations) {
    const car = findNearestCarSample(location.timestampMs, input.carSamples);
    frames.push({
      timestamp: location.timestamp,
      relativeTimeSeconds: (location.timestampMs - input.raceStartMs) / 1000,
      lapNumber: resolveLapNumber(location.timestampMs, input.laps),
      x: location.x,
      y: location.y,
      speed: car?.speed ?? 0,
      throttle: car?.throttle ?? 0,
      brake: car?.brake ?? 0,
      gear: car?.gear ?? 0,
      rpm: car?.rpm ?? 0,
    });
  }

  return frames.sort(
    (a, b) => a.relativeTimeSeconds - b.relativeTimeSeconds,
  );
}

export function downsampleReplayFrames(
  frames: ReplayFrame[],
  maxPoints = 3600,
): ReplayFrame[] {
  if (frames.length <= maxPoints) {
    return frames;
  }

  const step = Math.ceil(frames.length / maxPoints);
  const downsampled = frames.filter((_, index) => index % step === 0);
  const last = frames[frames.length - 1];
  if (last && downsampled[downsampled.length - 1] !== last) {
    downsampled.push(last);
  }
  return downsampled;
}

export function toTimedLocations(
  samples: Array<{ date: string; x: number; y: number }>,
): TimedLocationSample[] {
  return samples
    .map((sample) => ({
      timestampMs: Date.parse(sample.date),
      timestamp: sample.date,
      x: sample.x,
      y: sample.y,
    }))
    .filter((sample) => Number.isFinite(sample.timestampMs))
    .sort((a, b) => a.timestampMs - b.timestampMs);
}

export function toTimedCarSamples(
  samples: Array<{
    date: string;
    speed: number;
    throttle: number;
    brake: number;
    n_gear: number;
    rpm: number;
  }>,
): TimedCarSample[] {
  return samples
    .map((sample) => ({
      timestampMs: Date.parse(sample.date),
      speed: sample.speed ?? 0,
      throttle: sample.throttle ?? 0,
      brake: sample.brake ?? 0,
      gear: sample.n_gear ?? 0,
      rpm: sample.rpm ?? 0,
    }))
    .filter((sample) => Number.isFinite(sample.timestampMs))
    .sort((a, b) => a.timestampMs - b.timestampMs);
}

export function pickOutlineLap(laps: Lap[]): Lap | null {
  const flying = laps.find(
    (lap) =>
      lap.dateStart &&
      lap.lapTimeSeconds !== null &&
      lap.lapTimeSeconds >= 70 &&
      lap.lapNumber > 1,
  );
  if (flying) {
    return flying;
  }
  return laps.find((lap) => lap.dateStart && lap.lapTimeSeconds !== null) ?? null;
}
