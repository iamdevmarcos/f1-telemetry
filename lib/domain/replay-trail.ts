import type { ReplayFrame, TrackPoint } from "@/lib/domain/types";

const MAX_TRAIL_SECONDS = 8;
const MAX_TIME_GAP_SECONDS = 3.5;
/** Index jumps beyond this are treated as snap glitches / teleports. */
const SNAP_GLITCH_INDEX_FRACTION = 0.45;

export function trackSpan(points: TrackPoint[]): number {
  if (points.length === 0) {
    return 1;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return Math.max(Math.hypot(maxX - minX, maxY - minY), 1);
}

function distance(a: TrackPoint, b: TrackPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isClosedTrackPath(trackPath: TrackPoint[]): boolean {
  if (trackPath.length < 3) {
    return false;
  }
  const first = trackPath[0]!;
  const last = trackPath[trackPath.length - 1]!;
  return distance(first, last) <= trackSpan(trackPath) * 0.03;
}

export function nearestTrackIndex(
  point: TrackPoint,
  trackPath: TrackPoint[],
): number {
  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let index = 0; index < trackPath.length; index += 1) {
    const candidate = trackPath[index]!;
    const nextDistance = distance(point, candidate);
    if (nextDistance < bestDistance) {
      bestDistance = nextDistance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function walkTrackIndices(
  trackPath: TrackPoint[],
  fromIndex: number,
  toIndex: number,
  closed: boolean,
): TrackPoint[] {
  if (fromIndex === toIndex) {
    return [trackPath[toIndex]!];
  }

  const length = trackPath.length;

  if (!closed) {
    if (toIndex >= fromIndex) {
      return trackPath.slice(fromIndex, toIndex + 1);
    }
    return trackPath.slice(toIndex, fromIndex + 1).reverse();
  }

  const forwardSteps = (toIndex - fromIndex + length) % length;
  const backwardSteps = (fromIndex - toIndex + length) % length;

  if (forwardSteps <= backwardSteps) {
    const points: TrackPoint[] = [];
    for (let step = 0; step <= forwardSteps; step += 1) {
      points.push(trackPath[(fromIndex + step) % length]!);
    }
    return points;
  }

  const points: TrackPoint[] = [];
  for (let step = 0; step <= backwardSteps; step += 1) {
    points.push(trackPath[(fromIndex - step + length) % length]!);
  }
  return points;
}

function indexJumpFraction(
  fromIndex: number,
  toIndex: number,
  length: number,
  closed: boolean,
): number {
  if (length <= 1) {
    return 0;
  }

  const linear = Math.abs(toIndex - fromIndex);
  if (!closed) {
    return linear / length;
  }

  const forward = (toIndex - fromIndex + length) % length;
  const backward = (fromIndex - toIndex + length) % length;
  return Math.min(forward, backward) / length;
}

function shouldBreakSegment(input: {
  previous: ReplayFrame;
  current: ReplayFrame;
  previousIndex: number;
  currentIndex: number;
  trackLength: number;
  closed: boolean;
}): boolean {
  const timeGap =
    input.current.relativeTimeSeconds - input.previous.relativeTimeSeconds;
  if (timeGap > MAX_TIME_GAP_SECONDS) {
    return true;
  }

  const jump = indexJumpFraction(
    input.previousIndex,
    input.currentIndex,
    input.trackLength,
    input.closed,
  );

  return jump > SNAP_GLITCH_INDEX_FRACTION;
}

function collectWindowFrames(
  frames: ReplayFrame[],
  index: number,
): ReplayFrame[] {
  const current = frames[index]!;
  const earliestTime = current.relativeTimeSeconds - MAX_TRAIL_SECONDS;
  const window: ReplayFrame[] = [];

  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const frame = frames[cursor]!;
    if (frame.lapNumber !== current.lapNumber) {
      break;
    }
    if (frame.relativeTimeSeconds < earliestTime) {
      break;
    }
    if (!Number.isFinite(frame.x) || !Number.isFinite(frame.y)) {
      continue;
    }
    window.push(frame);
  }

  window.reverse();
  return window;
}

/**
 * Builds car trails snapped to the circuit outline so sparse GPS samples
 * never draw chords across corners when scrubbing.
 */
export function buildCarTrailSegments(
  frames: ReplayFrame[],
  index: number,
  trackPath: TrackPoint[],
): TrackPoint[][] {
  if (index < 0 || index >= frames.length || trackPath.length < 2) {
    return [];
  }

  const window = collectWindowFrames(frames, index);
  if (window.length < 2) {
    return [];
  }

  const closed = isClosedTrackPath(trackPath);
  const projected = window.map((frame) =>
    nearestTrackIndex({ x: frame.x, y: frame.y }, trackPath),
  );

  const segments: TrackPoint[][] = [];
  let segment: TrackPoint[] = [trackPath[projected[0]!]!];
  let previousIndex = projected[0]!;

  for (let cursor = 1; cursor < window.length; cursor += 1) {
    const frame = window[cursor]!;
    const previous = window[cursor - 1]!;
    const trackIndex = projected[cursor]!;

    if (
      shouldBreakSegment({
        previous,
        current: frame,
        previousIndex,
        currentIndex: trackIndex,
        trackLength: trackPath.length,
        closed,
      })
    ) {
      if (segment.length >= 2) {
        segments.push(segment);
      }
      segment = [trackPath[trackIndex]!];
      previousIndex = trackIndex;
      continue;
    }

    const walked = walkTrackIndices(
      trackPath,
      previousIndex,
      trackIndex,
      closed,
    );

    for (let pointIndex = 1; pointIndex < walked.length; pointIndex += 1) {
      segment.push(walked[pointIndex]!);
    }

    previousIndex = trackIndex;
  }

  if (segment.length >= 2) {
    segments.push(segment);
  }

  return segments;
}
