import type { ReplayFrame, TrackPoint } from "@/lib/domain/types";

const MAX_TRAIL_SECONDS = 10;
const MAX_TIME_GAP_SECONDS = 3.5;
const TELEPORT_SPAN_RATIO = 0.12;
const MAX_SPEED_UNITS_PER_SECOND = 1400;

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

function isTeleportJump(
  previous: ReplayFrame,
  current: ReplayFrame,
  span: number,
): boolean {
  const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
  const timeGap = Math.max(
    current.relativeTimeSeconds - previous.relativeTimeSeconds,
    0,
  );

  if (timeGap > MAX_TIME_GAP_SECONDS) {
    return true;
  }

  const allowedBySpeed =
    Math.max(timeGap, 0.2) * MAX_SPEED_UNITS_PER_SECOND;
  const hardCap = span * TELEPORT_SPAN_RATIO;

  return distance > Math.max(allowedBySpeed, hardCap * 0.35) &&
    distance > hardCap;
}

export function buildCarTrailSegments(
  frames: ReplayFrame[],
  index: number,
  span: number,
): TrackPoint[][] {
  if (index < 0 || index >= frames.length) {
    return [];
  }

  const current = frames[index]!;
  if (!Number.isFinite(current.x) || !Number.isFinite(current.y)) {
    return [];
  }

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

  if (window.length < 2) {
    return [];
  }

  const segments: TrackPoint[][] = [];
  let segment: TrackPoint[] = [{ x: window[0]!.x, y: window[0]!.y }];

  for (let cursor = 1; cursor < window.length; cursor += 1) {
    const frame = window[cursor]!;
    const previous = window[cursor - 1]!;
    const point = { x: frame.x, y: frame.y };

    if (isTeleportJump(previous, frame, span)) {
      if (segment.length >= 2) {
        segments.push(segment);
      }
      segment = [point];
      continue;
    }

    segment.push(point);
  }

  if (segment.length >= 2) {
    segments.push(segment);
  }

  return segments;
}
